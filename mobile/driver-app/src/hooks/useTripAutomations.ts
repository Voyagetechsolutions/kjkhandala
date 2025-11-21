import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { automationService } from '../services/automationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TripData {
  tripId: string;
  driverId: string;
  departureTime: string;
  route: any;
  stops: any[];
  destination: any;
}

export function useTripAutomations(tripData: TripData | null) {
  const [isActive, setIsActive] = useState(false);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gpsSubscriptionRef = useRef<any>(null);

  // Start automations
  const startAutomations = async () => {
    if (!tripData) return;

    try {
      setIsActive(true);
      await AsyncStorage.setItem('active_trip', JSON.stringify(tripData));

      // Start GPS tracking
      gpsSubscriptionRef.current = await automationService.startAutoGPSTracking(
        tripData.tripId,
        tripData.driverId
      );

      // Start automation checks every 30 seconds
      intervalRef.current = setInterval(async () => {
        await runAutomationChecks();
      }, 30000);

      console.log('✅ Trip automations started');
    } catch (error) {
      console.error('Error starting automations:', error);
    }
  };

  // Stop automations
  const stopAutomations = async () => {
    if (gpsSubscriptionRef.current) {
      gpsSubscriptionRef.current.remove();
      gpsSubscriptionRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
    await AsyncStorage.removeItem('active_trip');

    console.log('✅ Trip automations stopped');
  };

  // Run all automation checks
  const runAutomationChecks = async () => {
    if (!tripData) return;

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, speed } = currentLocation.coords;
      setLastLocation({ latitude, longitude, speed });

      const { tripId, driverId, departureTime, stops, destination, route } = tripData;

      // Run all automations
      await Promise.all([
        // Check depot arrival
        route.depot_location &&
          automationService.checkDepotArrival(driverId, tripId, route.depot_location, {
            latitude,
            longitude,
          }),

        // Auto-mark no-shows
        automationService.autoMarkNoShows(tripId, departureTime),

        // Auto-detect trip events
        automationService.autoDetectTripEvents(
          tripId,
          { latitude, longitude, speed: speed || 0 },
          stops
        ),

        // Auto-detect breakdown
        automationService.detectBreakdown(tripId, speed || 0, true, { latitude, longitude }, stops),

        // Auto-detect delay
        automationService.detectDelay(tripId, departureTime, new Date()),

        // Send departure reminder
        automationService.sendDepartureReminder(tripId, departureTime),

        // Check speeding
        speed && automationService.checkSpeed(tripId, driverId, speed * 3.6),

        // Check driver rest requirement
        automationService.checkDriverRestRequirement(driverId, tripId),

        // Auto-complete trip
        destination &&
          automationService.autoCompleteTripAtDestination(tripId, { latitude, longitude }, destination).then(async (completed) => {
            if (completed) {
              // Calculate allowances
              await automationService.calculateDriverAllowances(driverId, tripId);
              
              // Generate trip report
              await automationService.generateTripReport(tripId);
              
              // Create cleaning request
              if (route.bus_id) {
                await automationService.autoCreateCleaningRequest(tripId, route.bus_id);
              }
              
              // Collect trip ratings
              await automationService.autoCollectTripRatings(tripId);
              
              // Stop automations
              await stopAutomations();
            }
          }),

        // Detect route deviation
        route.expected_path &&
          automationService.detectRouteDeviation(tripId, { latitude, longitude }, route.expected_path),

        // Sync offline data
        automationService.syncOfflineData(),
      ]);
    } catch (error) {
      console.error('Automation check error:', error);
    }
  };

  // Resume automations on mount
  useEffect(() => {
    const resumeAutomations = async () => {
      const savedTrip = await AsyncStorage.getItem('active_trip');
      if (savedTrip && !tripData) {
        // Trip data should be loaded from saved state
        console.log('Saved trip found, but no trip data provided');
      }
    };

    resumeAutomations();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gpsSubscriptionRef.current) {
        gpsSubscriptionRef.current.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isActive,
    lastLocation,
    startAutomations,
    stopAutomations,
    runAutomationChecks,
  };
}
