const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Apply auth middleware
router.use(auth);

// ===== 1. DRIVER HOME - Today's Trip =====
router.get('/my-trip', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const driverId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, departure_time, arrival_time, status, driver_id')
      .eq('driver_id', driverId)
      .gte('departure_time', today.toISOString())
      .lt('departure_time', tomorrow.toISOString())
      .order('departure_time')
      .limit(1);
    
    if (error) throw error;
    const trip = trips?.[0];

    if (!trip) {
      return res.json({
        hasTrip: false,
        message: 'No trip assigned for today'
      });
    }

    const { data: bookings } = await supabase.from('bookings').select('id, status').eq('trip_id', trip.id);
    const totalPassengers = bookings?.length || 0;
    const checkedIn = (bookings || []).filter(b => b.status === 'CHECKED_IN').length;
    
    res.json({
      hasTrip: true,
      trip: {
        id: trip.id,
        departureTime: trip.departure_time,
        arrivalTime: trip.arrival_time,
        status: trip.status,
        totalPassengers,
        checkedInPassengers: checkedIn
      }
    });
  } catch (error) {
    console.error('Error fetching driver trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// ===== 2. TRIP DETAILS =====
router.get('/trip/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverId = req.user.id;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: {
          include: {
            passenger: true
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or not assigned to you' });
    }

    res.json({
      trip: {
        id: trip.id,
        tripNumber: trip.id.substring(0, 8).toUpperCase(),
        route: {
          origin: trip.route.origin,
          destination: trip.route.destination,
          distance: trip.route.distance,
          estimatedDuration: trip.route.estimatedDuration
        },
        schedule: {
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime
        },
        bus: {
          registrationNumber: trip.bus?.registrationNumber,
          model: trip.bus?.model,
          capacity: trip.bus?.capacity,
          type: trip.bus?.type
        },
        driver: {
          name: `${trip.driver?.firstName} ${trip.driver?.lastName}`,
          licenseNumber: trip.driver?.licenseNumber || 'N/A'
        },
        passengers: trip.bookings.length,
        status: trip.status
      }
    });
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// ===== 3. PRE-DEPARTURE CHECKLIST =====
router.post('/checklist/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { checklist } = req.body;

    // Store checklist in TripLog or separate table
    // For now, we'll create a trip log entry
    const log = await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'PRE_DEPARTURE_CHECKLIST',
        description: JSON.stringify(checklist),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Pre-departure checklist submitted',
      checklistId: log.id
    });
  } catch (error) {
    console.error('Error saving checklist:', error);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

// ===== 4. START TRIP =====
router.post('/start-trip/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { odometerReading, fuelLevel } = req.body;
    const driverId = req.user.id;

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, status')
      .eq('id', tripId)
      .eq('driver_id', driverId)
      .single();

    if (tripErr || !trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Trip already started or completed' });
    }

    const { data: updatedTrip, error: updateErr } = await supabase
      .from('trips')
      .update({ status: 'IN_PROGRESS', actual_departure_time: new Date().toISOString() })
      .eq('id', tripId)
      .select('*')
      .single();
    
    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: 'Trip started successfully',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

// ===== 5. UPDATE LIVE TRIP =====
router.post('/live-update/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, speed, heading } = req.body;

    // Create location log
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'LOCATION_UPDATE',
        description: JSON.stringify({ latitude, longitude, speed, heading }),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ===== 6. LOG STOP =====
router.post('/log-stop/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { stopType, reason, location } = req.body;

    const log = await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'STOP',
        description: JSON.stringify({ stopType, reason, location, startTime: new Date() }),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Stop logged',
      stopId: log.id
    });
  } catch (error) {
    console.error('Error logging stop:', error);
    res.status(500).json({ error: 'Failed to log stop' });
  }
});

