const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== INCOME ====================

// Get all income
router.get('/income', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate, category, source } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (category) where.category = category;
    if (source) where.source = source;

    const income = await prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = income.reduce((sum, item) => sum + item.amount, 0);

    res.json({ data: income, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add income
router.post('/income', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const income = await prisma.income.create({
      data: {
        ...req.body,
        amount: parseFloat(req.body.amount),
        recordedBy: req.user.id,
      },
    });

    res.status(201).json({ data: income });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSES ====================

// Get all expenses
router.get('/expenses', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true },
        },
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const total = expenses.reduce((sum, item) => sum + item.amount, 0);

    res.json({ data: expenses, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit expense
router.post('/expenses', auth, async (req, res) => {
  try {
    const expense = await prisma.expense.create({
      data: {
        ...req.body,
        amount: parseFloat(req.body.amount),
        submittedById: req.user.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({ data: expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve expense
router.put('/expenses/:id/approve', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: req.body.notes,
      },
    });

    res.json({ data: expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject expense
router.put('/expenses/:id/reject', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { reason } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: reason,
      },
    });

    res.json({ data: expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYROLL ====================

// Get payroll for a month
router.get('/payroll/:month', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER'), async (req, res) => {
  try {
    const payroll = await prisma.payroll.findMany({
      where: { month: req.params.month },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: { employee: { firstName: 'asc' } },
    });

    const totalGross = payroll.reduce((sum, item) => sum + item.grossSalary, 0);
    const totalNet = payroll.reduce((sum, item) => sum + item.netSalary, 0);

    res.json({ data: payroll, totalGross, totalNet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process payroll
router.post('/payroll/process', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { month, records } = req.body;

    const payroll = await prisma.payroll.createMany({
      data: records.map(record => ({
        ...record,
        month,
        processedById: req.user.id,
        processedAt: new Date(),
      })),
    });

    res.status(201).json({ data: payroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FUEL LOGS ====================

// Get fuel logs
router.get('/fuel-logs', auth, async (req, res) => {
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

    const logs = await prisma.fuelLog.findMany({
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

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);
    const totalLiters = logs.reduce((sum, log) => sum + log.liters, 0);

    res.json({ data: logs, totalAmount, totalLiters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit fuel log
router.post('/fuel-logs', auth, async (req, res) => {
  try {
    const log = await prisma.fuelLog.create({
      data: {
        ...req.body,
        amount: parseFloat(req.body.amount),
        liters: parseFloat(req.body.liters),
        driverId: req.user.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({ data: log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve fuel log
router.put('/fuel-logs/:id/approve', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const log = await prisma.fuelLog.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    res.json({ data: log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES ====================

// Get invoices
router.get('/invoices', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/invoices', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: {
        ...req.body,
        amount: parseFloat(req.body.amount),
        createdById: req.user.id,
      },
    });

    res.status(201).json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send invoice
router.post('/invoices/:id/send', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { email } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // TODO: Implement email sending logic here

    res.json({ data: invoice, message: 'Invoice sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REFUNDS ====================

// Get refund requests
router.get('/refunds', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        booking: {
          include: {
            trip: {
              include: { route: true },
            },
            passenger: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: refunds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process refund
router.post('/refunds/:id/process', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const refund = await prisma.refund.update({
      where: { id: req.params.id },
      data: {
        status,
        processedById: req.user.id,
        processedAt: new Date(),
        notes,
      },
    });

    res.json({ data: refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACCOUNTS ====================

// Get accounts
router.get('/accounts', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({ data: accounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload bank statement
router.post('/accounts/:id/statement', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    // TODO: Implement file upload logic
    res.json({ message: 'Bank statement uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REVENUE SUMMARY ====================

// Get revenue summary
router.get('/revenue-summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get total income
    const income = await prisma.income.findMany({ where });
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);

    // Get total expenses
    const expenses = await prisma.expense.findMany({ where });
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Get bookings revenue (last 30 days if no date range specified)
    const bookingWhere = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: 'CONFIRMED',
    } : {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      status: 'CONFIRMED',
    };

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: { totalAmount: true },
    });
    const bookingsRevenue = bookings.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    res.json({
      data: {
        totalIncome,
        totalExpenses,
        bookingsRevenue,
        netProfit: totalIncome - totalExpenses,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COLLECTIONS ====================

// Record cash collection
router.post('/collections', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER', 'TICKETING_AGENT'), async (req, res) => {
  try {
    const { amount, source, collectedBy, notes, date } = req.body;

    if (!amount || !source) {
      return res.status(400).json({ error: 'amount and source are required' });
    }

    const collection = await prisma.collection.create({
      data: {
        amount: parseFloat(amount),
        source,
        collectedBy: collectedBy || req.user.id,
        notes: notes || '',
        date: date ? new Date(date) : new Date(),
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    console.error('Error recording collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collections
router.get('/collections', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const where = {};
    if (status) where.status = status;
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const collections = await prisma.collection.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = collections.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    res.json({ success: true, data: collections, total });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECONCILIATION ====================

// Run daily reconciliation
router.post('/reconcile/:date', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { date } = req.params;
    const reconciliationDate = new Date(date);
    reconciliationDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(reconciliationDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all bookings for the day
    const bookings = await prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: reconciliationDate,
          lt: nextDay,
        },
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Get all collections for the day
    const collections = await prisma.collection.aggregate({
      where: {
        date: {
          gte: reconciliationDate,
          lt: nextDay,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get all expenses for the day
    const expenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: reconciliationDate,
          lt: nextDay,
        },
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const reconciliation = {
      date: reconciliationDate,
      bookingsRevenue: parseFloat(bookings._sum.totalAmount || 0),
      bookingsCount: bookings._count,
      collectionsTotal: parseFloat(collections._sum.amount || 0),
      collectionsCount: collections._count,
      expensesTotal: parseFloat(expenses._sum.amount || 0),
      expensesCount: expenses._count,
      netCash: parseFloat(collections._sum.amount || 0) - parseFloat(expenses._sum.amount || 0),
      reconciled: true,
      reconciledBy: req.user.id,
      reconciledAt: new Date(),
    };

    // Store reconciliation record
    const record = await prisma.reconciliation.upsert({
      where: { date: reconciliationDate },
      update: reconciliation,
      create: reconciliation,
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error running reconciliation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reconciliation report
router.get('/reconciliation/:date', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { date } = req.params;
    const reconciliationDate = new Date(date);
    reconciliationDate.setHours(0, 0, 0, 0);

    const reconciliation = await prisma.reconciliation.findUnique({
      where: { date: reconciliationDate },
    });

    if (!reconciliation) {
      return res.status(404).json({ error: 'Reconciliation not found. Please run reconciliation first.' });
    }

    res.json({ success: true, data: reconciliation });
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSE APPROVAL ====================

// Approve expense
router.put('/expenses/:id/approve', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        notes: notes ? `${notes}\nApproved by: ${req.user.firstName} ${req.user.lastName}` : undefined,
      },
    });

    res.json({ success: true, data: expense, message: 'Expense approved' });
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject expense
router.put('/expenses/:id/reject', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        notes: reason ? `Rejected: ${reason}` : 'Rejected',
      },
    });

    res.json({ success: true, data: expense, message: 'Expense rejected' });
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending expenses for approval
router.get('/expenses/pending', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const pendingExpenses = await prisma.expense.findMany({
      where: { status: 'PENDING' },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: pendingExpenses, count: pendingExpenses.length });
  } catch (error) {
    console.error('Error fetching pending expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get finance summary
router.get('/summary', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const where = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all financial data
    const income = await prisma.income.aggregate({
      where,
      _sum: { amount: true },
    });

    const expenses = await prisma.expense.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { amount: true },
    });

    const bookings = await prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      _sum: { totalAmount: true },
    });

    const pendingExpenses = await prisma.expense.count({
      where: { status: 'PENDING' },
    });

    const summary = {
      period: { from: startDate, to: endDate },
      totalIncome: parseFloat(income._sum.amount || 0),
      totalExpenses: parseFloat(expenses._sum.amount || 0),
      bookingsRevenue: parseFloat(bookings._sum.totalAmount || 0),
      netProfit: parseFloat(income._sum.amount || 0) - parseFloat(expenses._sum.amount || 0),
      pendingExpensesCount: pendingExpenses,
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching finance summary:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
