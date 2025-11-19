import { supabase } from '../lib/supabase';
import { Booking, PassengerCheckin } from '../types';

export const checkinService = {
  // Get all passengers for a trip
  getPassengerManifest: async (tripId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(*)
      `)
      .eq('trip_id', tripId)
      .order('seat_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Check in passenger via QR code
  checkInPassengerQR: async (
    bookingId: string,
    tripId: string,
    driverId: string
  ): Promise<void> => {
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        check_in_status: 'boarded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) throw bookingError;

    // Create check-in record
    const { error: checkinError } = await supabase
      .from('passenger_checkins')
      .insert({
        booking_id: bookingId,
        trip_id: tripId,
        driver_id: driverId,
        check_in_method: 'qr_scan',
        check_in_time: new Date().toISOString(),
      });

    if (checkinError) throw checkinError;
  },

  // Manual check-in
  checkInPassengerManual: async (
    bookingId: string,
    tripId: string,
    driverId: string,
    notes?: string
  ): Promise<void> => {
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        check_in_status: 'boarded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) throw bookingError;

    // Create check-in record
    const { error: checkinError } = await supabase
      .from('passenger_checkins')
      .insert({
        booking_id: bookingId,
        trip_id: tripId,
        driver_id: driverId,
        check_in_method: 'manual',
        check_in_time: new Date().toISOString(),
        notes,
      });

    if (checkinError) throw checkinError;
  },

  // Mark passenger as no-show
  markNoShow: async (bookingId: string): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .update({
        check_in_status: 'no_show',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) throw error;
  },

  // Add notes to passenger
  addPassengerNotes: async (
    bookingId: string,
    notes: string
  ): Promise<void> => {
    // This would update a notes field in bookings table
    // For now, we'll just log it
    console.log('Adding notes to booking:', bookingId, notes);
  },

  // Get check-in statistics
  getCheckinStats: async (tripId: string) => {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in_status')
      .eq('trip_id', tripId);

    const total = bookings?.length || 0;
    const boarded = bookings?.filter((b) => b.check_in_status === 'boarded').length || 0;
    const noShow = bookings?.filter((b) => b.check_in_status === 'no_show').length || 0;
    const pending = total - boarded - noShow;

    return {
      total,
      boarded,
      pending,
      noShow,
    };
  },
};
