const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        stops: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ data: routes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get route by ID
router.get('/:id', async (req, res) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: {
        stops: true,
        trips: {
          take: 10,
          orderBy: { departureDate: 'desc' },
        },
      },
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create route
router.post('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { name, origin, destination, distance, duration, stops } = req.body;

    const route = await prisma.route.create({
      data: {
        name,
        origin,
        destination,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        stops: stops ? {
          create: stops,
        } : undefined,
      },
      include: { stops: true },
    });

    res.status(201).json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update route
router.put('/:id', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: req.body,
      include: { stops: true },
    });

    res.json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete route
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.route.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
