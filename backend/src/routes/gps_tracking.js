const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Post location update (from driver device)
router.post('/location', auth, authorize('DRIVER'), async (req, res) => {
  try {
    const { tripId, busId, lat, lng, speed, heading, accuracy } = req.body;

    if (!tripId || !lat || !lng) {
      return res.status(400).json({ error: 'tripId, lat, and lng are required' });
    }

    // Verify driver is assigned to this trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { driverId: true, busId: true },
    });

    if (!trip || trip.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this trip' });
    }

    const location = await prisma.liveLocation.create({
      data: {
        tripId,
        busId: busId || trip.busId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        timestamp: new Date(),
      },
    });

    // Emit WebSocket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${tripId}`).emit('location:update', {
        tripId,
        busId: location.busId,
        lat: location.lat,
        lng: location.lng,
        speed: location.speed,
        timestamp: location.timestamp,
      });
    }

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('Error posting location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current location for a trip
router.get('/location/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;

    const location = await prisma.liveLocation.findFirst({
      where: { tripId },
      orderBy: { timestamp: 'desc' },
      include: {
        bus: {
          select: {
            registrationNumber: true,
            model: true,
          },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'No location data available for this trip' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location history for a trip
router.get('/history/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { from, to, limit } = req.query;

    const where = { tripId };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const locations = await prisma.liveLocation.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit ? parseInt(limit) : 1000,
    });

    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard view (all active trips with latest locations)
router.get('/dashboard', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    // Get all active trips
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: {
          in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'],
        },
      },
      include: {
        route: {
          select: {
            name: true,
            origin: true,
            destination: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        bus: {
          select: {
            registrationNumber: true,
            model: true,
          },
        },
      },
    });

    // Get latest location for each trip
    const tripsWithLocations = await Promise.all(
      activeTrips.map(async (trip) => {
        const location = await prisma.liveLocation.findFirst({
          where: { tripId: trip.id },
          orderBy: { timestamp: 'desc' },
        });

        return {
          trip: {
            id: trip.id,
            status: trip.status,
            departureDate: trip.departureDate,
            route: trip.route,
            driver: trip.driver,
            bus: trip.bus,
          },
          location: location || null,
        };
      })
    );

    res.json({ success: true, data: tripsWithLocations });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all buses with their latest locations
router.get('/buses/active', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const activeBuses = await prisma.bus.findMany({
      where: {
        status: 'ACTIVE',
        trips: {
          some: {
            status: {
              in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'],
            },
          },
        },
      },
      include: {
        trips: {
          where: {
            status: {
              in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'],
            },
          },
          take: 1,
          include: {
            liveLocations: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const busLocations = activeBuses.map(bus => ({
      busId: bus.id,
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      currentTrip: bus.trips[0] || null,
      location: bus.trips[0]?.liveLocations[0] || null,
    }));

    res.json({ success: true, data: busLocations });
  } catch (error) {
    console.error('Error fetching active buses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if speed exceeds threshold (for alerts)
router.post('/alert/speeding', auth, authorize('DRIVER'), async (req, res) => {
  try {
    const { tripId, speed, lat, lng } = req.body;
    const SPEED_LIMIT = 120; // km/h

    if (speed > SPEED_LIMIT) {
      // Create alert/notification
      const alert = {
        type: 'SPEEDING',
        tripId,
        speed,
        location: { lat, lng },
        timestamp: new Date(),
      };

      // Emit to operations
      const io = req.app.get('io');
      if (io) {
        io.emit('alert:speeding', alert);
      }

      // Could also create a record in notifications table
      res.json({ success: true, alert: 'Speeding alert triggered' });
    } else {
      res.json({ success: true, message: 'Speed within limits' });
    }
  } catch (error) {
    console.error('Error checking speed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
