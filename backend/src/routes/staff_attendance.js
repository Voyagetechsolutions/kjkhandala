const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get attendance records
router.get('/', auth, authorize('SUPER_ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { userId, from, to, status } = req.query;
    
    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    } else if (from) {
      where.date = { gte: new Date(from) };
    } else if (to) {
      where.date = { lte: new Date(to) };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get my attendance (for logged-in user)
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const where = { userId: req.user.id };
    
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      onLeave: attendance.filter(a => a.status === 'LEAVE').length,
    };

    res.json({ success: true, data: attendance, summary });
  } catch (error) {
    console.error('Error fetching my attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check in/out
router.post('/checkin', auth, async (req, res) => {
  try {
    const { lat, lng, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: today,
      },
    });

    if (existing && existing.checkInTime) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const workStartTime = new Date(today);
    workStartTime.setHours(8, 0, 0, 0); // 8 AM start time

    const isLate = checkInTime > workStartTime;

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
      update: {
        checkInTime,
        checkInLocation: lat && lng ? { lat, lng } : null,
        status: isLate ? 'LATE' : 'PRESENT',
        notes: notes || '',
      },
      create: {
        userId: req.user.id,
        date: today,
        checkInTime,
        checkInLocation: lat && lng ? { lat, lng } : null,
        status: isLate ? 'PRESENT' : 'PRESENT',
        notes: notes || '',
      },
    });

    res.json({ 
      success: true, 
      data: attendance,
      message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check out
router.post('/checkout', auth, async (req, res) => {
  try {
    const { lat, lng, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        date: today,
      },
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    const hoursWorked = attendance.checkInTime 
      ? (checkOutTime - attendance.checkInTime) / (1000 * 60 * 60)
      : 0;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLocation: lat && lng ? { lat, lng } : null,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        notes: notes ? `${attendance.notes || ''}\n${notes}` : attendance.notes,
      },
    });

    res.json({ success: true, data: updated, message: 'Checked out successfully' });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance (by HR/Admin)
router.post('/mark', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { userId, date, status, checkInTime, checkOutTime, notes } = req.body;

    if (!userId || !date || !status) {
      return res.status(400).json({ error: 'userId, date, and status are required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const data = {
      userId,
      date: attendanceDate,
      status,
      notes: notes || '',
    };

    if (checkInTime) data.checkInTime = new Date(checkInTime);
    if (checkOutTime) data.checkOutTime = new Date(checkOutTime);

    if (data.checkInTime && data.checkOutTime) {
      const hoursWorked = (data.checkOutTime - data.checkInTime) / (1000 * 60 * 60);
      data.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: attendanceDate,
        },
      },
      update: data,
      create: data,
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get attendance summary for a user
router.get('/summary/:userId', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const summary = {
      userId,
      period: { month: currentMonth, year: currentYear },
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      onLeave: attendance.filter(a => a.status === 'LEAVE').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0).toFixed(2),
    };

    res.json({ success: true, data: summary, records: attendance });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get today's attendance overview (for dashboard)
router.get('/today/overview', auth, authorize('SUPER_ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    const totalStaff = await prisma.user.count({
      where: {
        role: {
          in: ['DRIVER', 'TICKETING_AGENT', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'MAINTENANCE_MANAGER'],
        },
      },
    });

    const summary = {
      date: today,
      totalStaff,
      checkedIn: attendance.filter(a => a.checkInTime).length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      onLeave: attendance.filter(a => a.status === 'LEAVE').length,
      notMarked: totalStaff - attendance.length,
    };

    res.json({ success: true, data: summary, records: attendance });
  } catch (error) {
    console.error('Error fetching today\'s overview:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
