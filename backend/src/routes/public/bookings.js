/**
 * Public API - Bookings Endpoints
 * Create and manage bookings for external websites
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { requireFeature } = require('../../middleware/apiKeyAuth');
const crypto = require('crypto');

/**
 * Generate unique booking reference
 */
function generateBookingReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VTS-${timestamp}-${random}`;
}

/**
 * POST /api/v1/bookings
 * Create a new booking
 */
router.post('/', requireFeature('online_booking'), async (req, res) => {
  try {
    const { company } = req;
    const {
      trip_id,
      passengers,
      contact_email,
      contact_phone,
      payment_method,
      seat_numbers,
    } = req.body;

    // Validate required fields
    if (!trip_id || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide trip_id and at least one passenger',
        code: 'MISSING_FIELDS',
      });
    }

    // Verify trip exists and belongs to company
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, fare, available_seats, status, scheduled_departure')
      .eq('id', trip_id)
      .eq('company_id', company.id)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Check trip status
    if (!['scheduled', 'boarding', 'delayed'].includes(trip.status)) {
      return res.status(400).json({
        success: false,
        error: 'Trip not available for booking',
        message: `Trip status is "${trip.status}"`,
        code: 'TRIP_NOT_AVAILABLE',
      });
    }

    // Check minimum booking time
    const minBookingHours = company.settings?.min_booking_hours || 2;
    const departureTime = new Date(trip.scheduled_departure);
    const minBookingTime = new Date(departureTime.getTime() - minBookingHours * 60 * 60 * 1000);
    
    if (new Date() > minBookingTime) {
      return res.status(400).json({
        success: false,
        error: 'Booking window closed',
        message: `Bookings must be made at least ${minBookingHours} hours before departure`,
        code: 'BOOKING_WINDOW_CLOSED',
      });
    }

    // Check seat availability
    if (trip.available_seats < passengers.length) {
      return res.status(400).json({
        success: false,
        error: 'Not enough seats available',
        message: `Only ${trip.available_seats} seats available, but ${passengers.length} requested`,
        code: 'INSUFFICIENT_SEATS',
      });
    }

    // If seat selection is enabled, validate seat numbers
    if (company.features?.seat_selection && seat_numbers) {
      if (seat_numbers.length !== passengers.length) {
        return res.status(400).json({
          success: false,
          error: 'Seat count mismatch',
          message: 'Number of seats must match number of passengers',
          code: 'SEAT_COUNT_MISMATCH',
        });
      }

      // Check if seats are available
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', trip_id)
        .in('booking_status', ['confirmed', 'pending', 'reserved'])
        .in('seat_number', seat_numbers);

      if (existingBookings && existingBookings.length > 0) {
        const takenSeats = existingBookings.map(b => b.seat_number);
        return res.status(400).json({
          success: false,
          error: 'Seats not available',
          message: `Seats ${takenSeats.join(', ')} are already booked`,
          code: 'SEATS_TAKEN',
          taken_seats: takenSeats,
        });
      }
    }

    // Calculate pricing
    const baseFare = trip.fare || 0;
    const taxRate = company.settings?.tax_rate || 0;
    const serviceFee = company.settings?.service_fee || 0;
    
    const subtotal = baseFare * passengers.length;
    const tax = subtotal * (taxRate / 100);
    const totalAmount = subtotal + tax + serviceFee;

    // Create bookings for each passenger
    const bookingReference = generateBookingReference();
    const bookings = [];

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const seatNumber = seat_numbers ? seat_numbers[i] : null;

      const bookingData = {
        company_id: company.id,
        booking_reference: i === 0 ? bookingReference : `${bookingReference}-${i + 1}`,
        trip_id,
        passenger_name: passenger.name,
        passenger_phone: passenger.phone || contact_phone,
        passenger_email: passenger.email || contact_email,
        passenger_id_number: passenger.id_number,
        passenger_gender: passenger.gender,
        seat_number: seatNumber,
        base_fare: baseFare,
        total_amount: baseFare + (tax / passengers.length) + (i === 0 ? serviceFee : 0),
        payment_status: 'pending',
        booking_status: 'pending',
        payment_method: payment_method || 'cash',
        number_of_passengers: i === 0 ? passengers.length : 1,
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;
      bookings.push(booking);
    }

    // Update available seats
    await supabase
      .from('trips')
      .update({ available_seats: trip.available_seats - passengers.length })
      .eq('id', trip_id);

    res.status(201).json({
      success: true,
      data: {
        booking_reference: bookingReference,
        trip_id,
        passengers: passengers.length,
        seats: seat_numbers || [],
        pricing: {
          base_fare: baseFare,
          subtotal,
          tax,
          service_fee: serviceFee,
          total: totalAmount,
          currency: company.settings?.currency || 'USD',
        },
        status: 'pending',
        payment_status: 'pending',
        bookings: bookings.map(b => ({
          id: b.id,
          reference: b.booking_reference,
          passenger_name: b.passenger_name,
          seat_number: b.seat_number,
        })),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      },
      message: 'Booking created successfully. Please complete payment within 30 minutes.',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      code: 'BOOKING_CREATE_ERROR',
    });
  }
});

/**
 * GET /api/v1/bookings/:reference
 * Get booking details by reference
 */
router.get('/:reference', async (req, res) => {
  try {
    const { company } = req;
    const { reference } = req.params;

    // Find booking by reference (handle multi-passenger references)
    const baseReference = reference.split('-').slice(0, 3).join('-');

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        passenger_name,
        passenger_phone,
        passenger_email,
        seat_number,
        total_amount,
        payment_status,
        booking_status,
        created_at,
        trips (
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          status,
          routes (
            origin,
            destination
          ),
          buses (
            name,
            number_plate
          )
        )
      `)
      .eq('company_id', company.id)
      .ilike('booking_reference', `${baseReference}%`);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    const primaryBooking = bookings[0];
    const trip = primaryBooking.trips;

    res.json({
      success: true,
      data: {
        booking_reference: baseReference,
        status: primaryBooking.booking_status,
        payment_status: primaryBooking.payment_status,
        created_at: primaryBooking.created_at,
        trip: trip ? {
          id: trip.id,
          trip_number: trip.trip_number,
          departure: {
            time: trip.scheduled_departure,
            city: trip.routes?.origin,
          },
          arrival: {
            time: trip.scheduled_arrival,
            city: trip.routes?.destination,
          },
          bus: trip.buses ? {
            name: trip.buses.name,
            number_plate: trip.buses.number_plate,
          } : null,
          status: trip.status,
        } : null,
        passengers: bookings.map(b => ({
          name: b.passenger_name,
          phone: b.passenger_phone,
          email: b.passenger_email,
          seat_number: b.seat_number,
          amount: b.total_amount,
        })),
        total_amount: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
        currency: company.settings?.currency || 'USD',
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      code: 'BOOKING_FETCH_ERROR',
    });
  }
});

