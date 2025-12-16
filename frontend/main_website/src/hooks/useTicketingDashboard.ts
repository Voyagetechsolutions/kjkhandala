import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTicketingDashboardStats() {
  return useQuery({
    queryKey: ['ticketing-dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch today's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_amount, payment_status, trip_id')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .neq('booking_status', 'cancelled');

      if (bookingsError) throw bookingsError;

      // Fetch today's trips
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, total_seats, available_seats')
        .gte('scheduled_departure', todayStart)
        .lte('scheduled_departure', todayEnd)
        .neq('status', 'CANCELLED');

      if (tripsError) throw tripsError;

      // Calculate stats
      const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
      const tickets_sold_today = paidBookings.length;
      const revenue_today = paidBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const trips_available_today = trips?.length || 0;

      // Calculate average occupancy
      let totalOccupancy = 0;
      trips?.forEach(trip => {
        const totalSeats = trip.total_seats || 60;
        const bookedSeats = totalSeats - (trip.available_seats || 0);
        const occupancy = (bookedSeats / totalSeats) * 100;
        totalOccupancy += occupancy;
      });
      const avg_occupancy_rate = trips_available_today > 0 ? totalOccupancy / trips_available_today : 0;

      return {
        tickets_sold_today,
        revenue_today,
        trips_available_today,
        avg_occupancy_rate,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTripOccupancy() {
  return useQuery({
    queryKey: ['trip-occupancy'],
    queryFn: async () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch today's trips with related data
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(id, origin, destination),
          bus:buses(id, name, number_plate, seating_capacity),
          driver:drivers(id, full_name, phone)
        `)
        .gte('scheduled_departure', todayStart)
        .lte('scheduled_departure', todayEnd)
        .order('scheduled_departure');

      if (tripsError) throw tripsError;

      // Fetch bookings for these trips
      const tripIds = trips?.map(t => t.id) || [];
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('trip_id, seat_number')
        .in('trip_id', tripIds)
        .neq('booking_status', 'cancelled');

      if (bookingsError) throw bookingsError;

      // Calculate occupancy and zones for each trip
      const tripsWithOccupancy = trips?.map(trip => {
        const tripBookings = bookings?.filter(b => b.trip_id === trip.id) || [];
        const bookedSeats = tripBookings.length;
        const bus = Array.isArray(trip.bus) ? trip.bus[0] : trip.bus;
        const totalSeats = bus?.seating_capacity || trip.total_seats || 60;
        const availableSeats = totalSeats - bookedSeats;
        const occupancyRate = (bookedSeats / totalSeats) * 100;

        // Determine zone based on passenger count
        let zone = 'red';
        let zoneLabel = '🟥 RED - TOO EMPTY';
        let canDepart = false;

        if (bookedSeats >= 36) {
          zone = 'green';
          zoneLabel = '🟩 GREEN - READY TO GO';
          canDepart = true;
        } else if (bookedSeats >= 21) {
          zone = 'yellow';
          zoneLabel = '🟨 YELLOW - CAN DEPART AT TIME';
          canDepart = true;
        }

        return {
          ...trip,
          bus,
          route: Array.isArray(trip.route) ? trip.route[0] : trip.route,
          driver: Array.isArray(trip.driver) ? trip.driver[0] : trip.driver,
          booked_seats: bookedSeats,
          available_seats: availableSeats,
          total_seats: totalSeats,
          occupancy_rate: occupancyRate,
          zone,
          zone_label: zoneLabel,
          can_depart: canDepart,
        };
      }) || [];

      return tripsWithOccupancy;
    },
    refetchInterval: 30000,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: ['payment-summary-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_summary_today')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function usePassengerManifest(tripId?: string) {
  return useQuery({
    queryKey: ['passenger-manifest', tripId],
    queryFn: async () => {
      let query = supabase
        .from('passenger_manifest')
        .select('*');
      
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useTicketAlerts() {
  return useQuery({
    queryKey: ['ticket-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // Check for alerts every 15 seconds
  });
}

export function useTerminals() {
  return useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('terminals')
        .select('*')
        .eq('is_active', true)
        .order('terminal_name');
      
      if (error) throw error;
      return data;
    },
  });
}
