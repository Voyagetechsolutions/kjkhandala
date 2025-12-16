/**
 * Public API - Routes Endpoints
 * Returns available bus routes for external websites
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');

/**
 * GET /api/v1/routes
 * Returns all active routes for the company
 */
router.get('/', async (req, res) => {
  try {
    const { company } = req;

    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        id,
        origin,
        destination,
        base_fare,
        distance_km,
        duration_hours,
        route_type,
        description,
        is_active
      `)
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('origin', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: routes.map(route => ({
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        fare: route.base_fare,
        distance_km: route.distance_km,
        duration_hours: route.duration_hours,
        route_type: route.route_type,
        description: route.description,
      })),
      count: routes.length,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes',
      code: 'ROUTES_FETCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/routes/:id
 * Returns details for a specific route including stops
 */
router.get('/:id', async (req, res) => {
  try {
    const { company } = req;
    const { id } = req.params;

    const { data: route, error } = await supabase
      .from('routes')
      .select(`
        id,
        origin,
        destination,
        base_fare,
        distance_km,
        duration_hours,
        route_type,
        description,
        is_active
      `)
      .eq('id', id)
      .eq('company_id', company.id)
      .single();

    if (error || !route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    // Get route stops
    const { data: stops } = await supabase
      .from('route_stops')
      .select('id, stop_order, city_name, arrival_offset_minutes, departure_offset_minutes')
      .eq('route_id', id)
      .order('stop_order', { ascending: true });

    res.json({
      success: true,
      data: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        fare: route.base_fare,
        distance_km: route.distance_km,
        duration_hours: route.duration_hours,
        route_type: route.route_type,
        description: route.description,
        stops: stops || [],
      },
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route',
      code: 'ROUTE_FETCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/routes/cities
 * Returns all unique cities served by this company
 */
router.get('/cities/list', async (req, res) => {
  try {
    const { company } = req;

    const { data: routes, error } = await supabase
      .from('routes')
      .select('origin, destination')
      .eq('company_id', company.id)
      .eq('is_active', true);

    if (error) throw error;

    // Extract unique cities
    const cities = new Set();
    routes.forEach(route => {
      if (route.origin) cities.add(route.origin);
      if (route.destination) cities.add(route.destination);
    });

    res.json({
      success: true,
      data: Array.from(cities).sort(),
      count: cities.size,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities',
      code: 'CITIES_FETCH_ERROR',
    });
  }
});

module.exports = router;
