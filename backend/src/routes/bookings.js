const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status, tripId, passengerId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (tripId) where.tripId = tripId;
    if (passengerId) where.passengerId = passengerId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
          },
        },
        passenger: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
        passenger: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const { tripId, passengerId, seatNumber, price, passengerDetails } = req.body;

    // Check if seat is available
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tripId,
        seatNumber,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Seat already booked' });
    }

    const booking = await prisma.booking.create({
      data: {
        tripId,
        passengerId,
        seatNumber,
        price: parseFloat(price),
        status: 'PENDING',
        passengerName: passengerDetails?.name,
        passengerPhone: passengerDetails?.phone,
        passengerEmail: passengerDetails?.email,
      },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('booking:update', { type: 'created', booking });

    res.status(201).json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('booking:update', { type: 'cancelled', booking });

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod,
        transactionId,
        paidAt: new Date(),
      },
    });

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in booking (for ticket agents or drivers)
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, tripId: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: `Cannot check-in booking with status: ${booking.status}` });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy: req.user.id,
      },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
        passenger: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${booking.tripId}`).emit('booking:checkedin', updatedBooking);
    }

    res.json({ success: true, data: updatedBooking, message: 'Passenger checked in successfully' });
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hold seat (temporary reservation)
router.post('/hold', auth, async (req, res) => {
  try {
    const { tripId, seatNumber, expiresInMinutes } = req.body;

    if (!tripId || !seatNumber) {
      return res.status(400).json({ error: 'tripId and seatNumber are required' });
    }

    // Check if seat is already taken or held
    const existing = await prisma.booking.findFirst({
      where: {
        tripId,
        seatNumber,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Seat is already taken or held' });
    }

    const expiresAt = new Date(Date.now() + (expiresInMinutes || 10) * 60 * 1000);

    const hold = await prisma.seatHold.create({
      data: {
        tripId,
        seatNumber,
        heldBy: req.user.id,
        expiresAt,
      },
    });

    res.status(201).json({ success: true, data: hold, message: 'Seat held successfully' });
  } catch (error) {
    console.error('Error holding seat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Release seat hold
router.delete('/hold/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.seatHold.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Seat hold released' });
  } catch (error) {
    console.error('Error releasing seat hold:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available seats for a trip
router.get('/trip/:tripId/available-seats', async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get trip capacity
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: {
          select: { capacity: true },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Get booked seats
    const bookedSeats = await prisma.booking.findMany({
      where: {
        tripId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      },
      select: { seatNumber: true },
    });

    // Get held seats (not expired)
    const now = new Date();
    const heldSeats = await prisma.seatHold.findMany({
      where: {
        tripId,
        expiresAt: { gt: now },
      },
      select: { seatNumber: true },
    });

    const unavailableSeats = [
      ...bookedSeats.map(b => b.seatNumber),
      ...heldSeats.map(h => h.seatNumber),
    ];

    const totalSeats = trip.bus?.capacity || 50;
    const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1)
      .filter(seat => !unavailableSeats.includes(seat));

    res.json({
      success: true,
      data: {
        totalSeats,
        availableSeats,
        bookedSeats: bookedSeats.map(b => b.seatNumber),
        heldSeats: heldSeats.map(h => h.seatNumber),
        availableCount: availableSeats.length,
      },
    });
  } catch (error) {
    console.error('Error fetching available seats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
