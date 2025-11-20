const { supabase, pool } = require('../config/supabase');

class BookingEngine {
  /**
   * SEAT HOLD - Reserve seat for 15 minutes
   */
  async holdSeat(tripId, seatNumber, sessionId) {
    // Check if seat is already held or booked
    const existingHold = await prisma.seatHold.findFirst({
      where: {
        tripId,
        seatNumber,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingHold) {
      throw new Error('Seat is already held by another user');
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        tripId,
        seatNumber,
        bookingStatus: { not: 'CANCELLED' }
      }
    });

    if (existingBooking) {
      throw new Error('Seat is already booked');
    }

    // Create seat hold (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    return await prisma.seatHold.create({
      data: {
        tripId,
        seatNumber,
        heldBySession: sessionId,
        expiresAt
      }
    });
  }

  /**
   * RELEASE SEAT HOLD
   */
  async releaseSeatHold(tripId, seatNumber, sessionId) {
    return await prisma.seatHold.deleteMany({
      where: {
        tripId,
        seatNumber,
        heldBySession: sessionId
      }
    });
  }

  /**
   * CLEAN EXPIRED HOLDS - Run periodically
   */
  async cleanExpiredHolds() {
    const deleted = await prisma.seatHold.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    console.log(`Cleaned ${deleted.count} expired seat holds`);
    return deleted;
  }

  /**
   * OVERBOOKING PROTECTION
   */
  async checkOverbooking(tripId, seatNumber) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        bookings: {
          where: {
            bookingStatus: { not: 'CANCELLED' }
          }
        }
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check bus capacity
    const activeBookings = trip.bookings.length;
    if (activeBookings >= trip.bus.capacity) {
      throw new Error('Bus is fully booked');
    }

    // Check specific seat
    const seatTaken = trip.bookings.some(b => b.seatNumber === seatNumber);
    if (seatTaken) {
      throw new Error('Seat is already booked');
    }

    // Check seat holds
    const seatHeld = await prisma.seatHold.findFirst({
      where: {
        tripId,
        seatNumber,
        expiresAt: { gt: new Date() }
      }
    });

    if (seatHeld) {
      throw new Error('Seat is temporarily held');
    }

    return true;
  }

  /**
   * CREATE BOOKING WITH VALIDATION
   */
  async createBooking(bookingData, sessionId) {
    const { tripId, seatNumber, passengerId, totalAmount, paymentMethod } = bookingData;

    // 1. Check overbooking
    await this.checkOverbooking(tripId, seatNumber);

    // 2. Validate trip is bookable
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new Error('Trip is not available for booking');
    }

    // Check if trip is in the past
    if (new Date(trip.departureTime) < new Date()) {
      throw new Error('Cannot book past trips');
    }

    // 3. Validate passenger
    const passenger = await prisma.passenger.findUnique({
      where: { id: passengerId }
    });

    if (!passenger) {
      throw new Error('Passenger not found');
    }

    // 4. Create booking
    const booking = await prisma.booking.create({
      data: {
        tripId,
        passengerId,
        seatNumber,
        totalAmount,
        amountPaid: 0,
        paymentStatus: 'PENDING',
        paymentMethod,
        bookingStatus: 'CONFIRMED',
        bookingDate: new Date()
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

    // 5. Release seat hold
    await this.releaseSeatHold(tripId, seatNumber, sessionId);

    return booking;
  }

  /**
   * PROCESS PAYMENT
   */
  async processPayment(bookingId, amount, paymentDetails) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus === 'PAID') {
      throw new Error('Booking is already paid');
    }

    // Update booking payment
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        amountPaid: booking.amountPaid + amount,
        paymentStatus: (booking.amountPaid + amount) >= booking.totalAmount ? 'PAID' : 'PARTIAL',
        paymentDetails: paymentDetails
      }
    });

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        bookingId,
        amount,
        paymentMethod: booking.paymentMethod,
        status: 'COMPLETED',
        transactionDate: new Date(),
        reference: paymentDetails.reference || `PAY-${Date.now()}`
      }
    });

    return updated;
  }

  /**
   * REFUND BOOKING
   */
  async refundBooking(bookingId, refundAmount, reason) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus !== 'PAID') {
      throw new Error('Cannot refund unpaid booking');
    }

    // Check refund policy (e.g., 24 hours before departure)
    const hoursUntilDeparture = (new Date(booking.trip.departureTime) - new Date()) / (1000 * 60 * 60);
    
    let refundPercentage = 100;
    if (hoursUntilDeparture < 24) {
      refundPercentage = 50; // 50% refund if less than 24 hours
    }
    if (hoursUntilDeparture < 2) {
      throw new Error('No refunds within 2 hours of departure');
    }

    const maxRefund = (booking.totalAmount * refundPercentage) / 100;
    const actualRefund = Math.min(refundAmount, maxRefund);

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      }
    });

    // Create refund transaction
    await prisma.paymentTransaction.create({
      data: {
        bookingId,
        amount: -actualRefund,
        paymentMethod: booking.paymentMethod,
        status: 'REFUNDED',
        transactionDate: new Date(),
        reference: `REFUND-${Date.now()}`,
        notes: reason
      }
    });

    return {
      booking: updated,
      refundAmount: actualRefund,
      refundPercentage
    };
  }

  /**
   * VALIDATE TICKET
   */
  async validateTicket(ticketNumber, tripId) {
    const booking = await prisma.booking.findFirst({
      where: {
        ticketNumber,
        tripId
      },
      include: {
        passenger: true,
        trip: true
      }
    });

    if (!booking) {
      return {
        valid: false,
        reason: 'Ticket not found'
      };
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return {
        valid: false,
        reason: 'Ticket has been cancelled'
      };
    }

    if (booking.paymentStatus !== 'PAID') {
      return {
        valid: false,
        reason: 'Payment not completed'
      };
    }

    if (booking.checkedIn) {
      return {
        valid: false,
        reason: 'Ticket already checked in'
      };
    }

    return {
      valid: true,
      booking
    };
  }

  /**
   * CHECK-IN PASSENGER
   */
  async checkInPassenger(bookingId) {
    const validation = await this.validateTicket(booking.ticketNumber, booking.tripId);
    
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedIn: true,
        checkInTime: new Date()
      }
    });
  }

  /**
   * GET AVAILABLE SEATS
   */
  async getAvailableSeats(tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        bookings: {
          where: {
            bookingStatus: { not: 'CANCELLED' }
          },
          select: { seatNumber: true }
        }
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Get held seats
    const heldSeats = await prisma.seatHold.findMany({
      where: {
        tripId,
        expiresAt: { gt: new Date() }
      },
      select: { seatNumber: true }
    });

    // Generate all seats (A1-D13 for 52 seats)
    const allSeats = [];
    const rows = Math.ceil(trip.bus.capacity / 4);
    for (let row = 1; row <= rows; row++) {
      ['A', 'B', 'C', 'D'].forEach(col => {
        allSeats.push(`${col}${row}`);
      });
    }

    const bookedSeats = trip.bookings.map(b => b.seatNumber);
    const heldSeatNumbers = heldSeats.map(h => h.seatNumber);

    return {
      total: trip.bus.capacity,
      available: allSeats.filter(s => 
        !bookedSeats.includes(s) && !heldSeatNumbers.includes(s)
      ),
      booked: bookedSeats,
      held: heldSeatNumbers
    };
  }
}

module.exports = new BookingEngine();
