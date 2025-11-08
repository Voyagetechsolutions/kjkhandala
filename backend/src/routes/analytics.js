const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Daily sales report
router.get('/daily-sales/:date', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get bookings for the day
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    const totalSales = bookings
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;

    // Group by route
    const byRoute = bookings.reduce((acc, booking) => {
      const routeName = booking.trip?.route?.name || 'Unknown';
      if (!acc[routeName]) {
        acc[routeName] = { count: 0, revenue: 0 };
      }
      acc[routeName].count++;
      if (booking.status === 'CONFIRMED') {
        acc[routeName].revenue += parseFloat(booking.totalAmount || 0);
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalBookings: bookings.length,
          confirmedBookings,
          cancelledBookings,
          totalSales: parseFloat(totalSales.toFixed(2)),
        },
        byRoute,
        bookings,
      },
    });
  } catch (error) {
    console.error('Error generating daily sales report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trip performance report
router.get('/trip-performance', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const trips = await prisma.trip.findMany({
      where: {
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    const performance = trips.map(trip => {
      const busCapacity = trip.bus?.capacity || 50;
      const bookingsCount = trip.bookings.length;
      const revenue = trip.bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      const occupancyRate = ((bookingsCount / busCapacity) * 100).toFixed(2);

      return {
        tripId: trip.id,
        route: trip.route?.name,
        departureDate: trip.departureDate,
        status: trip.status,
        driver: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unassigned',
        bus: trip.bus?.registrationNumber,
        capacity: busCapacity,
        bookings: bookingsCount,
        occupancyRate: parseFloat(occupancyRate),
        revenue: parseFloat(revenue.toFixed(2)),
      };
    });

    const summary = {
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === 'COMPLETED').length,
      cancelledTrips: trips.filter(t => t.status === 'CANCELLED').length,
      averageOccupancy: (
        performance.reduce((sum, p) => sum + p.occupancyRate, 0) / performance.length
      ).toFixed(2),
      totalRevenue: performance.reduce((sum, p) => sum + p.revenue, 0).toFixed(2),
    };

    res.json({
      success: true,
      data: {
        period: { from: startDate, to: endDate },
        summary,
        trips: performance,
      },
    });
  } catch (error) {
    console.error('Error generating trip performance report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Driver performance report
router.get('/driver-performance/:id', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const driver = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get completed trips
    const trips = await prisma.trip.findMany({
      where: {
        driverId: id,
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['COMPLETED', 'ARRIVED'],
        },
      },
      include: {
        route: true,
        bookings: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    // Get incidents
    const incidents = await prisma.breakdownReport.count({
      where: {
        driverId: id,
        reportedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate metrics
    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, trip) => {
      return sum + trip.bookings.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0);
    }, 0);

    const totalDistance = trips.reduce((sum, trip) => sum + (trip.route?.distance || 0), 0);

    res.json({
      success: true,
      data: {
        driver,
        period: { from: startDate, to: endDate },
        metrics: {
          totalTrips,
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          incidents,
          averageRevenuePerTrip: totalTrips > 0 ? parseFloat((totalRevenue / totalTrips).toFixed(2)) : 0,
        },
        trips: trips.map(t => ({
          id: t.id,
          route: t.route?.name,
          date: t.departureDate,
          bookings: t.bookings.length,
          revenue: t.bookings.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0).toFixed(2),
        })),
      },
    });
  } catch (error) {
    console.error('Error generating driver performance report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Revenue report
router.get('/revenue', auth, authorize('SUPER_ADMIN', 'FINANCE_MANAGER'), async (req, res) => {
  try {
    const { from, to, routeId } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'CONFIRMED',
    };

    if (routeId) {
      where.trip = {
        routeId,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

    // Group by date
    const byDate = bookings.reduce((acc, booking) => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 };
      }
      acc[date].count++;
      acc[date].revenue += parseFloat(booking.totalAmount || 0);
      return acc;
    }, {});

    // Group by route
    const byRoute = bookings.reduce((acc, booking) => {
      const routeName = booking.trip?.route?.name || 'Unknown';
      if (!acc[routeName]) {
        acc[routeName] = { count: 0, revenue: 0 };
      }
      acc[routeName].count++;
      acc[routeName].revenue += parseFloat(booking.totalAmount || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: { from: startDate, to: endDate },
        summary: {
          totalBookings: bookings.length,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          averagePerBooking: bookings.length > 0 ? parseFloat((totalRevenue / bookings.length).toFixed(2)) : 0,
        },
        byDate,
        byRoute,
      },
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fleet utilization report
router.get('/fleet-utilization', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const buses = await prisma.bus.findMany({
      include: {
        trips: {
          where: {
            departureDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    });

    const utilization = buses.map(bus => {
      const totalTrips = bus.trips.length;
      const completedTrips = bus.trips.filter(t => t.status === 'COMPLETED').length;
      const totalBookings = bus.trips.reduce((sum, t) => sum + t.bookings.length, 0);
      const averageOccupancy = totalTrips > 0
        ? ((totalBookings / (totalTrips * bus.capacity)) * 100).toFixed(2)
        : 0;

      return {
        busId: bus.id,
        registrationNumber: bus.registrationNumber,
        model: bus.model,
        capacity: bus.capacity,
        status: bus.status,
        totalTrips,
        completedTrips,
        totalBookings,
        averageOccupancy: parseFloat(averageOccupancy),
      };
    });

    res.json({
      success: true,
      data: {
        period: { from: startDate, to: endDate },
        buses: utilization,
        summary: {
          totalBuses: buses.length,
          activeBuses: buses.filter(b => b.status === 'ACTIVE').length,
          averageUtilization: (
            utilization.reduce((sum, u) => sum + u.averageOccupancy, 0) / utilization.length
          ).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error generating fleet utilization report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
