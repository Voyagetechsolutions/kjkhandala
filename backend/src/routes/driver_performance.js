const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get driver performance metrics
router.get('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER'), async (req, res) => {
  try {
    const { driverId, from, to } = req.query;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    // Date range defaults (last 30 days if not specified)
    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get completed trips
    const trips = await prisma.trip.findMany({
      where: {
        driverId,
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['COMPLETED', 'ARRIVED'],
        },
      },
      include: {
        route: {
          select: {
            distance: true,
            duration: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalTrips = trips.length;
    const totalDistance = trips.reduce((sum, trip) => sum + (trip.route?.distance || 0), 0);

    // On-time performance (arrivals within 15 minutes of scheduled)
    const onTimeTrips = trips.filter(trip => {
      if (!trip.arrivalDate) return false;
      const scheduledArrival = new Date(trip.arrivalDate);
      const actualArrival = new Date(trip.updatedAt); // approximation
      const diffMinutes = Math.abs(actualArrival - scheduledArrival) / (1000 * 60);
      return diffMinutes <= 15;
    });
    const onTimePercentage = totalTrips > 0 ? ((onTimeTrips.length / totalTrips) * 100).toFixed(2) : 0;

    // Get incidents/breakdowns reported
    const incidents = await prisma.breakdownReport.count({
      where: {
        driverId,
        reportedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get fuel logs
    const fuelLogs = await prisma.fuelLog.findMany({
      where: {
        driverId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);
    const totalLiters = fuelLogs.reduce((sum, log) => sum + parseFloat(log.liters || 0), 0);
    const avgFuelEfficiency = totalDistance > 0 && totalLiters > 0 
      ? (totalDistance / totalLiters).toFixed(2) 
      : 0;

    // Revenue contribution (from completed trips' bookings)
    const bookingsRevenue = await prisma.booking.aggregate({
      where: {
        trip: {
          driverId,
          departureDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        status: 'CONFIRMED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const performance = {
      driverId,
      period: { from: startDate, to: endDate },
      metrics: {
        totalTrips,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        onTimePercentage: parseFloat(onTimePercentage),
        incidents,
        fuelEfficiency: parseFloat(avgFuelEfficiency),
        totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
        totalLiters: parseFloat(totalLiters.toFixed(2)),
        revenueContribution: parseFloat(bookingsRevenue._sum.totalAmount || 0),
      },
      trips: trips.map(t => ({
        id: t.id,
        departureDate: t.departureDate,
        status: t.status,
        route: t.route?.name || 'N/A',
      })),
    };

    res.json({ success: true, data: performance });
  } catch (error) {
    console.error('Error fetching driver performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get performance summary for all drivers
router.get('/summary', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER'), async (req, res) => {
  try {
    const { from, to } = req.query;

    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all active drivers
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const summaries = await Promise.all(
      drivers.map(async (driver) => {
        const tripCount = await prisma.trip.count({
          where: {
            driverId: driver.id,
            departureDate: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ['COMPLETED', 'ARRIVED'],
            },
          },
        });

        const incidents = await prisma.breakdownReport.count({
          where: {
            driverId: driver.id,
            reportedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          totalTrips: tripCount,
          incidents,
        };
      })
    );

    res.json({ success: true, data: summaries });
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
