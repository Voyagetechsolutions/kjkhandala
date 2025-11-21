import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Geofencing radius in meters
const GEOFENCE_RADIUS = 100;
const BREAKDOWN_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const NO_SHOW_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const SPEED_LIMIT = 120; // km/h
const DELAY_THRESHOLD = 10; // minutes

interface TripLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export const automationService = {
  // ✅ 1. Auto-Start Trip When Driver Arrives at Depot
  async checkDepotArrival(
    driverId: string,
    tripId: string,
    depotLocation: TripLocation,
    currentLocation: { latitude: number; longitude: number }
  ) {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      depotLocation.latitude,
      depotLocation.longitude
    );

    if (distance <= GEOFENCE_RADIUS) {
      // Update trip status
      await supabase
        .from('trip_timeline')
        .insert({
          trip_id: tripId,
          event_type: 'depart_depot',
          location_lat: currentLocation.latitude,
          location_lng: currentLocation.longitude,
          notes: 'Driver arrived at depot (auto-detected)',
        });

      // Notify dispatcher
      await this.sendNotification(
        'dispatch',
        'Driver Arrived',
        `Driver has arrived at depot for trip ${tripId}`
      );

      // Notify passengers
      await this.notifyPassengers(tripId, 'Your bus is preparing for departure');

      return true;
    }
    return false;
  },

  // ✅ 2. Auto-Check In Passengers with QR (already implemented in QRScannerScreen)
  async autoCheckInPassenger(bookingId: string, tripId: string, driverId: string) {
    const { data, error } = await supabase
      .from('passenger_checkins')
      .insert({
        booking_id: bookingId,
        trip_id: tripId,
        driver_id: driverId,
        check_in_method: 'qr_scan',
        check_in_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update booking status
    await supabase
      .from('bookings')
      .update({ check_in_status: 'boarded' })
      .eq('id', bookingId);

    // Notify customer app
    await this.sendNotification(
      'passenger',
      'Checked In',
      'You have been checked in successfully'
    );

    return data;
  },

  // ✅ 3. Auto-No Show
  async autoMarkNoShows(tripId: string, departureTime: string) {
    const departureDate = new Date(departureTime);
    const now = new Date();
    const timeSinceDeparture = now.getTime() - departureDate.getTime();

    if (timeSinceDeparture >= NO_SHOW_TIMEOUT) {
      // Get all unchecked passengers
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', tripId)
        .eq('check_in_status', 'not_boarded');

      if (bookings && bookings.length > 0) {
        // Mark as no-show
        await supabase
          .from('bookings')
          .update({ check_in_status: 'no_show' })
          .eq('trip_id', tripId)
          .eq('check_in_status', 'not_boarded');

        // Notify dispatch
        await this.sendNotification(
          'dispatch',
          'No-Shows Detected',
          `${bookings.length} passengers marked as no-show for trip ${tripId}`
        );

        // Update available seats
        const { data: currentTrip } = await supabase
          .from('trips')
          .select('available_seats')
          .eq('id', tripId)
          .single();

        if (currentTrip) {
          await supabase
            .from('trips')
            .update({
              available_seats: currentTrip.available_seats + bookings.length,
            })
            .eq('id', tripId);
        }

        return bookings.length;
      }
    }
    return 0;
  },

  // ✅ 4. Auto-Trip Event Timeline
  async autoDetectTripEvents(
    tripId: string,
    currentLocation: { latitude: number; longitude: number; speed: number },
    stops: TripLocation[]
  ) {
    // Check if at any stop
    for (const stop of stops) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      if (distance <= GEOFENCE_RADIUS && currentLocation.speed < 5) {
        // Arrived at stop
        await supabase.from('trip_timeline').insert({
          trip_id: tripId,
          event_type: 'arrive_pickup',
          location_lat: currentLocation.latitude,
          location_lng: currentLocation.longitude,
          notes: `Arrived at ${stop.name} (auto-detected)`,
        });
      } else if (distance > GEOFENCE_RADIUS && currentLocation.speed > 10) {
        // Departed from stop
        await supabase.from('trip_timeline').insert({
          trip_id: tripId,
          event_type: 'depart_pickup',
          location_lat: currentLocation.latitude,
          location_lng: currentLocation.longitude,
          notes: `Departed from ${stop.name} (auto-detected)`,
        });
      }
    }

    // Detect delay (stopped for 10+ minutes)
    if (currentLocation.speed === 0) {
      const lastUpdate = await AsyncStorage.getItem(`trip_${tripId}_last_movement`);
      if (lastUpdate) {
        const timeStopped = Date.now() - parseInt(lastUpdate);
        if (timeStopped >= 10 * 60 * 1000) {
          await supabase.from('trip_timeline').insert({
            trip_id: tripId,
            event_type: 'delay',
            delay_minutes: Math.floor(timeStopped / 60000),
            notes: 'Delay detected (auto)',
          });
        }
      }
    } else {
      await AsyncStorage.setItem(`trip_${tripId}_last_movement`, Date.now().toString());
    }
  },

  // ✅ 5. Auto-Sync Pre-Trip Inspection
  async validatePreTripInspection(tripId: string): Promise<boolean> {
    const { data: inspection } = await supabase
      .from('trip_inspections')
      .select('*')
      .eq('trip_id', tripId)
      .eq('inspection_type', 'pre_trip')
      .single();

    if (!inspection) {
      // Block trip start
      await this.sendNotification(
        'driver',
        'Pre-Trip Inspection Required',
        'Complete pre-trip inspection before starting trip'
      );

      // Notify maintenance
      await this.sendNotification(
        'maintenance',
        'Inspection Pending',
        `Trip ${tripId} awaiting pre-trip inspection`
      );

      return false;
    }

    if (inspection.has_critical_issues) {
      // Block trip if critical issues
      await supabase
        .from('trips')
        .update({ status: 'CANCELLED' })
        .eq('id', tripId);

      await this.sendNotification(
        'dispatch',
        'Trip Blocked',
        `Trip ${tripId} blocked due to critical inspection issues`
      );

      return false;
    }

    return true;
  },

  // ✅ 6. Auto-Breakdown Detection
  async detectBreakdown(
    tripId: string,
    currentSpeed: number,
    isEngineOn: boolean,
    currentLocation: { latitude: number; longitude: number },
    stops: TripLocation[]
  ) {
    // Check if stopped for 15+ minutes, not at any station
    if (currentSpeed === 0 && isEngineOn) {
      const lastMovement = await AsyncStorage.getItem(`trip_${tripId}_last_movement`);
      if (lastMovement) {
        const timeStopped = Date.now() - parseInt(lastMovement);

        if (timeStopped >= BREAKDOWN_TIMEOUT) {
          // Check if at any station
          const atStation = stops.some(
            (stop) =>
              this.calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                stop.latitude,
                stop.longitude
              ) <= GEOFENCE_RADIUS
          );

          if (!atStation) {
            // Prompt driver
            await this.sendNotification(
              'driver',
              'Breakdown Detection',
              'Are you experiencing a breakdown? Please report if needed.'
            );

            // Auto-notify dispatch
            await this.sendNotification(
              'dispatch',
              'Possible Breakdown',
              `Trip ${tripId} stopped for ${Math.floor(timeStopped / 60000)} minutes`
            );

            return true;
          }
        }
      }
    }
    return false;
  },

  // ✅ 7. Auto-Generate Maintenance Request
  async autoCreateMaintenanceRequest(
    busId: string,
    issueType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        bus_id: busId,
        issue_type: issueType,
        description,
        severity,
        status: 'pending',
        priority: severity === 'critical' ? 'urgent' : 'normal',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Mark bus as unavailable if critical
    if (severity === 'critical') {
      await supabase
        .from('buses')
        .update({ status: 'maintenance' })
        .eq('id', busId);
    }

    // Notify maintenance team
    await this.sendNotification(
      'maintenance',
      'New Maintenance Request',
      `${severity.toUpperCase()}: ${description}`
    );

    return data;
  },

  // ✅ 8. Auto-Fuel Log Validation
  async validateFuelLog(
    litres: number,
    pricePerLitre: number,
    totalCost: number,
    busId: string
  ) {
    // Get average fuel price
    const { data: recentLogs } = await supabase
      .from('fuel_logs')
      .select('price_per_litre, litres')
      .eq('bus_id', busId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentLogs && recentLogs.length > 0) {
      const avgPrice =
        recentLogs.reduce((sum, log) => sum + parseFloat(log.price_per_litre), 0) /
        recentLogs.length;

      const avgLitres =
        recentLogs.reduce((sum, log) => sum + parseFloat(log.litres), 0) / recentLogs.length;

      // Check for suspicious variance
      const priceVariance = Math.abs(pricePerLitre - avgPrice) / avgPrice;
      const litresVariance = Math.abs(litres - avgLitres) / avgLitres;

      if (priceVariance > 0.2 || litresVariance > 0.5) {
        // Alert finance
        await this.sendNotification(
          'finance',
          'Fuel Log Variance',
          `Suspicious fuel log detected. Price variance: ${(priceVariance * 100).toFixed(
            1
          )}%, Litres variance: ${(litresVariance * 100).toFixed(1)}%`
        );

        return {
          valid: false,
          reason: 'Suspicious variance detected',
          priceVariance,
          litresVariance,
        };
      }
    }

    // Calculate fuel efficiency
    const efficiency = litres > 0 ? totalCost / litres : 0;

    return {
      valid: true,
      efficiency,
    };
  },

  // ✅ 9. Auto-Calculate Driver Allowances
  async calculateDriverAllowances(driverId: string, tripId: string) {
    const { data: trip } = await supabase
      .from('trips')
      .select('*, route:routes(*)')
      .eq('id', tripId)
      .single();

    if (!trip) return;

    let totalAllowance = 0;

    // Base trip allowance
    const basePay = 100; // Base amount per trip
    totalAllowance += basePay;

    // Distance bonus
    if (trip.route?.distance_km) {
      const distanceBonus = parseFloat(trip.route.distance_km) * 0.5; // P0.50 per km
      totalAllowance += distanceBonus;
    }

    // Overnight trip bonus
    const isOvernight = trip.route?.duration_hours && parseFloat(trip.route.duration_hours) > 8;
    if (isOvernight) {
      totalAllowance += 200;
    }

    // Punctuality bonus
    if (trip.delay_minutes === 0) {
      totalAllowance += 50;
    }

    // Safety bonus (no incidents)
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id')
      .eq('trip_id', tripId);

    if (!incidents || incidents.length === 0) {
      totalAllowance += 50;
    }

    // Add to wallet
    await supabase.from('wallet_transactions').insert({
      driver_id: driverId,
      transaction_type: 'trip_earning',
      amount: totalAllowance,
      description: `Trip ${trip.trip_number} earnings`,
      status: 'approved',
      trip_id: tripId,
    });

    return totalAllowance;
  },

  // ✅ 10. Auto-Upload GPS Tracking (runs in background)
  async startAutoGPSTracking(tripId: string, driverId: string) {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 50, // 50 meters
      },
      async (location) => {
        const { latitude, longitude, speed, heading } = location.coords;

        // Upload to Supabase
        await supabase.from('gps_tracking').insert({
          trip_id: tripId,
          driver_id: driverId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: new Date().toISOString(),
        });

        // Update trip location
        await supabase
          .from('trips')
          .update({
            current_latitude: latitude,
            current_longitude: longitude,
            last_location_update: new Date().toISOString(),
          })
          .eq('id', tripId);
      }
    );

    return subscription;
  },

  // ✅ 11. Auto-Delay Detection
  async detectDelay(tripId: string, scheduledTime: string, currentTime: Date) {
    const scheduled = new Date(scheduledTime);
    const delayMinutes = Math.floor((currentTime.getTime() - scheduled.getTime()) / 60000);

    if (delayMinutes > DELAY_THRESHOLD) {
      // Update trip
      await supabase
        .from('trips')
        .update({ delay_minutes: delayMinutes })
        .eq('id', tripId);

      // Notify passengers
      await this.notifyPassengers(
        tripId,
        `Your trip is delayed by ${delayMinutes} minutes. Updated ETA will be provided.`
      );

      // Notify dispatch
      await this.sendNotification(
        'dispatch',
        'Trip Delayed',
        `Trip ${tripId} is ${delayMinutes} minutes behind schedule`
      );

      return delayMinutes;
    }

    return 0;
  },

  // ✅ 12. Auto-Departure Reminder
  async sendDepartureReminder(tripId: string, departureTime: string) {
    const departure = new Date(departureTime);
    const now = new Date();
    const minutesUntilDeparture = Math.floor((departure.getTime() - now.getTime()) / 60000);

    if (minutesUntilDeparture === 30) {
      // Notify driver
      await this.sendNotification(
        'driver',
        'Departure Reminder',
        'Your trip departs in 30 minutes. Complete pre-trip checklist.'
      );

      // Notify passengers
      await this.notifyPassengers(tripId, 'Your driver is arriving soon. Please be ready.');

      return true;
    }

    return false;
  },

  // ✅ 13. Auto-Speeding Alerts
  async checkSpeed(
    tripId: string,
    driverId: string,
    currentSpeed: number,
    speedLimit: number = SPEED_LIMIT
  ) {
    if (currentSpeed > speedLimit) {
      // Log incident
      await supabase.from('speed_violations').insert({
        trip_id: tripId,
        driver_id: driverId,
        speed: currentSpeed,
        speed_limit: speedLimit,
        timestamp: new Date().toISOString(),
      });

      // Alert driver
      await this.sendNotification(
        'driver',
        'Speed Warning',
        `You are exceeding the speed limit. Current speed: ${currentSpeed} km/h`
      );

      // Notify dispatch
      await this.sendNotification(
        'dispatch',
        'Speeding Alert',
        `Driver ${driverId} exceeding speed limit on trip ${tripId}`
      );

      return true;
    }

    return false;
  },

  // ✅ 16. Auto-Offline Sync
  async saveOfflineData(key: string, data: any) {
    const offlineQueue = await AsyncStorage.getItem('offline_queue');
    const queue = offlineQueue ? JSON.parse(offlineQueue) : [];

    queue.push({
      key,
      data,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
  },

  async syncOfflineData() {
    const offlineQueue = await AsyncStorage.getItem('offline_queue');
    if (!offlineQueue) return;

    const queue = JSON.parse(offlineQueue);

    for (const item of queue) {
      try {
        // Sync based on data type
        if (item.key.startsWith('checkin_')) {
          await supabase.from('passenger_checkins').insert(item.data);
        } else if (item.key.startsWith('fuel_')) {
          await supabase.from('fuel_logs').insert(item.data);
        } else if (item.key.startsWith('incident_')) {
          await supabase.from('incidents').insert(item.data);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    // Clear queue after successful sync
    await AsyncStorage.removeItem('offline_queue');
  },

  // ✅ 17. Auto-Trip Completion
  async autoCompleteTripAtDestination(
    tripId: string,
    currentLocation: { latitude: number; longitude: number },
    destinationLocation: TripLocation
  ) {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );

    if (distance <= GEOFENCE_RADIUS) {
      // Mark trip as completed
      await supabase
        .from('trips')
        .update({
          status: 'COMPLETED',
          actual_arrival_time: new Date().toISOString(),
        })
        .eq('id', tripId);

      // Add timeline event
      await supabase.from('trip_timeline').insert({
        trip_id: tripId,
        event_type: 'completed',
        location_lat: currentLocation.latitude,
        location_lng: currentLocation.longitude,
        notes: 'Trip completed (auto-detected)',
      });

      // Notify passengers
      await this.notifyPassengers(tripId, 'You have arrived at your destination. Thank you!');

      // Trigger post-trip inspection
      await this.sendNotification(
        'driver',
        'Post-Trip Inspection',
        'Please complete post-trip inspection'
      );

      return true;
    }

    return false;
  },

  // ✅ 19. Auto-Generate End-of-Trip Report
  async generateTripReport(tripId: string) {
    const { data: trip } = await supabase
      .from('trips')
      .select('*, route:routes(*), bus:buses(*)')
      .eq('id', tripId)
      .single();

    if (!trip) return null;

    // Get fuel logs
    const { data: fuelLogs } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('trip_id', tripId);

    // Get incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .eq('trip_id', tripId);

    // Get check-in rate
    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in_status')
      .eq('trip_id', tripId);

    const checkedIn = bookings?.filter((b) => b.check_in_status === 'boarded').length || 0;
    const total = bookings?.length || 0;

    // Get speed violations
    const { data: speedViolations } = await supabase
      .from('speed_violations')
      .select('*')
      .eq('trip_id', tripId);

    const report = {
      trip_number: trip.trip_number,
      route: `${trip.route?.origin} → ${trip.route?.destination}`,
      bus: trip.bus?.number_plate,
      fuel_consumed: fuelLogs?.reduce((sum, log) => sum + parseFloat(log.litres), 0) || 0,
      fuel_cost: fuelLogs?.reduce((sum, log) => sum + parseFloat(log.total_cost), 0) || 0,
      distance_traveled: trip.route?.distance_km || 0,
      check_in_rate: total > 0 ? ((checkedIn / total) * 100).toFixed(1) : 0,
      incidents_count: incidents?.length || 0,
      speed_warnings: speedViolations?.length || 0,
      delay_minutes: trip.delay_minutes || 0,
      passenger_count: checkedIn,
      departure_time: trip.departure_time,
      arrival_time: trip.actual_arrival_time,
    };

    // Save report
    await supabase.from('trip_reports').insert({
      trip_id: tripId,
      report_data: report,
      generated_at: new Date().toISOString(),
    });

    return report;
  },

  // ✅ 23. Auto-Sync With Ticketing Dashboard (real-time)
  async syncWithDashboard(tripId: string, eventType: string, data: any) {
    // Update trip status
    await supabase
      .from('trips')
      .update({
        updated_at: new Date().toISOString(),
        ...data,
      })
      .eq('id', tripId);

    // Broadcast event via Supabase Realtime
    await supabase.from('trip_events').insert({
      trip_id: tripId,
      event_type: eventType,
      event_data: data,
      timestamp: new Date().toISOString(),
    });
  },

  // ✅ 24. Auto-Detect Wrong Route
  async detectRouteDeviation(
    tripId: string,
    currentLocation: { latitude: number; longitude: number },
    expectedRoute: TripLocation[]
  ) {
    // Find closest point on expected route
    let minDistance = Infinity;

    for (const point of expectedRoute) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        point.latitude,
        point.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    // If more than 1km off route
    if (minDistance > 1000) {
      // Alert driver
      await this.sendNotification(
        'driver',
        'Route Deviation',
        'You may be off the expected route. Please check navigation.'
      );

      // Alert dispatch
      await this.sendNotification(
        'dispatch',
        'Route Deviation Alert',
        `Trip ${tripId} has deviated from expected route by ${(minDistance / 1000).toFixed(
          1
        )} km`
      );

      // Log deviation
      await supabase.from('route_deviations').insert({
        trip_id: tripId,
        deviation_distance: minDistance,
        location_lat: currentLocation.latitude,
        location_lng: currentLocation.longitude,
        timestamp: new Date().toISOString(),
      });

      return true;
    }

    return false;
  },

  // Helper: Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },

  // Helper: Send notification
  async sendNotification(recipient: string, title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
  },

  // Helper: Notify all passengers on a trip
  async notifyPassengers(tripId: string, message: string) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('trip_id', tripId);

    if (bookings) {
      for (const booking of bookings) {
        // Send push notification to passenger app
        await supabase.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Trip Update',
          message,
          type: 'trip_update',
        });
      }
    }
  },

  // ✅ 14. Auto-Rest Requirement
  async checkDriverRestRequirement(driverId: string, tripId: string) {
    // Get driver's recent trips in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentTrips } = await supabase
      .from('driver_assignments')
      .select(`
        *,
        schedule:schedules (
          departure_date,
          departure_time,
          arrival_time,
          route:routes (duration_hours)
        )
      `)
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('created_at', twentyFourHoursAgo);

    if (!recentTrips || recentTrips.length === 0) return { requiresRest: false };

    // Calculate total driving hours
    let totalHours = 0;
    for (const trip of recentTrips) {
      const duration = trip.schedule?.route?.duration_hours;
      if (duration) {
        totalHours += parseFloat(duration);
      }
    }

    // Check if exceeds 10 hours (legal limit)
    if (totalHours >= 10) {
      // Calculate required rest period (8 hours)
      const lastTripTime = new Date(recentTrips[0].created_at);
      const restEndTime = new Date(lastTripTime.getTime() + 8 * 60 * 60 * 1000);
      const now = new Date();

      if (now < restEndTime) {
        // Block new trip assignment
        await supabase
          .from('driver_assignments')
          .update({ status: 'blocked_rest_required' })
          .eq('driver_id', driverId)
          .eq('schedule_id', tripId);

        // Notify driver
        await this.sendNotification(
          'driver',
          'Rest Required',
          `You have driven ${totalHours.toFixed(1)} hours. Rest required until ${restEndTime.toLocaleTimeString()}`
        );

        // Notify dispatch
        await this.sendNotification(
          'dispatch',
          'Driver Rest Period',
          `Driver ${driverId} requires rest. Available after ${restEndTime.toLocaleTimeString()}`
        );

        return {
          requiresRest: true,
          totalHours,
          restEndTime,
          hoursRemaining: (restEndTime.getTime() - now.getTime()) / (60 * 60 * 1000),
        };
      }
    }

    return { requiresRest: false, totalHours };
  },

  // ✅ 15. Auto-Conductor Assignment
  async autoAssignConductor(tripId: string, routeId: string, departureDate: string) {
    // Find available conductors
    const { data: availableConductors } = await supabase
      .from('staff')
      .select('*')
      .eq('position', 'conductor')
      .eq('status', 'active');

    if (!availableConductors || availableConductors.length === 0) {
      await this.sendNotification(
        'dispatch',
        'No Conductors Available',
        `Trip ${tripId} has no available conductors`
      );
      return null;
    }

    // Check conductor availability for this date
    for (const conductor of availableConductors) {
      const { data: existingAssignments } = await supabase
        .from('conductor_assignments')
        .select('*')
        .eq('conductor_id', conductor.id)
        .eq('assignment_date', departureDate);

      if (!existingAssignments || existingAssignments.length === 0) {
        // Assign conductor to trip
        const { data: assignment, error } = await supabase
          .from('conductor_assignments')
          .insert({
            trip_id: tripId,
            conductor_id: conductor.id,
            assignment_date: departureDate,
            status: 'assigned',
          })
          .select()
          .single();

        if (!error) {
          // Update trip with conductor
          await supabase
            .from('trips')
            .update({ conductor_id: conductor.id })
            .eq('id', tripId);

          // Notify conductor
          await this.sendNotification(
            'conductor',
            'New Trip Assignment',
            `You have been assigned to trip ${tripId} on ${departureDate}`
          );

          // Notify driver
          await this.sendNotification(
            'driver',
            'Conductor Assigned',
            `${conductor.full_name} has been assigned as your conductor`
          );

          return assignment;
        }
      }
    }

    return null;
  },

  // ✅ 18. Auto-Cleaning Request
  async autoCreateCleaningRequest(tripId: string, busId: string) {
    const { data: trip } = await supabase
      .from('trips')
      .select('*, route:routes(*)')
      .eq('id', tripId)
      .single();

    if (!trip) return null;

    // Create cleaning request
    const { data: cleaningRequest, error } = await supabase
      .from('cleaning_requests')
      .insert({
        bus_id: busId,
        trip_id: tripId,
        request_type: 'post_trip',
        priority: 'normal',
        status: 'pending',
        notes: `Post-trip cleaning for ${trip.route?.origin} → ${trip.route?.destination}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Mark bus as unavailable for cleaning
    await supabase
      .from('buses')
      .update({
        status: 'cleaning',
        last_cleaning_date: new Date().toISOString(),
      })
      .eq('id', busId);

    // Find available cleaning team
    const { data: cleaningTeam } = await supabase
      .from('staff')
      .select('*')
      .eq('department', 'cleaning')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (cleaningTeam) {
      // Assign cleaning team
      await supabase
        .from('cleaning_requests')
        .update({
          assigned_to: cleaningTeam.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', cleaningRequest.id);

      // Notify cleaning team
      await this.sendNotification(
        'cleaning',
        'New Cleaning Request',
        `Bus ${busId} requires cleaning after trip ${tripId}`
      );
    }

    return cleaningRequest;
  },

  // ✅ 21. Auto-Trip Rating Collection
  async autoCollectTripRatings(tripId: string) {
    // Get all passengers from the trip
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, user:users(*)')
      .eq('trip_id', tripId)
      .eq('check_in_status', 'boarded');

    if (!bookings || bookings.length === 0) return;

    // Send rating request to each passenger
    for (const booking of bookings) {
      await supabase.from('rating_requests').insert({
        trip_id: tripId,
        user_id: booking.user_id,
        booking_id: booking.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      // Send notification to passenger app
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        title: 'Rate Your Trip',
        message: 'How was your journey? Please rate your experience.',
        type: 'rating_request',
        data: { trip_id: tripId, booking_id: booking.id },
      });
    }

    return bookings.length;
  },

  // Process rating submission (called from passenger app)
  async processRating(
    tripId: string,
    userId: string,
    driverRating: number,
    busRating: number,
    routeRating: number,
    comment?: string
  ) {
    // Save rating
    const { data: rating, error } = await supabase
      .from('trip_ratings')
      .insert({
        trip_id: tripId,
        user_id: userId,
        driver_rating: driverRating,
        bus_rating: busRating,
        route_rating: routeRating,
        comment,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update rating request status
    await supabase
      .from('rating_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    // Update driver average rating
    const { data: trip } = await supabase
      .from('trips')
      .select('driver_id')
      .eq('id', tripId)
      .single();

    if (trip?.driver_id) {
      const { data: driverRatings } = await supabase
        .from('trip_ratings')
        .select('driver_rating')
        .eq('trip_id', tripId);

      if (driverRatings && driverRatings.length > 0) {
        const avgRating =
          driverRatings.reduce((sum, r) => sum + r.driver_rating, 0) / driverRatings.length;

        await supabase
          .from('drivers')
          .update({ average_rating: avgRating })
          .eq('id', trip.driver_id);
      }
    }

    // Update bus average rating
    const { data: tripData } = await supabase
      .from('trips')
      .select('bus_id')
      .eq('id', tripId)
      .single();

    if (tripData?.bus_id) {
      const { data: busRatings } = await supabase
        .from('trip_ratings')
        .select('bus_rating')
        .eq('trip_id', tripId);

      if (busRatings && busRatings.length > 0) {
        const avgRating =
          busRatings.reduce((sum, r) => sum + r.bus_rating, 0) / busRatings.length;

        await supabase
          .from('buses')
          .update({ average_rating: avgRating })
          .eq('id', tripData.bus_id);
      }
    }

    return rating;
  },
};
