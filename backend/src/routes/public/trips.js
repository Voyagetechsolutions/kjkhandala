/**
 * Public API - Trips Endpoints
 * Search and view trip details for external websites
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');

/**
 * GET /api/v1/trips/search
 * Search for available trips
 * Query params: origin, destination, date, passengers (optional)
 */
router.get('/search', async (req, res) => {
  try {
    const { company } = req;
    const { origin, destination, date, passengers = 1 } = req.query;

    // Validate required params
    if (!origin || !destination || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Please provide origin, destination, and date',
        code: 'MISSING_PARAMS',
      });
    }

    // Parse date and create range for the day
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Please provide date in YYYY-MM-DD format',
        code: 'INVALID_DATE',
      });
    }

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find matching routes
    const { data: routes, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .ilike('origin', `%${origin}%`)
      .ilike('destination', `%${destination}%`);

    if (routeError) throw routeError;

    if (!routes || routes.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No routes found for this origin and destination',
      });
    }

    const routeIds = routes.map(r => r.id);

    // Find trips for these routes on the specified date
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_number,
        scheduled_departure,
        scheduled_arrival,
        status,
        total_seats,
        available_seats,
        fare,
        routes!inner (
          id,
          origin,
          destination,
          distance_km,
          duration_hours
        ),
        buses (
          id,
          name,
          number_plate,
          bus_type,
          seating_capacity
        )
      `)
      .eq('company_id', company.id)
      .in('route_id', routeIds)
      .gte('scheduled_departure', startOfDay.toISOString())
      .lte('scheduled_departure', endOfDay.toISOString())
      .in('status', ['scheduled', 'boarding', 'delayed'])
      .gte('available_seats', parseInt(passengers))
      .order('scheduled_departure', { ascending: true });

    if (tripError) throw tripError;

    // Format response
    const formattedTrips = (trips || []).map(trip => ({
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
      route: {
        id: trip.routes?.id,
        distance_km: trip.routes?.distance_km,
        duration_hours: trip.routes?.duration_hours,
      },
      bus: trip.buses ? {
        name: trip.buses.name,
        type: trip.buses.bus_type,
        capacity: trip.buses.seating_capacity,
      } : null,
      seats: {
        total: trip.total_seats,
        available: trip.available_seats,
      },
      fare: trip.fare,
      status: trip.status,
    }));

    res.json({
      success: true,
      data: formattedTrips,
      count: formattedTrips.length,
      search: {
        origin,
        destination,
        date,
        passengers: parseInt(passengers),
      },
    });
  } catch (error) {
    console.error('Error searching trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search trips',
      code: 'TRIPS_SEARCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/trips/:id
 * Get detailed trip information including seat availability
 */
router.get('/:id', async (req, res) => {
  try {
    const { company } = req;
    const { id } = req.params;

    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        id,
        trip_number,
        scheduled_departure,
        scheduled_arrival,
        status,
        total_seats,
        available_seats,
        fare,
        routes (
          id,
          origin,
          destination,
          distance_km,
          duration_hours,
          description
        ),
        buses (
          id,
          name,
          number_plate,
          bus_type,
          seating_capacity,
          model
        ),
        drivers (
          id,
          full_name,
          rating
        )
      `)
      .eq('id', id)
      .eq('company_id', company.id)
      .single();

    if (error || !trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Get booked seats for this trip
    const { data: bookings } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('trip_id', id)
      .in('booking_status', ['confirmed', 'pending']);

    const bookedSeats = bookings?.map(b => b.seat_number).filter(Boolean) || [];

    // Get trip stops if available
    const { data: stops } = await supabase
      .from('trip_stops')
      .select('id, stop_order, city_name, scheduled_arrival, scheduled_departure')
      .eq('trip_id', id)
      .order('stop_order', { ascending: true });

    res.json({
      success: true,
      data: {
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
        route: {
          id: trip.routes?.id,
          origin: trip.routes?.origin,
          destination: trip.routes?.destination,
          distance_km: trip.routes?.distance_km,
          duration_hours: trip.routes?.duration_hours,
          description: trip.routes?.description,
        },
        bus: trip.buses ? {
          name: trip.buses.name,
          number_plate: trip.buses.number_plate,
          type: trip.buses.bus_type,
          model: trip.buses.model,
          capacity: trip.buses.seating_capacity,
        } : null,
        driver: trip.drivers ? {
          name: trip.drivers.full_name,
          rating: trip.drivers.rating,
        } : null,
        seats: {
          total: trip.total_seats,
          available: trip.available_seats,
          booked: bookedSeats,
        },
        fare: trip.fare,
        status: trip.status,
        stops: stops || [],
      },
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trip',
      code: 'TRIP_FETCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/trips/:id/seats
 * Get seat availability map for a trip
 */
router.get('/:id/seats', async (req, res) => {
  try {
    const { company } = req;
    const { id } = req.params;

    // Verify trip belongs to company
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, total_seats, available_seats, buses(seating_capacity, bus_type)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Get booked seats
    const { data: bookings } = await supabase
      .from('bookings')
      .select('seat_number, booking_status')
      .eq('trip_id', id)
      .in('booking_status', ['confirmed', 'pending', 'reserved']);

    const seatStatus = {};
    (bookings || []).forEach(booking => {
      if (booking.seat_number) {
        seatStatus[booking.seat_number] = booking.booking_status;
      }
    });

    // Generate seat map
    const totalSeats = trip.buses?.seating_capacity || trip.total_seats || 40;
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = i.toString();
      seats.push({
        number: seatNumber,
        status: seatStatus[seatNumber] || 'available',
        is_available: !seatStatus[seatNumber],
      });
    }

    res.json({
      success: true,
      data: {
        trip_id: id,
        total_seats: totalSeats,
        available_count: trip.available_seats,
        bus_type: trip.buses?.bus_type || 'standard',
        seats,
      },
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seat availability',
      code: 'SEATS_FETCH_ERROR',
    });
  }
});

module.exports = router;