/**
 * POST /api/v1/bookings/:reference/cancel
 * Cancel a booking
 */
router.post('/:reference/cancel', requireFeature('refunds_enabled'), async (req, res) => {
  try {
    const { company } = req;
    const { reference } = req.params;
    const { reason } = req.body;

    const baseReference = reference.split('-').slice(0, 3).join('-');

    // Find bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, trip_id, booking_status, total_amount, trips(scheduled_departure)')
      .eq('company_id', company.id)
      .ilike('booking_reference', `${baseReference}%`);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    const primaryBooking = bookings[0];

    // Check if already cancelled
    if (primaryBooking.booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking already cancelled',
        code: 'ALREADY_CANCELLED',
      });
    }

    // Calculate refund based on cancellation policy
    const cancellationHours = company.settings?.cancellation_policy_hours || 24;
    const refundPercentage = company.settings?.refund_percentage || 80;
    const departureTime = new Date(primaryBooking.trips?.scheduled_departure);
    const hoursUntilDeparture = (departureTime - new Date()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundEligible = false;

    if (hoursUntilDeparture >= cancellationHours) {
      refundEligible = true;
      const totalAmount = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      refundAmount = totalAmount * (refundPercentage / 100);
    }

    // Update all bookings to cancelled
    const bookingIds = bookings.map(b => b.id);
    await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        refund_amount: refundEligible ? refundAmount / bookings.length : 0,
        refund_status: refundEligible ? 'pending' : 'not_applicable',
      })
      .in('id', bookingIds);

    // Restore available seats
    const tripId = primaryBooking.trip_id;
    const { data: trip } = await supabase
      .from('trips')
      .select('available_seats')
      .eq('id', tripId)
      .single();

    if (trip) {
      await supabase
        .from('trips')
        .update({ available_seats: trip.available_seats + bookings.length })
        .eq('id', tripId);
    }

    res.json({
      success: true,
      data: {
        booking_reference: baseReference,
        status: 'cancelled',
        refund: {
          eligible: refundEligible,
          amount: refundAmount,
          percentage: refundEligible ? refundPercentage : 0,
          status: refundEligible ? 'pending' : 'not_applicable',
          reason: refundEligible 
            ? `Cancelled ${hoursUntilDeparture.toFixed(0)} hours before departure`
            : `Cancellation within ${cancellationHours} hours of departure - no refund`,
        },
        currency: company.settings?.currency || 'USD',
      },
      message: refundEligible 
        ? `Booking cancelled. Refund of ${refundAmount.toFixed(2)} will be processed.`
        : 'Booking cancelled. No refund applicable due to late cancellation.',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      code: 'BOOKING_CANCEL_ERROR',
    });
  }
});

module.exports = router;
