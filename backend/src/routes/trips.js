const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all trips
router.get('/', async (req, res) => {
  try {
    const { date, routeId, status } = req.query;
    
    const where = {};
    if (date) where.departureDate = new Date(date);
    if (routeId) where.routeId = routeId;
    if (status) where.status = status;

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { departureDate: 'asc' },
    });

    res.json({ data: trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trip by ID
router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bookings: {
          include: {
            passenger: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create trip
router.post('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { routeId, busId, driverId, departureDate, departureTime, price } = req.body;

    const trip = await prisma.trip.create({
      data: {
        routeId,
        busId,
        driverId,
        departureDate: new Date(departureDate),
        departureTime,
        price: parseFloat(price),
        status: 'SCHEDULED',
      },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('trip:update', { type: 'created', trip });

    res.status(201).json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trip
router.put('/:id', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('trip:update', { type: 'updated', trip });

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign driver
router.post('/:id/assign-driver', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { driverId } = req.body;

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: { driverId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trip manifest
router.get('/:id/manifest', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          include: {
            passenger: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update manifest (check-in passenger)
router.put('/:id/manifest', auth, async (req, res) => {
  try {
    const { bookingId, action } = req.body;

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: action === 'checkin' ? 'CHECKED_IN' : 'CONFIRMED',
        checkedInAt: action === 'checkin' ? new Date() : null,
      },
    });

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start trip (Boarding -> Departed)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { status: true, driverId: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Authorization: only assigned driver or operations can start
    if (req.user.role === 'DRIVER' && trip.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to start this trip' });
    }

    if (!['SCHEDULED', 'BOARDING'].includes(trip.status)) {
      return res.status(400).json({ error: `Cannot start trip with status: ${trip.status}` });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        status: 'DEPARTED',
        actualDepartureTime: new Date(),
      },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.emit('trip:started', updatedTrip);
    }

    res.json({ success: true, data: updatedTrip, message: 'Trip started successfully' });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete trip
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { status: true, driverId: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Authorization: only assigned driver or operations can complete
    if (req.user.role === 'DRIVER' && trip.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to complete this trip' });
    }

    if (!['DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(trip.status)) {
      return res.status(400).json({ error: `Cannot complete trip with status: ${trip.status}` });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualArrivalTime: new Date(),
        notes: notes || '',
      },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.emit('trip:completed', updatedTrip);
    }

    res.json({ success: true, data: updatedTrip, message: 'Trip completed successfully' });
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel trip
router.post('/:id/cancel', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      return res.status(400).json({ error: `Cannot cancel trip with status: ${trip.status}` });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason || 'Trip cancelled',
      },
      include: {
        route: true,
        bus: true,
        bookings: true,
      },
    });

    // Cancel all bookings for this trip
    await prisma.booking.updateMany({
      where: {
        tripId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.emit('trip:cancelled', updatedTrip);
    }

    // TODO: Send notifications to passengers about cancellation

    res.json({ success: true, data: updatedTrip, message: 'Trip cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set trip to boarding status
router.post('/:id/boarding', auth, authorize('DRIVER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        status: 'BOARDING',
      },
      include: {
        route: true,
        bus: true,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('trip:boarding', updatedTrip);
    }

    res.json({ success: true, data: updatedTrip, message: 'Trip set to boarding' });
  } catch (error) {
    console.error('Error setting trip to boarding:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
