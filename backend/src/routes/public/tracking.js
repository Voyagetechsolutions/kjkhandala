/**
 * Public API - Live Tracking Endpoints
 * Real-time bus location tracking for external websites
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');

/**
 * GET /api/v1/tracking/trip/:tripId
 * Get current location of a bus for a specific trip
 */
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { company } = req;
    const { tripId } = req.params;

    // Verify trip belongs to company
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_number,
        status,
        bus_id,
        scheduled_departure,
        scheduled_arrival,
        routes (
          origin,
          destination
        ),
        buses (
          id,
          name,
          number_plate,
          gps_device_id
        )
      `)
      .eq('id', tripId)
      .eq('company_id', company.id)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Get latest GPS location
    const { data: location } = await supabase
      .from('gps_tracking')
      .select('latitude, longitude, speed, heading, timestamp')
      .eq('bus_id', trip.bus_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Calculate estimated arrival if trip is in progress
    let estimatedArrival = null;
    if (trip.status === 'in_progress' && location) {
      // Simple estimation based on scheduled times
      // In production, you'd use actual distance/speed calculations
      estimatedArrival = trip.scheduled_arrival;
    }

    res.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          trip_number: trip.trip_number,
          status: trip.status,
          origin: trip.routes?.origin,
          destination: trip.routes?.destination,
          scheduled_departure: trip.scheduled_departure,
          scheduled_arrival: trip.scheduled_arrival,
        },
        bus: trip.buses ? {
          name: trip.buses.name,
          number_plate: trip.buses.number_plate,
        } : null,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          speed_kmh: location.speed,
          heading: location.heading,
          last_updated: location.timestamp,
        } : null,
        estimated_arrival: estimatedArrival,
        tracking_available: !!location,
      },
    });
  } catch (error) {
    console.error('Error fetching trip tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking data',
      code: 'TRACKING_ERROR',
    });
  }
});

/**
 * GET /api/v1/tracking/booking/:reference
 * Get tracking info for a booking
 */
router.get('/booking/:reference', async (req, res) => {
  try {
    const { company } = req;
    const { reference } = req.params;

    const baseReference = reference.split('-').slice(0, 3).join('-');

    // Find booking and associated trip
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        booking_status,
        trips (
          id,
          trip_number,
          status,
          bus_id,
          scheduled_departure,
          scheduled_arrival,
          routes (
            origin,
            destination
          ),
          buses (
            id,
            name,
            number_plate
          )
        )
      `)
      .eq('company_id', company.id)
      .ilike('booking_reference', `${baseReference}%`)
      .limit(1)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    const trip = booking.trips;
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found for this booking',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Get latest GPS location
    const { data: location } = await supabase
      .from('gps_tracking')
      .select('latitude, longitude, speed, heading, timestamp')
      .eq('bus_id', trip.bus_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      data: {
        booking: {
          reference: baseReference,
          status: booking.booking_status,
        },
        trip: {
          id: trip.id,
          trip_number: trip.trip_number,
          status: trip.status,
          origin: trip.routes?.origin,
          destination: trip.routes?.destination,
          scheduled_departure: trip.scheduled_departure,
          scheduled_arrival: trip.scheduled_arrival,
        },
        bus: trip.buses ? {
          name: trip.buses.name,
          number_plate: trip.buses.number_plate,
        } : null,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          speed_kmh: location.speed,
          heading: location.heading,
          last_updated: location.timestamp,
        } : null,
        tracking_available: !!location,
      },
    });
  } catch (error) {
    console.error('Error fetching booking tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking data',
      code: 'TRACKING_ERROR',
    });
  }
});

/**
 * GET /api/v1/tracking/route/:routeId/buses
 * Get all active buses on a route
 */
router.get('/route/:routeId/buses', async (req, res) => {
  try {
    const { company } = req;
    const { routeId } = req.params;

    // Verify route belongs to company
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id, origin, destination')
      .eq('id', routeId)
      .eq('company_id', company.id)
      .single();

    if (routeError || !route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    // Get active trips on this route
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        id,
        trip_number,
        status,
        bus_id,
        scheduled_departure,
        scheduled_arrival,
        buses (
          id,
          name,
          number_plate
        )
      `)
      .eq('route_id', routeId)
      .eq('company_id', company.id)
      .in('status', ['in_progress', 'boarding', 'delayed']);

    if (!trips || trips.length === 0) {
      return res.json({
        success: true,
        data: {
          route: {
            id: route.id,
            origin: route.origin,
            destination: route.destination,
          },
          buses: [],
        },
      });
    }

    // Get locations for all buses
    const busIds = trips.map(t => t.bus_id).filter(Boolean);
    const { data: locations } = await supabase
      .from('gps_tracking')
      .select('bus_id, latitude, longitude, speed, heading, timestamp')
      .in('bus_id', busIds)
      .order('timestamp', { ascending: false });

    // Get latest location per bus
    const latestLocations = {};
    (locations || []).forEach(loc => {
      if (!latestLocations[loc.bus_id]) {
        latestLocations[loc.bus_id] = loc;
      }
    });

    const buses = trips.map(trip => ({
      trip_id: trip.id,
      trip_number: trip.trip_number,
      status: trip.status,
      bus: trip.buses ? {
        name: trip.buses.name,
        number_plate: trip.buses.number_plate,
      } : null,
      scheduled_departure: trip.scheduled_departure,
      scheduled_arrival: trip.scheduled_arrival,
      location: latestLocations[trip.bus_id] ? {
        latitude: latestLocations[trip.bus_id].latitude,
        longitude: latestLocations[trip.bus_id].longitude,
        speed_kmh: latestLocations[trip.bus_id].speed,
        heading: latestLocations[trip.bus_id].heading,
        last_updated: latestLocations[trip.bus_id].timestamp,
      } : null,
    }));

    res.json({
      success: true,
      data: {
        route: {
          id: route.id,
          origin: route.origin,
          destination: route.destination,
        },
        buses,
        count: buses.length,
      },
    });
  } catch (error) {
    console.error('Error fetching route buses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking data',
      code: 'TRACKING_ERROR',
    });
  }
});

module.exports = router;