// ===== 7. END STOP =====
router.post('/end-stop/:stopId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { stopId } = req.params;

    const stop = await prisma.tripLog.findUnique({
      where: { id: stopId }
    });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const stopData = JSON.parse(stop.description);
    stopData.endTime = new Date();
    stopData.duration = Math.round((new Date() - new Date(stopData.startTime)) / 60000); // minutes

    await prisma.tripLog.update({
      where: { id: stopId },
      data: {
        description: JSON.stringify(stopData)
      }
    });

    res.json({
      success: true,
      message: 'Stop ended',
      duration: stopData.duration
    });
  } catch (error) {
    console.error('Error ending stop:', error);
    res.status(500).json({ error: 'Failed to end stop' });
  }
});

// ===== 8. REPORT ISSUE =====
router.post('/report-issue/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { category, description, severity, photos, location } = req.body;

    const issue = await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'ISSUE_REPORTED',
        description: JSON.stringify({
          category,
          description,
          severity,
          photos,
          location,
          reportedBy: req.user.id
        }),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Issue reported successfully',
      issueId: issue.id
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// ===== 9. END TRIP =====
router.post('/end-trip/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { finalOdometer, finalFuel, incidents, condition } = req.body;
    const driverId = req.user.id;

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('driver_id', driverId)
      .single();

    if (tripErr || !trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { data: updatedTrip, error: updateErr } = await supabase
      .from('trips')
      .update({ status: 'COMPLETED', actual_arrival_time: new Date().toISOString() })
      .eq('id', tripId)
      .select('*')
      .single();
    
    if (updateErr) throw updateErr;

    res.json({
      success: true,
      message: 'Trip completed successfully',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({ error: 'Failed to end trip' });
  }
});

// ===== 10. DRIVER PROFILE =====
router.get('/profile', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const driverId = req.user.id;

    const { data: driver, error: driverErr } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', driverId)
      .single();
    
    if (driverErr || !driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const [tripsRes, totalRes] = await Promise.all([
      supabase.from('trips').select('id, departure_time, status').eq('driver_id', driverId).order('departure_time', { ascending: false }).limit(10),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('driver_id', driverId).eq('status', 'COMPLETED')
    ]);
    
    const trips = tripsRes.data || [];
    const totalTrips = totalRes.count || 0;
    const incidents = 0; // Simplified
    const safetyScore = Math.max(0, 100 - (incidents * 5));

    res.json({
      driver: {
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        phone: driver.phone
      },
      stats: {
        totalTrips,
        completedTrips: totalTrips,
        incidents,
        safetyScore
      },
      recentTrips: trips.map(trip => ({
        id: trip.id,
        date: trip.departure_time,
        status: trip.status
      }))
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ===== 11. PASSENGER MANIFEST =====
router.get('/manifest/:tripId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverId = req.user.id;

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, departure_time')
      .eq('id', tripId)
      .eq('driver_id', driverId)
      .single();

    if (tripErr || !trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('id, seat_number, total_amount, payment_status, status')
      .eq('trip_id', tripId)
      .neq('status', 'CANCELLED')
      .order('seat_number');
    
    if (bookingsErr) throw bookingsErr;

    res.json({
      trip: {
        departureTime: trip.departure_time
      },
      passengers: (bookings || []).map(booking => ({
        id: booking.id,
        seatNumber: booking.seat_number,
        paymentStatus: booking.payment_status,
        checkedIn: booking.status === 'CHECKED_IN'
      })),
      stats: {
        total: (bookings || []).length,
        checkedIn: (bookings || []).filter(b => b.status === 'CHECKED_IN').length,
        notBoarded: (bookings || []).filter(b => b.status !== 'CHECKED_IN').length
      }
    });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    res.status(500).json({ error: 'Failed to fetch manifest' });
  }
});

// ===== 12. MARK PASSENGER NO-SHOW =====
router.post('/no-show/:bookingId', authorize(['DRIVER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'NO_SHOW' })
      .eq('id', bookingId);
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'Passenger marked as no-show'
    });
  } catch (error) {
    console.error('Error marking no-show:', error);
    res.status(500).json({ error: 'Failed to mark no-show' });
  }
});

module.exports = router;
