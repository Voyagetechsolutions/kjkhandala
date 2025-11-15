const { supabase, pool } = require('../config/supabase');
const notificationEngine = require('./notificationEngine');

/**
 * TRIP LIFECYCLE STATES:
 * DRAFT → SCHEDULED → BOARDING → DEPARTED → IN_TRANSIT → ARRIVED → COMPLETED → CANCELLED
 */

class TripEngine {
  /**
   * TRIP STATE MACHINE
   */
  STATES = {
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    BOARDING: 'BOARDING',
    DEPARTED: 'DEPARTED',
    IN_TRANSIT: 'IN_TRANSIT',
    ARRIVED: 'ARRIVED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  };

  VALID_TRANSITIONS = {
    DRAFT: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['BOARDING', 'CANCELLED'],
    BOARDING: ['DEPARTED', 'CANCELLED'],
    DEPARTED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: []
  };

  /**
   * VALIDATE STATE TRANSITION
   */
  canTransition(currentState, newState) {
    const allowedStates = this.VALID_TRANSITIONS[currentState] || [];
    return allowedStates.includes(newState);
  }

  /**
   * CHANGE TRIP STATUS
   */
  async changeStatus(tripId, newStatus, userId, reason = null) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (!this.canTransition(trip.status, newStatus)) {
      throw new Error(`Cannot transition from ${trip.status} to ${newStatus}`);
    }

    // Update trip status
    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Log status change
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'STATUS_CHANGE',
        description: `Status changed from ${trip.status} to ${newStatus}${reason ? `: ${reason}` : ''}`,
        timestamp: new Date()
      }
    });

    // Send notifications based on status
    await this.handleStatusNotifications(updated, trip.status);

    return updated;
  }

  /**
   * AUTOMATIC STATUS TRANSITIONS
   */
  async autoTransitionTrips() {
    const now = new Date();

    // 1. SCHEDULED → BOARDING (30 minutes before departure)
    const boardingTime = new Date(now.getTime() + 30 * 60 * 1000);
    await prisma.trip.updateMany({
      where: {
        status: 'SCHEDULED',
        departureTime: {
          lte: boardingTime,
          gt: now
        }
      },
      data: {
        status: 'BOARDING'
      }
    });

    // 2. DEPARTED → IN_TRANSIT (automatically after departure)
    const departedTrips = await prisma.trip.findMany({
      where: {
        status: 'DEPARTED',
        departureTime: {
          lt: now
        }
      }
    });

    for (const trip of departedTrips) {
      await this.changeStatus(trip.id, 'IN_TRANSIT', null, 'Auto-transition');
    }

    // 3. IN_TRANSIT → ARRIVED (based on estimated arrival)
    const arrivedTrips = await prisma.trip.findMany({
      where: {
        status: 'IN_TRANSIT',
        arrivalTime: {
          lt: now
        }
      }
    });

    for (const trip of arrivedTrips) {
      await this.changeStatus(trip.id, 'ARRIVED', null, 'Auto-transition');
    }

    console.log(`Auto-transitioned trips: ${departedTrips.length + arrivedTrips.length}`);
  }

  /**
   * DELAY ALERTS
   */
  async checkDelays() {
    const now = new Date();

    const delayedTrips = await prisma.trip.findMany({
      where: {
        status: { in: ['SCHEDULED', 'BOARDING'] },
        departureTime: {
          lt: now
        }
      },
      include: {
        route: true,
        driver: true,
        bookings: {
          where: {
            bookingStatus: 'CONFIRMED',
            paymentStatus: 'PAID'
          },
          include: {
            passenger: true
          }
        }
      }
    });

    for (const trip of delayedTrips) {
      const delayMinutes = Math.floor((now - new Date(trip.departureTime)) / (1000 * 60));

      // Log delay
      await prisma.tripLog.create({
        data: {
          tripId: trip.id,
          eventType: 'DELAY',
          description: `Trip delayed by ${delayMinutes} minutes`,
          timestamp: now
        }
      });

      // Notify passengers
      for (const booking of trip.bookings) {
        await notificationEngine.send({
          userId: booking.passenger.userId,
          type: 'TRIP_DELAY',
          title: 'Trip Delayed',
          message: `Your trip from ${trip.route.origin} to ${trip.route.destination} is delayed by ${delayMinutes} minutes.`,
          data: { tripId: trip.id, delayMinutes }
        });
      }

      // Notify operations
      await notificationEngine.sendToRole('OPERATIONS_MANAGER', {
        type: 'TRIP_DELAY_ALERT',
        title: 'Trip Delay Alert',
        message: `Trip ${trip.id} is delayed by ${delayMinutes} minutes`,
        data: { tripId: trip.id, delayMinutes }
      });
    }

    return delayedTrips;
  }

  /**
   * COMPLETION RULES
   */
  async completeTrip(tripId, completionData) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: true
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status !== 'ARRIVED') {
      throw new Error('Trip must be in ARRIVED status to complete');
    }

    // Validate completion data
    if (!completionData.finalOdometer || !completionData.finalFuel) {
      throw new Error('Final odometer and fuel readings required');
    }

    // Calculate trip statistics
    const stats = {
      totalPassengers: trip.bookings.filter(b => b.bookingStatus === 'CONFIRMED').length,
      checkedInPassengers: trip.bookings.filter(b => b.checkedIn).length,
      noShows: trip.bookings.filter(b => b.bookingStatus === 'NO_SHOW').length,
      totalRevenue: trip.bookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0),
      distanceTraveled: completionData.finalOdometer - (trip.startOdometer || 0),
      fuelUsed: (trip.startFuel || 0) - completionData.finalFuel
    };

    // Update trip
    const completed = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        actualArrivalTime: new Date(),
        endOdometer: completionData.finalOdometer,
        endFuel: completionData.finalFuel,
        tripStats: stats,
        completionNotes: completionData.notes
      }
    });

    // Log completion
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'TRIP_COMPLETED',
        description: JSON.stringify(stats),
        timestamp: new Date()
      }
    });

    return { trip: completed, stats };
  }

  /**
   * CANCEL TRIP
   */
  async cancelTrip(tripId, reason, userId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: {
            bookingStatus: 'CONFIRMED'
          },
          include: {
            passenger: true
          }
        }
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed trip');
    }

    if (['DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(trip.status)) {
      throw new Error('Cannot cancel trip that has already departed');
    }

    // Cancel trip
    const cancelled = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId
      }
    });

    // Cancel all bookings and initiate refunds
    for (const booking of trip.bookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: 'CANCELLED',
          paymentStatus: 'REFUND_PENDING'
        }
      });

      // Notify passenger
      await notificationEngine.send({
        userId: booking.passenger.userId,
        type: 'TRIP_CANCELLED',
        title: 'Trip Cancelled',
        message: `Your trip has been cancelled. Reason: ${reason}. Full refund will be processed.`,
        data: { tripId, bookingId: booking.id }
      });
    }

    // Log cancellation
    await prisma.tripLog.create({
      data: {
        tripId,
        eventType: 'TRIP_CANCELLED',
        description: `Trip cancelled: ${reason}`,
        timestamp: new Date()
      }
    });

    return cancelled;
  }

  /**
   * HANDLE STATUS NOTIFICATIONS
   */
  async handleStatusNotifications(trip, oldStatus) {
    const messages = {
      BOARDING: 'Boarding has started for your trip',
      DEPARTED: 'Your trip has departed',
      IN_TRANSIT: 'Your trip is in transit',
      ARRIVED: 'Your trip has arrived at the destination',
      COMPLETED: 'Your trip has been completed. Thank you for traveling with us!'
    };

    const message = messages[trip.status];
    if (!message) return;

    // Get all passengers
    const bookings = await prisma.booking.findMany({
      where: {
        tripId: trip.id,
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'PAID'
      },
      include: {
        passenger: true
      }
    });

    // Send notifications
    for (const booking of bookings) {
      await notificationEngine.send({
        userId: booking.passenger.userId,
        type: `TRIP_${trip.status}`,
        title: `Trip ${trip.status}`,
        message,
        data: { tripId: trip.id, bookingId: booking.id }
      });
    }
  }

  /**
   * GET TRIP TIMELINE
   */
  async getTripTimeline(tripId) {
    const logs = await prisma.tripLog.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' }
    });

    return logs.map(log => ({
      time: log.timestamp,
      event: log.eventType,
      description: log.description
    }));
  }
}

module.exports = new TripEngine();
