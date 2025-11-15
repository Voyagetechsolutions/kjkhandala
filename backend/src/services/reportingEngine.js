const { supabase, pool } = require('../config/supabase');

class ReportingEngine {
  /**
   * DAILY SALES REPORT
   */
  async dailySalesReport(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for the day
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        passenger: true,
        trip: {
          include: {
            route: true
          }
        }
      }
    });

    // Get payment transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'COMPLETED'
      }
    });

    const report = {
      date,
      summary: {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.bookingStatus === 'CONFIRMED').length,
        cancelledBookings: bookings.filter(b => b.bookingStatus === 'CANCELLED').length,
        totalRevenue: transactions
          .filter(t => parseFloat(t.amount) > 0)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalRefunds: Math.abs(transactions
          .filter(t => parseFloat(t.amount) < 0)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)),
        cashPayments: transactions.filter(t => t.paymentMethod === 'CASH').length,
        cardPayments: transactions.filter(t => t.paymentMethod === 'CARD' || t.paymentMethod === 'DPO').length,
        mobilePayments: transactions.filter(t => t.paymentMethod === 'MOBILE_MONEY').length
      },
      byRoute: {},
      byPaymentMethod: {},
      hourlyBreakdown: Array(24).fill(0).map((_, hour) => ({
        hour,
        bookings: 0,
        revenue: 0
      }))
    };

    // Group by route
    bookings.forEach(booking => {
      const routeName = `${booking.trip.route.origin} - ${booking.trip.route.destination}`;
      
      if (!report.byRoute[routeName]) {
        report.byRoute[routeName] = {
          bookings: 0,
          revenue: 0,
          passengers: 0
        };
      }

      report.byRoute[routeName].bookings++;
      if (booking.paymentStatus === 'PAID') {
        report.byRoute[routeName].revenue += parseFloat(booking.totalAmount);
      }
      report.byRoute[routeName].passengers++;

      // Hourly breakdown
      const hour = new Date(booking.bookingDate).getHours();
      report.hourlyBreakdown[hour].bookings++;
      if (booking.paymentStatus === 'PAID') {
        report.hourlyBreakdown[hour].revenue += parseFloat(booking.totalAmount);
      }
    });

    // Group by payment method
    transactions.forEach(t => {
      if (!report.byPaymentMethod[t.paymentMethod]) {
        report.byPaymentMethod[t.paymentMethod] = {
          count: 0,
          amount: 0
        };
      }
      report.byPaymentMethod[t.paymentMethod].count++;
      report.byPaymentMethod[t.paymentMethod].amount += parseFloat(t.amount);
    });

    report.summary.netRevenue = report.summary.totalRevenue - report.summary.totalRefunds;

    return report;
  }

  /**
   * TRIP PERFORMANCE REPORT
   */
  async tripPerformanceReport(startDate, endDate) {
    const trips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: {
          where: {
            bookingStatus: { not: 'CANCELLED' }
          }
        }
      }
    });

    const report = {
      period: { startDate, endDate },
      summary: {
        totalTrips: trips.length,
        completedTrips: trips.filter(t => t.status === 'COMPLETED').length,
        cancelledTrips: trips.filter(t => t.status === 'CANCELLED').length,
        inProgressTrips: trips.filter(t => ['DEPARTED', 'IN_TRANSIT'].includes(t.status)).length,
        averageOccupancy: 0,
        totalPassengers: 0,
        totalRevenue: 0
      },
      trips: []
    };

    trips.forEach(trip => {
      const passengers = trip.bookings.length;
      const capacity = trip.bus.capacity;
      const occupancyRate = (passengers / capacity) * 100;
      const revenue = trip.bookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

      report.summary.totalPassengers += passengers;
      report.summary.totalRevenue += revenue;

      report.trips.push({
        tripId: trip.id,
        route: `${trip.route.origin} - ${trip.route.destination}`,
        departureTime: trip.departureTime,
        status: trip.status,
        driver: trip.driver?.name || 'N/A',
        bus: trip.bus.registrationNumber,
        passengers,
        capacity,
        occupancyRate: occupancyRate.toFixed(2),
        revenue: revenue.toFixed(2),
        noShows: trip.bookings.filter(b => b.bookingStatus === 'NO_SHOW').length
      });
    });

    report.summary.averageOccupancy = (
      report.trips.reduce((sum, t) => sum + parseFloat(t.occupancyRate), 0) / report.trips.length
    ).toFixed(2);

    return report;
  }

  /**
   * DRIVER PERFORMANCE REPORT
   */
  async driverPerformanceReport(driverId, startDate, endDate) {
    const driver = await prisma.user.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const trips = await prisma.trip.findMany({
      where: {
        driverId,
        departureTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        route: true,
        bookings: true
      }
    });

    // Get trip logs for incidents
    const incidents = await prisma.tripLog.findMany({
      where: {
        tripId: { in: trips.map(t => t.id) },
        eventType: { in: ['ISSUE_REPORTED', 'DELAY', 'ACCIDENT'] }
      }
    });

    const report = {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email
      },
      period: { startDate, endDate },
      summary: {
        totalTrips: trips.length,
        completedTrips: trips.filter(t => t.status === 'COMPLETED').length,
        totalPassengers: trips.reduce((sum, t) => sum + t.bookings.length, 0),
        totalDistance: trips
          .filter(t => t.tripStats?.distanceTraveled)
          .reduce((sum, t) => sum + (t.tripStats.distanceTraveled || 0), 0),
        totalIncidents: incidents.length,
        delays: incidents.filter(i => i.eventType === 'DELAY').length,
        issues: incidents.filter(i => i.eventType === 'ISSUE_REPORTED').length,
        accidents: incidents.filter(i => i.eventType === 'ACCIDENT').length,
        onTimePerformance: 0,
        safetyScore: 100
      },
      tripHistory: []
    };

    // Calculate on-time performance
    const completedTrips = trips.filter(t => t.status === 'COMPLETED');
    if (completedTrips.length > 0) {
      const onTimeTrips = completedTrips.filter(t => {
        const scheduled = new Date(t.arrivalTime);
        const actual = new Date(t.actualArrivalTime || t.arrivalTime);
        const diffMinutes = (actual - scheduled) / (1000 * 60);
        return diffMinutes <= 15; // On-time if within 15 minutes
      });
      report.summary.onTimePerformance = ((onTimeTrips.length / completedTrips.length) * 100).toFixed(2);
    }

    // Calculate safety score (deduct points for incidents)
    report.summary.safetyScore -= (report.summary.delays * 2);
    report.summary.safetyScore -= (report.summary.issues * 5);
    report.summary.safetyScore -= (report.summary.accidents * 20);
    report.summary.safetyScore = Math.max(0, report.summary.safetyScore);

    // Trip history
    report.tripHistory = trips.map(trip => ({
      date: trip.departureTime,
      route: `${trip.route.origin} - ${trip.route.destination}`,
      status: trip.status,
      passengers: trip.bookings.length,
      incidents: incidents.filter(i => i.tripId === trip.id).length
    }));

    return report;
  }

  /**
   * OPERATIONS REPORT
   */
  async operationsReport(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: true
      }
    });

    const report = {
      date,
      fleet: {
        totalBuses: await prisma.bus.count(),
        activeBuses: trips.map(t => t.busId).filter((v, i, a) => a.indexOf(v) === i).length,
        inMaintenance: await prisma.bus.count({ where: { status: 'MAINTENANCE' } })
      },
      trips: {
        scheduled: trips.filter(t => t.status === 'SCHEDULED').length,
        boarding: trips.filter(t => t.status === 'BOARDING').length,
        departed: trips.filter(t => t.status === 'DEPARTED').length,
        inTransit: trips.filter(t => t.status === 'IN_TRANSIT').length,
        arrived: trips.filter(t => t.status === 'ARRIVED').length,
        completed: trips.filter(t => t.status === 'COMPLETED').length,
        cancelled: trips.filter(t => t.status === 'CANCELLED').length
      },
      drivers: {
        totalDrivers: await prisma.user.count({ where: { role: 'DRIVER' } }),
        activeDrivers: trips.map(t => t.driverId).filter((v, i, a) => a.indexOf(v) === i).length
      },
      passengers: {
        totalBooked: trips.reduce((sum, t) => sum + t.bookings.length, 0),
        checkedIn: trips.reduce((sum, t) => sum + t.bookings.filter(b => b.checkedIn).length, 0),
        noShows: trips.reduce((sum, t) => sum + t.bookings.filter(b => b.bookingStatus === 'NO_SHOW').length, 0)
      },
      issues: await prisma.tripLog.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay
          },
          eventType: 'ISSUE_REPORTED'
        }
      })
    };

    return report;
  }

  /**
   * REVENUE REPORT
   */
  async revenueReport(startDate, endDate) {
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true
              }
            }
          }
        }
      }
    });

    const report = {
      period: { startDate, endDate },
      summary: {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        totalRefunds: 0,
        netRevenue: 0
      },
      byRoute: {},
      byPaymentMethod: {},
      daily: {}
    };

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      const date = t.transactionDate.toISOString().split('T')[0];

      if (amount > 0) {
        report.summary.totalRevenue += amount;
      } else {
        report.summary.totalRefunds += Math.abs(amount);
      }

      // By route
      if (t.booking?.trip?.route) {
        const routeName = `${t.booking.trip.route.origin} - ${t.booking.trip.route.destination}`;
        if (!report.byRoute[routeName]) {
          report.byRoute[routeName] = 0;
        }
        report.byRoute[routeName] += amount;
      }

      // By payment method
      if (!report.byPaymentMethod[t.paymentMethod]) {
        report.byPaymentMethod[t.paymentMethod] = 0;
      }
      report.byPaymentMethod[t.paymentMethod] += amount;

      // Daily breakdown
      if (!report.daily[date]) {
        report.daily[date] = 0;
      }
      report.daily[date] += amount;
    });

    report.summary.netRevenue = report.summary.totalRevenue - report.summary.totalRefunds;

    return report;
  }

  /**
   * EXPORT TO CSV
   */
  exportToCSV(data, headers) {
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      csv += headers.map(h => row[h] || '').join(',') + '\n';
    });

    return csv;
  }
}

module.exports = new ReportingEngine();
