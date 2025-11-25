import { supabase } from '../lib/supabase';
import { Booking } from '../types';

/**
 * Generate booking reference
 */
const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KJ-${timestamp}-${random}`;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: {
  trip_id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  seat_number: number;
  payment_method: 'office' | 'card' | 'mobile';
  user_id?: string;
}): Promise<Booking> => {
  try {
    const bookingReference = generateBookingReference();

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        trip_id: bookingData.trip_id,
        passenger_name: bookingData.passenger_name,
        passenger_email: bookingData.passenger_email,
        passenger_phone: bookingData.passenger_phone,
        seat_number: bookingData.seat_number,
        payment_method: bookingData.payment_method,
        payment_status: bookingData.payment_method === 'office' ? 'pending' : 'completed',
        status: bookingData.payment_method === 'office' ? 'pending' : 'confirmed',
        qr_code: bookingReference,
        user_id: bookingData.user_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update trip available seats
    const { error: updateError } = await supabase.rpc('decrement_available_seats', {
      trip_id: bookingData.trip_id,
    });

    if (updateError) {
      console.warn('Failed to update available seats:', updateError);
    }

    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Fetch user bookings
 */
export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        trip:trips (
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          fare,
          status,
          routes (origin, destination),
          buses (name, bus_type)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((booking: any) => ({
      ...booking,
      trip: booking.trip
        ? {
            id: booking.trip.id,
            trip_number: booking.trip.trip_number,
            scheduled_departure: booking.trip.scheduled_departure,
            scheduled_arrival: booking.trip.scheduled_arrival,
            fare: booking.trip.fare,
            status: booking.trip.status,
            total_seats: 0,
            available_seats: 0,
            route: {
              origin: booking.trip.routes?.origin || '',
              destination: booking.trip.routes?.destination || '',
            },
            bus: {
              name: booking.trip.buses?.name || 'TBA',
              bus_type: booking.trip.buses?.bus_type || 'Standard',
            },
          }
        : undefined,
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

/**
 * Fetch booking by reference
 */
export const fetchBookingByReference = async (
  reference: string
): Promise<Booking | null> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        trip:trips (
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          fare,
          status,
          routes (origin, destination),
          buses (name, bus_type)
        )
      `
      )
      .eq('booking_reference', reference)
      .single();

    if (error) throw error;

    return {
      ...data,
      trip: data.trip
        ? {
            id: data.trip.id,
            trip_number: data.trip.trip_number,
            scheduled_departure: data.trip.scheduled_departure,
            scheduled_arrival: data.trip.scheduled_arrival,
            fare: data.trip.fare,
            status: data.trip.status,
            total_seats: 0,
            available_seats: 0,
            route: {
              origin: data.trip.routes?.origin || '',
              destination: data.trip.routes?.destination || '',
            },
            bus: {
              name: data.trip.buses?.name || 'TBA',
              bus_type: data.trip.buses?.bus_type || 'Standard',
            },
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

/**
 * Get booked seats for a trip
 */
export const getBookedSeats = async (tripId: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('trip_id', tripId)
      .in('status', ['confirmed', 'pending']);

    if (error) throw error;

    return data.map((b) => b.seat_number);
  } catch (error) {
    console.error('Error fetching booked seats:', error);
    return [];
  }
};
