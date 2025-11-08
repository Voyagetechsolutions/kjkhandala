const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all buses
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const buses = await prisma.bus.findMany({
      where,
      include: {
        maintenanceRecords: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { registrationNumber: 'asc' },
    });

    res.json({ data: buses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus by ID
router.get('/:id', async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: req.params.id },
      include: {
        maintenanceRecords: {
          orderBy: { date: 'desc' },
        },
        trips: {
          take: 20,
          orderBy: { departureDate: 'desc' },
        },
      },
    });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bus
router.post('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { registrationNumber, model, capacity, yearOfManufacture, status, mileage } = req.body;

    // Validate required fields
    if (!registrationNumber || !model || !capacity) {
      return res.status(400).json({ error: 'Missing required fields: registrationNumber, model, capacity' });
    }

    const busData = {
      registrationNumber,
      model,
      capacity: parseInt(capacity),
      status: status || 'ACTIVE',
      mileage: mileage || 0,
    };

    // Add optional fields
    if (yearOfManufacture) {
      busData.yearOfManufacture = parseInt(yearOfManufacture);
    }

    const bus = await prisma.bus.create({
      data: busData,
    });

    res.status(201).json({ data: bus });
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update bus
router.put('/:id', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const bus = await prisma.bus.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bus status
router.patch('/:id/status', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { status } = req.body;

    const bus = await prisma.bus.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bus
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.bus.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
