import { supabase } from '../lib/supabase';
import { Trip } from '../types';

export const tripService = {
  // Get today's trips for a driver
  getTodaysTrips: async (driverId: string) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        driver:drivers(*)
      `)
      .gte('scheduled_departure', startOfDay)
      .lte('scheduled_departure', endOfDay)
      .order('scheduled_departure', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all trips for a driver
  getDriverTrips: async (
    driverId: string,
    status?: string
  ): Promise<Trip[]> => {
    let query = supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        driver:drivers(*)
      `)
      .eq('driver_id', driverId)
      .order('scheduled_departure', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get single trip details
  getTripDetails: async (tripId: string): Promise<Trip | null> => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        driver:drivers(*)
      `)
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update trip status
  updateTripStatus: async (
    tripId: string,
    status: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('trips')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Accept trip
  acceptTrip: async (tripId: string): Promise<void> => {
    const { error } = await supabase
      .from('trips')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString() 
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Reject trip
  rejectTrip: async (tripId: string, reason: string): Promise<void> => {
    const { error } = await supabase
      .from('trips')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString() 
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Start trip
  startTrip: async (tripId: string): Promise<void> => {
    const { error } = await supabase
      .from('trips')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Complete trip
  completeTrip: async (tripId: string): Promise<void> => {
    const { error } = await supabase
      .from('trips')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) throw error;
  },

  // Get trip statistics
  getTripStats: async (driverId: string) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId)
      .gte('scheduled_departure', startOfDay)
      .lte('scheduled_departure', endOfDay);

    const tripsToday = trips?.length || 0;
    const tripsCompleted = trips?.filter(t => t.status === 'completed').length || 0;
    
    // Get passenger count
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .in('trip_id', trips?.map(t => t.id) || [])
      .eq('booking_status', 'confirmed');

    return {
      tripsToday,
      tripsCompleted,
      passengersToday: bookings?.length || 0,
    };
  },
};
