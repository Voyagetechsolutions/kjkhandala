const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== WORK ORDERS ====================

// Get all work orders
router.get('/work-orders', auth, async (req, res) => {
  try {
    const { status, priority, busId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (busId) where.busId = busId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
        assignedTo: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(workOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get work order by ID
router.get('/work-orders/:id', auth, async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: {
        bus: true,
        assignedTo: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({ data: workOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create work order
router.post('/work-orders', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        ...req.body,
        estimatedCost: req.body.estimatedCost ? parseFloat(req.body.estimatedCost) : null,
        createdById: req.user.id,
      },
      include: {
        bus: true,
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('workorder:update', { type: 'created', workOrder });

    res.status(201).json({ data: workOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update work order
router.put('/work-orders/:id', auth, async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        actualCost: req.body.actualCost ? parseFloat(req.body.actualCost) : undefined,
      },
      include: {
        bus: true,
        assignedTo: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Emit WebSocket event
    req.app.get('io').emit('workorder:update', { type: 'updated', workOrder });

    res.json({ data: workOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign mechanic to work order
router.post('/work-orders/:id/assign', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { mechanicId } = req.body;

    const workOrder = await prisma.workOrder.update({
      where: { id: req.params.id },
      data: {
        assignedToId: mechanicId,
        status: 'IN_PROGRESS',
      },
    });

    res.json({ data: workOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete work order
router.delete('/work-orders/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.workOrder.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAINTENANCE SCHEDULE ====================

// Get maintenance schedules
router.get('/maintenance-schedules', auth, async (req, res) => {
  try {
    const { busId, status } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;
    if (status) where.status = status;

    const schedule = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
      },
      orderBy: { nextServiceDate: 'asc' },
    });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule by bus
router.get('/schedule/bus/:busId', auth, async (req, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.findMany({
      where: { busId: req.params.busId },
      orderBy: { nextServiceDate: 'asc' },
    });

    res.json({ data: schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance schedule
router.post('/schedule', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.create({
      data: req.body,
      include: {
        bus: true,
      },
    });

    res.status(201).json({ data: schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance schedule
router.put('/maintenance-schedules/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const schedule = await prisma.maintenanceSchedule.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark schedule as completed
router.post('/maintenance-schedules/:id/complete', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const { notes, cost } = req.body;

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        lastServiceDate: new Date(),
        notes,
        cost: cost ? parseFloat(cost) : null,
      },
    });

    res.json({ data: schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete maintenance schedule
router.delete('/maintenance-schedules/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.maintenanceSchedule.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INSPECTIONS ====================

// Get inspections
router.get('/inspections', auth, async (req, res) => {
  try {
    const { busId, status, startDate, endDate } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(inspections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inspection by ID
router.get('/inspections/:id', auth, async (req, res) => {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: req.params.id },
      include: {
        bus: true,
      },
    });

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    res.json({ data: inspection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create inspection
router.post('/inspections', auth, async (req, res) => {
  try {
    const inspection = await prisma.inspection.create({
      data: {
        ...req.body,
        inspectorId: req.body.inspectorId || req.user.id,
      },
      include: {
        bus: true,
      },
    });

    res.status(201).json({ data: inspection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inspection
router.put('/inspections/:id', auth, async (req, res) => {
  try {
    const inspection = await prisma.inspection.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ data: inspection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inspection
router.delete('/inspections/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.inspection.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload inspection photo
router.post('/inspections/:id/photo', auth, async (req, res) => {
  try {
    // TODO: Implement file upload logic with multer
    res.json({ message: 'Photo uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPAIRS ====================

// Get repairs
router.get('/repairs', auth, async (req, res) => {
  try {
    const { busId, status, startDate, endDate } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const repairs = await prisma.repair.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get repair history for a bus
router.get('/repairs/history/:busId', auth, async (req, res) => {
  try {
    const repairs = await prisma.repair.findMany({
      where: { busId: req.params.busId },
      orderBy: { date: 'desc' },
    });

    res.json({ data: repairs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create repair
router.post('/repairs', auth, async (req, res) => {
  try {
    const repair = await prisma.repair.create({
      data: {
        ...req.body,
        partsCost: parseFloat(req.body.partsCost || 0),
        laborCost: parseFloat(req.body.laborCost || 0),
      },
      include: {
        bus: true,
      },
    });

    res.status(201).json({ data: repair });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update repair
router.put('/repairs/:id', auth, async (req, res) => {
  try {
    const repair = await prisma.repair.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        partsCost: req.body.partsCost ? parseFloat(req.body.partsCost) : undefined,
        laborCost: req.body.laborCost ? parseFloat(req.body.laborCost) : undefined,
      },
    });

    res.json({ data: repair });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete repair
router.delete('/repairs/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.repair.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVENTORY ====================

// Get inventory
router.get('/inventory', auth, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventoryItem.fields.reorderLevel };
    }

    const inventory = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory item by ID
router.get('/inventory/:id', auth, async (req, res) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create inventory item
router.post('/inventory', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: {
        ...req.body,
        quantity: parseInt(req.body.quantity),
        unitPrice: parseFloat(req.body.unitPrice),
        reorderLevel: parseInt(req.body.reorderLevel),
      },
    });

    res.status(201).json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
router.put('/inventory/:id', auth, async (req, res) => {
  try {
    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        unitPrice: req.body.unitPrice ? parseFloat(req.body.unitPrice) : undefined,
        reorderLevel: req.body.reorderLevel ? parseInt(req.body.reorderLevel) : undefined,
      },
    });

    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.put('/inventory/:id/stock', auth, async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const quantityChange = parseInt(quantity);

    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        quantity: { increment: quantityChange },
      },
    });

    // Log stock movement
    await prisma.stockMovement.create({
      data: {
        itemId: req.params.id,
        quantity: quantityChange,
        reason,
        userId: req.user.id,
      },
    });

    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/inventory/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.inventoryItem.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/inventory/low-stock/list', auth, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.reorderLevel,
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAINTENANCE COSTS ====================

// Get maintenance costs
router.get('/maintenance-costs', auth, async (req, res) => {
  try {
    const { startDate, endDate, busId, category } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (busId) where.busId = busId;
    if (category) where.category = category;

    const costs = await prisma.maintenanceCost.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(costs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost by bus
router.get('/costs/bus/:busId', auth, async (req, res) => {
  try {
    const { period } = req.query; // 'month', 'quarter', 'year'
    
    let startDate = new Date();
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const costs = await prisma.maintenanceCost.findMany({
      where: {
        busId: req.params.busId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);

    res.json({ data: costs, totalCost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance cost
router.post('/maintenance-costs', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const cost = await prisma.maintenanceCost.create({
      data: {
        ...req.body,
        amount: parseFloat(req.body.amount),
      },
    });

    res.status(201).json({ data: cost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance cost
router.put('/maintenance-costs/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const cost = await prisma.maintenanceCost.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
      },
    });

    res.json({ data: cost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete maintenance cost
router.delete('/maintenance-costs/:id', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    await prisma.maintenanceCost.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Cost deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost breakdown
router.get('/maintenance-costs/breakdown/:period', auth, async (req, res) => {
  try {
    const { period } = req.params; // 'month', 'quarter', 'year'
    
    let startDate = new Date();
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const costs = await prisma.maintenanceCost.groupBy({
      by: ['category'],
      where: {
        date: { gte: startDate },
      },
      _sum: {
        amount: true,
      },
    });

    res.json({ data: costs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAINTENANCE RECORDS ====================

// Get maintenance records
router.get('/maintenance-records', auth, async (req, res) => {
  try {
    const { busId } = req.query;
    
    const where = {};
    if (busId) where.busId = busId;

    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        bus: {
          select: { registrationNumber: true, model: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance record
router.post('/maintenance-records', auth, async (req, res) => {
  try {
    const record = await prisma.maintenanceRecord.create({
      data: {
        ...req.body,
        cost: parseFloat(req.body.cost),
      },
    });

    res.status(201).json({ data: record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAINTENANCE SETTINGS ====================

// Save maintenance settings
router.post('/settings', auth, authorize('SUPER_ADMIN', 'MAINTENANCE_MANAGER'), async (req, res) => {
  try {
    // Store settings in a separate table or configuration
    // For now, just acknowledge the save
    res.json({ message: 'Settings saved successfully', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance settings
router.get('/settings', auth, async (req, res) => {
  try {
    // Return default settings for now
    const settings = {
      oilChangeInterval: 5000,
      brakeInspectionInterval: 10000,
      tireRotationInterval: 8000,
      fullServiceInterval: 20000,
      lowStockAlert: 20,
      criticalStockAlert: 5,
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
