const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all maintenance reminders
router.get('/', auth, async (req, res) => {
  try {
    const { busId, status, upcoming } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;
    if (status) where.status = status;
    
    // Filter for upcoming reminders (next 30 days)
    if (upcoming === 'true') {
      const now = new Date();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      where.dueDate = {
        gte: now,
        lte: futureDate,
      };
      where.status = 'PENDING';
    }

    const reminders = await prisma.preventiveMaintenance.findMany({
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
      orderBy: { dueDate: 'asc' },
    });

    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error fetching maintenance reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reminder by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const reminder = await prisma.preventiveMaintenance.findUnique({
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

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance reminder
router.post('/', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const {
      busId,
      type,
      description,
      dueDate,
      dueMileage,
      priority,
      estimatedCost,
    } = req.body;

    if (!busId || !type || !dueDate) {
      return res.status(400).json({ error: 'busId, type, and dueDate are required' });
    }

    const reminder = await prisma.preventiveMaintenance.create({
      data: {
        busId,
        type,
        description: description || '',
        dueDate: new Date(dueDate),
        dueMileage: dueMileage ? parseInt(dueMileage) : null,
        priority: priority || 'MEDIUM',
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        status: 'PENDING',
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

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
router.put('/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.completedDate) updateData.completedDate = new Date(updateData.completedDate);
    if (updateData.dueMileage) updateData.dueMileage = parseInt(updateData.dueMileage);
    if (updateData.estimatedCost) updateData.estimatedCost = parseFloat(updateData.estimatedCost);
    if (updateData.actualCost) updateData.actualCost = parseFloat(updateData.actualCost);

    const reminder = await prisma.preventiveMaintenance.update({
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

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark reminder as completed
router.post('/:id/complete', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { actualCost, notes } = req.body;

    const reminder = await prisma.preventiveMaintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        actualCost: actualCost ? parseFloat(actualCost) : null,
        notes: notes || '',
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

    // Also create a maintenance record
    await prisma.maintenanceRecord.create({
      data: {
        busId: reminder.busId,
        type: reminder.type,
        description: reminder.description,
        date: new Date(),
        cost: actualCost ? parseFloat(actualCost) : reminder.estimatedCost || 0,
        performedBy: req.user.id,
        notes: notes || `Completed from reminder: ${reminder.description}`,
        status: 'COMPLETED',
      },
    });

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete reminder
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.preventiveMaintenance.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get overdue reminders
router.get('/status/overdue', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const now = new Date();

    const overdueReminders = await prisma.preventiveMaintenance.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: 'PENDING',
      },
      include: {
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ success: true, data: overdueReminders, count: overdueReminders.length });
  } catch (error) {
    console.error('Error fetching overdue reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
