import { supabase } from '../lib/supabase';
import { Trip } from '../types';

export const tripService = {
  // Get today's trips for a driver
  getTodaysTrips: async (driverId: string): Promise<Trip[]> => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        conductor:profiles(*)
      `)
      .eq('driver_id', driverId)
      .gte('departure_time', `${today}T00:00:00`)
      .lte('departure_time', `${today}T23:59:59`)
      .order('departure_time', { ascending: true });

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
        conductor:profiles(*)
      `)
      .eq('driver_id', driverId)
      .order('departure_time', { ascending: false });

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
        driver:drivers(*),
        conductor:profiles(*)
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
        status: 'NOT_STARTED',
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
        status: 'CANCELLED',
        updated_at: new Date().toISOString() 
      })
      .eq('id', tripId);

    if (error) throw error;
    
    // TODO: Log rejection reason in a separate table
  },

  // Get trip statistics
  getTripStats: async (driverId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's trips
    const { data: todayTrips } = await supabase
      .from('trips')
      .select('id, status')
      .eq('driver_id', driverId)
      .gte('departure_time', `${today}T00:00:00`)
      .lte('departure_time', `${today}T23:59:59`);

    // Total completed trips
    const { data: completedTrips } = await supabase
      .from('trips')
      .select('id')
      .eq('driver_id', driverId)
      .eq('status', 'COMPLETED');

    // Get passenger count for today
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, trip_id')
      .in('trip_id', todayTrips?.map(t => t.id) || []);

    return {
      tripsToday: todayTrips?.length || 0,
      tripsCompleted: completedTrips?.length || 0,
      passengersToday: bookings?.length || 0,
    };
  },
};
