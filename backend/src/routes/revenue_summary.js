const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get revenue summary
router.get('/', auth, async (req, res) => {
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

module.exports = router;
