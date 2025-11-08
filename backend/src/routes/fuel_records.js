const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all fuel records
router.get('/', auth, async (req, res) => {
  try {
    const { status, driverId, busId, startDate, endDate } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (busId) where.busId = busId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: {
        driver: {
          select: { firstName: true, lastName: true },
        },
        bus: {
          select: { registrationNumber: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ data: fuelLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create fuel record
router.post('/', auth, async (req, res) => {
  try {
    const fuelLog = await prisma.fuelLog.create({
      data: {
        ...req.body,
        liters: parseFloat(req.body.liters),
        cost: parseFloat(req.body.cost),
        pricePerLiter: parseFloat(req.body.pricePerLiter),
        recordedBy: req.user.id,
      },
      include: {
        driver: {
          select: { firstName: true, lastName: true },
        },
        bus: {
          select: { registrationNumber: true },
        },
      },
    });

    res.status(201).json({ data: fuelLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fuel record
router.put('/:id', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.liters) updateData.liters = parseFloat(req.body.liters);
    if (req.body.cost) updateData.cost = parseFloat(req.body.cost);
    if (req.body.pricePerLiter) updateData.pricePerLiter = parseFloat(req.body.pricePerLiter);

    const fuelLog = await prisma.fuelLog.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        driver: {
          select: { firstName: true, lastName: true },
        },
        bus: {
          select: { registrationNumber: true },
        },
      },
    });

    res.json({ data: fuelLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fuel record
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.fuelLog.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Fuel record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
