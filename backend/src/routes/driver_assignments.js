const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all driver assignments
router.get('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { driverId, status, date } = req.query;
    
    const where = {};
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;
    if (date) {
      const targetDate = new Date(date);
      where.departureDate = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    const assignments = await prisma.trip.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: { departureDate: 'asc' },
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching driver assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active assignments (today and upcoming)
router.get('/active', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const now = new Date();
    
    const activeAssignments = await prisma.trip.findMany({
      where: {
        departureDate: {
          gte: now,
        },
        status: {
          in: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'],
        },
        driverId: {
          not: null,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bus: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: { departureDate: 'asc' },
      take: 50,
    });

    res.json({ success: true, data: activeAssignments });
  } catch (error) {
    console.error('Error fetching active assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create assignment (assign driver to trip)
router.post('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { tripId, driverId, busId } = req.body;

    if (!tripId || !driverId) {
      return res.status(400).json({ error: 'tripId and driverId are required' });
    }

    // Check for overlapping assignments
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { departureDate: true, arrivalDate: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if driver has overlapping trips
    const overlapping = await prisma.trip.findFirst({
      where: {
        driverId,
        id: { not: tripId },
        OR: [
          {
            departureDate: {
              lte: trip.arrivalDate,
            },
            arrivalDate: {
              gte: trip.departureDate,
            },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({ 
        error: 'Driver has overlapping assignment',
        overlappingTrip: overlapping.id,
      });
    }

    // Update trip with driver assignment
    const updateData = { driverId };
    if (busId) updateData.busId = busId;

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        bus: {
          select: {
            id: true,
            registrationNumber: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: updatedTrip });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unassign driver from trip
router.delete('/:tripId', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { tripId } = req.params;

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        driverId: null,
      },
    });

    res.json({ success: true, message: 'Driver unassigned', data: updatedTrip });
  } catch (error) {
    console.error('Error unassigning driver:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
