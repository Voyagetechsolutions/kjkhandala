const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all drivers
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        trips: {
          take: 10,
          orderBy: { departureDate: 'desc' },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    res.json({ data: drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        trips: {
          orderBy: { departureDate: 'desc' },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ data: driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create driver
router.post('/', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const driver = await prisma.driver.create({
      data: req.body,
    });

    res.status(201).json({ data: driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver
router.put('/:id', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver's current trip
router.get('/:id/current-trip', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        driverId: req.params.id,
        status: 'IN_PROGRESS',
      },
      include: {
        route: true,
        bus: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        },
      },
    });

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
