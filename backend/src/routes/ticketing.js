const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Apply auth middleware
router.use(auth);

// =====================================================
// DASHBOARD
// =====================================================

router.get('/dashboard', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's trips
    const trips = await prisma.trip.findMany({
      where: {
        departureTime: { gte: today, lt: tomorrow },
      },
      include: {
        route: true,
        bus: true,
        bookings: { include: { passenger: true } },
      },
    });

    // Agent's payments today
    const payments = await prisma.booking.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        paymentStatus: 'PAID',
      },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.totalPrice, 0);

    res.json({
      trips: trips.map(t => ({
        id: t.id,
        route: `${t.route.origin} - ${t.route.destination}`,
        departureTime: t.departureTime,
        capacity: t.bus.capacity,
        booked: t.bookings.length,
        available: t.bus.capacity - t.bookings.length,
        status: t.status,
      })),
      stats: {
        totalCollected,
        ticketsSold: payments.length,
        upcomingTrips: trips.length,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// =====================================================
// SELL TICKET
// =====================================================

router.get('/available-trips', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await prisma.trip.findMany({
      where: {
        route: {
          origin: { contains: origin, mode: 'insensitive' },
          destination: { contains: destination, mode: 'insensitive' },
        },
        departureTime: { gte: searchDate, lt: nextDay },
        status: { in: ['SCHEDULED', 'BOARDING'] },
      },
      include: {
        route: true,
        bus: true,
        bookings: true,
      },
    });

    res.json({
      trips: trips.map(t => ({
        id: t.id,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        fare: t.route.baseFare,
        capacity: t.bus.capacity,
        booked: t.bookings.length,
        available: t.bus.capacity - t.bookings.length,
        busType: t.bus.type,
        route: {
          origin: t.route.origin,
          destination: t.route.destination,
          distance: t.route.distance,
        },
      })),
    });
  } catch (error) {
    console.error('Available trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

router.post('/book-ticket', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId, passengerData, seatNumber, paymentMethod } = req.body;

    // Create or find passenger
    let passenger = await prisma.passenger.findUnique({
      where: { idNumber: passengerData.idNumber },
    });

    if (!passenger) {
      passenger = await prisma.passenger.create({
        data: {
          firstName: passengerData.firstName,
          lastName: passengerData.lastName,
          idNumber: passengerData.idNumber,
          phone: passengerData.phone,
          email: passengerData.email,
          gender: passengerData.gender,
          nationality: passengerData.nationality || 'Botswana',
        },
      });
    }

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true, bus: true },
    });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tripId,
        passengerId: passenger.id,
        seatNumber,
        totalPrice: trip.route.baseFare,
        paymentMethod,
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        luggage: passengerData.luggage || 0,
      },
    });

    res.json({ booking, passenger, trip });
  } catch (error) {
    console.error('Book ticket error:', error);
    res.status(500).json({ error: 'Failed to book ticket' });
  }
});

// =====================================================
// CHECK-IN
// =====================================================

router.post('/check-in', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { ticketNumber } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { ticketNumber },
      include: { passenger: true, trip: { include: { route: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Validations
    if (booking.paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Ticket not paid' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ error: 'Ticket cancelled' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ error: 'Already checked in' });
    }

    // Check-in
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { checkedIn: true, checkedInAt: new Date() },
      include: { passenger: true, trip: { include: { route: true } } },
    });

    res.json({ booking: updated, message: 'Check-in successful' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// =====================================================
// PASSENGER MANIFEST
// =====================================================

router.get('/manifest/:tripId', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: { tripId, bookingStatus: { not: 'CANCELLED' } },
      include: { passenger: true },
      orderBy: { seatNumber: 'asc' },
    });

    res.json({ manifest: bookings });
  } catch (error) {
    console.error('Manifest error:', error);
    res.status(500).json({ error: 'Failed to load manifest' });
  }
});

// =====================================================
// FIND TICKET
// =====================================================

router.get('/find-ticket', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { search } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: search } },
          { passenger: { firstName: { contains: search, mode: 'insensitive' } } },
          { passenger: { lastName: { contains: search, mode: 'insensitive' } } },
          { passenger: { phone: { contains: search } } },
          { passenger: { idNumber: { contains: search } } },
        ],
      },
      include: {
        passenger: true,
        trip: { include: { route: true, bus: true } },
      },
      take: 20,
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Find ticket error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// =====================================================
// PAYMENTS & COLLECTIONS
// =====================================================

router.get('/payments', authorize(['TICKETING_AGENT', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: searchDate, lt: nextDay },
        paymentStatus: 'PAID',
      },
      include: { passenger: true, trip: { include: { route: true } } },
    });

    const summary = {
      cash: bookings.filter(b => b.paymentMethod === 'CASH').reduce((sum, b) => sum + b.totalPrice, 0),
      card: bookings.filter(b => b.paymentMethod === 'CARD').reduce((sum, b) => sum + b.totalPrice, 0),
      mobileMoney: bookings.filter(b => b.paymentMethod === 'MOBILE_MONEY').reduce((sum, b) => sum + b.totalPrice, 0),
      total: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      count: bookings.length,
    };

    res.json({ payments: bookings, summary });
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

module.exports = router;
