const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all maintenance records
router.get('/', auth, async (req, res) => {
  try {
    const { busId, type, status, from, to } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id: req.params.id },
      include: {
        bus: {
          select: {
            registrationNumber: true,
            model: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance record
router.post('/', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const {
      busId,
      type,
      description,
      date,
      cost,
      mileage,
      performedBy,
      notes,
    } = req.body;

    if (!busId || !type || !date) {
      return res.status(400).json({ error: 'busId, type, and date are required' });
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        busId,
        type,
        description: description || '',
        date: new Date(date),
        cost: cost ? parseFloat(cost) : 0,
        mileage: mileage ? parseInt(mileage) : null,
        performedBy: performedBy || req.user.id,
        notes: notes || '',
        status: 'COMPLETED',
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
            model: true,
          },
        },
      },
    });

    // Update bus lastServiceDate if this is service maintenance
    if (type === 'SERVICE' || type === 'PREVENTIVE') {
      await prisma.bus.update({
        where: { id: busId },
        data: { lastServiceDate: new Date(date) },
      });
    }

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance record
router.put('/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.cost) updateData.cost = parseFloat(updateData.cost);
    if (updateData.mileage) updateData.mileage = parseInt(updateData.mileage);

    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data: updateData,
      include: {
        bus: {
          select: {
            registrationNumber: true,
            model: true,
          },
        },
      },
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete maintenance record
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.maintenanceRecord.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance history for a specific bus
router.get('/bus/:busId/history', auth, async (req, res) => {
  try {
    const { busId } = req.params;

    const history = await prisma.maintenanceRecord.findMany({
      where: { busId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const totalCost = history.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
    const lastService = history.find(r => r.type === 'SERVICE' || r.type === 'PREVENTIVE');

    res.json({
      success: true,
      data: {
        history,
        summary: {
          totalRecords: history.length,
          totalCost: parseFloat(totalCost.toFixed(2)),
          lastServiceDate: lastService?.date || null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
