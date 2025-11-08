const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all schedules (trips)
router.get('/', auth, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        route: true,
        bus: true,
        driver: true,
      },
      orderBy: { departureDate: 'asc' },
    });

    res.json({ data: trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create schedule
router.post('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const trip = await prisma.trip.create({
      data: req.body,
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.status(201).json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update schedule
router.put('/:id', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.trip.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
