import { supabase } from '../lib/supabase';

export interface Trip {
  id: string;
  route_id: string;
  bus_id: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  available_seats: number;
  price: number;
  routes: {
    id: string;
    origin: string;
    destination: string;
    distance_km: number;
    duration_hours: number;
  };
  buses: {
    id: string;
    registration_number: string;
    model: string;
    capacity: number;
  };
}

export interface Booking {
  id: string;
  trip_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  seat_number: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  booking_reference: string;
  created_at: string;
  trips?: Trip;
}

export const tripService = {
  // Search trips by route and date
  searchTrips: async (origin: string, destination: string, date: string): Promise<Trip[]> => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          routes:route_id (
            id,
            origin,
            destination,
            distance_km,
            duration_hours
          ),
          buses:bus_id (
            id,
            registration_number,
            model,
            capacity
          )
        `)
        .gte('scheduled_departure', startOfDay.toISOString())
        .lte('scheduled_departure', endOfDay.toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_departure', { ascending: true });

      if (error) {
        console.error('Error searching trips:', error);
        throw error;
      }

      // Filter by origin and destination and convert numeric fields
      const filteredTrips = (data || [])
        .filter((trip: any) => 
          trip.routes?.origin === origin && trip.routes?.destination === destination
        )
        .map((trip: any) => ({
          ...trip,
          price: Number(trip.price) || 0,
          available_seats: Number(trip.available_seats) || 0,
          routes: trip.routes ? {
            ...trip.routes,
            distance_km: Number(trip.routes.distance_km) || 0,
            duration_hours: Number(trip.routes.duration_hours) || 0,
          } : undefined,
          buses: trip.buses ? {
            ...trip.buses,
            capacity: Number(trip.buses.capacity) || 0,
          } : undefined,
        }));

      return filteredTrips;
    } catch (error) {
      console.error('Error in searchTrips:', error);
      return [];
    }
  },

  // Get trip details
  getTripDetails: async (tripId: string): Promise<Trip | null> => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          routes:route_id (
            id,
            origin,
            destination,
            distance_km,
            duration_hours
          ),
          buses:bus_id (
            id,
            registration_number,
            model,
            capacity
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) throw error;
      
      // Convert all numeric fields from strings to numbers
      if (data) {
        return {
          ...data,
          price: Number(data.price) || 0,
          available_seats: Number(data.available_seats) || 0,
          routes: data.routes ? {
            ...data.routes,
            distance_km: Number(data.routes.distance_km) || 0,
            duration_hours: Number(data.routes.duration_hours) || 0,
          } : undefined,
          buses: data.buses ? {
            ...data.buses,
            capacity: Number(data.buses.capacity) || 0,
          } : undefined,
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error getting trip details:', error);
      return null;
    }
  },

  // Create booking
  createBooking: async (
    tripId: string,
    passengerName: string,
    passengerPhone: string,
    passengerEmail: string,
    seatNumber: string,
    totalAmount: number
  ): Promise<Booking | null> => {
    try {
      const bookingReference = `KJK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          trip_id: tripId,
          passenger_name: passengerName,
          passenger_phone: passengerPhone,
          passenger_email: passengerEmail,
          seat_number: seatNumber,
          booking_status: 'confirmed',
          payment_status: 'pending',
          total_amount: totalAmount,
          booking_reference: bookingReference,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  },

  // Get user bookings
  getMyBookings: async (userId?: string): Promise<Booking[]> => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          trips:trip_id (
            *,
            routes:route_id (
              origin,
              destination
            ),
            buses:bus_id (
              registration_number
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Convert numeric fields from strings to numbers
      return (data || []).map((booking: any) => ({
        ...booking,
        total_amount: Number(booking.total_amount) || 0,
        trips: booking.trips ? {
          ...booking.trips,
          price: Number(booking.trips.price) || 0,
          available_seats: Number(booking.trips.available_seats) || 0,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error getting bookings:', error);
      return [];
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId: string): Promise<Booking | null> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips:trip_id (
            *,
            routes:route_id (
              origin,
              destination,
              distance_km,
              duration_hours
            ),
            buses:bus_id (
              registration_number,
              model
            )
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      // Convert numeric fields from strings to numbers
      if (data) {
        return {
          ...data,
          total_amount: Number(data.total_amount) || 0,
          trips: data.trips ? {
            ...data.trips,
            price: Number(data.trips.price) || 0,
            available_seats: Number(data.trips.available_seats) || 0,
            routes: data.trips.routes ? {
              ...data.trips.routes,
              distance_km: Number(data.trips.routes.distance_km) || 0,
              duration_hours: Number(data.trips.routes.duration_hours) || 0,
            } : undefined,
          } : undefined,
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error getting booking details:', error);
      return null;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  },

  // Get available routes
  getRoutes: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('origin', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting routes:', error);
      return [];
    }
  },

  // Get unique cities
  getCities: async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('origin, destination')
        .eq('is_active', true);

      if (error) throw error;

      const cities = new Set<string>();
      data?.forEach((route: any) => {
        cities.add(route.origin);
        cities.add(route.destination);
      });

      return Array.from(cities).sort();
    } catch (error) {
      console.error('Error getting cities:', error);
      return [];
    }
  },

  // Get occupied seats for a trip
  getOccupiedSeats: async (tripId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('trip_id', tripId)
        .in('booking_status', ['confirmed', 'completed']);

      if (error) throw error;
      return (data || []).map((booking: any) => booking.seat_number);
    } catch (error) {
      console.error('Error getting occupied seats:', error);
      return [];
    }
  },
};
