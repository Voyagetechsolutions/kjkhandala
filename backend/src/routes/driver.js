const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

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

    // Find driver's trip for today
    const trip = await prisma.trip.findFirst({
      where: {
        driverId,
        departureTime: {
          gte: today,
          lt: tomorrow
        }
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
      },
      orderBy: {
        departureTime: 'asc'
      }
    });

    if (!trip) {
      return res.json({
        hasTrip: false,
        message: 'No trip assigned for today'
      });
    }

    const totalPassengers = trip.bookings.length;
    const checkedIn = trip.bookings.filter(b => b.checkedIn).length;
    
    res.json({
      hasTrip: true,
      trip: {
        id: trip.id,
        route: `${trip.route.origin} → ${trip.route.destination}`,
        origin: trip.route.origin,
        destination: trip.route.destination,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busNumber: trip.bus?.registrationNumber || 'N/A',
        busModel: trip.bus?.model || 'N/A',
        status: trip.status,
        totalPassengers,
        checkedInPassengers: checkedIn,
        distance: trip.route.distance,
        estimatedDuration: trip.route.estimatedDuration
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
    const { odometerReading, fuelLevel, dashboardPhoto } = req.body;
    const driverId = req.user.id;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Trip already started or completed' });
    }

    // Update trip status
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'IN_PROGRESS',
        actualDepartureTime: new Date()
      }
    });

    // Log trip start
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'TRIP_STARTED',
        description: JSON.stringify({ odometerReading, fuelLevel }),
        timestamp: new Date()
      }
    });

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

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Update trip
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        actualArrivalTime: new Date()
      }
    });

    // Log trip end
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'TRIP_COMPLETED',
        description: JSON.stringify({ finalOdometer, finalFuel, incidents, condition }),
        timestamp: new Date()
      }
    });

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

    const driver = await prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get trip history
    const trips = await prisma.trip.findMany({
      where: { driverId },
      orderBy: { departureTime: 'desc' },
      take: 10,
      include: {
        route: true
      }
    });

    // Calculate safety score (simplified)
    const totalTrips = await prisma.trip.count({
      where: { driverId, status: 'COMPLETED' }
    });

    const incidents = await prisma.tripLog.count({
      where: {
        trip: { driverId },
        eventType: 'ISSUE_REPORTED'
      }
    });

    const safetyScore = Math.max(0, 100 - (incidents * 5));

    res.json({
      driver: {
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        phone: driver.phone,
        role: driver.role
      },
      stats: {
        totalTrips,
        completedTrips: totalTrips,
        incidents,
        safetyScore
      },
      recentTrips: trips.map(trip => ({
        id: trip.id,
        route: `${trip.route.origin} → ${trip.route.destination}`,
        date: trip.departureTime,
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

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        driverId
      },
      include: {
        route: true,
        bookings: {
          include: {
            passenger: true
          },
          orderBy: {
            seatNumber: 'asc'
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({
      trip: {
        route: `${trip.route.origin} → ${trip.route.destination}`,
        departureTime: trip.departureTime
      },
      passengers: trip.bookings.map(booking => ({
        id: booking.id,
        seatNumber: booking.seatNumber,
        ticketNumber: booking.ticketNumber,
        name: `${booking.passenger.firstName} ${booking.passenger.lastName}`,
        gender: booking.passenger.gender,
        idNumber: booking.passenger.idNumber,
        phone: booking.passenger.phone,
        luggage: booking.luggage || 0,
        paymentStatus: booking.paymentStatus,
        checkedIn: booking.checkedIn
      })),
      stats: {
        total: trip.bookings.length,
        checkedIn: trip.bookings.filter(b => b.checkedIn).length,
        notBoarded: trip.bookings.filter(b => !b.checkedIn).length
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

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'NO_SHOW'
      }
    });

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
