import express from 'express';
import { supabase, callRPC } from '../lib/supabase';

const router = express.Router();

/**
 * GET /api/shifts/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get calendar view of shifts for date range
 */
router.get('/calendar', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const { data, error } = await supabase.rpc('get_shift_calendar', {
      p_start_date: start,
      p_end_date: end,
    });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shifts/driver/:driverId?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get shifts for a specific driver
 */
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    const { data, error } = await supabase.rpc('get_driver_shifts_for_period', {
      p_start_date: start,
      p_end_date: end,
      p_driver_id: driverId,
    });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching driver shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shifts
 * Create a new shift assignment
 */
router.post('/', async (req, res) => {
  try {
    const { driver_id, route_id, bus_id, shift_date, shift_type, end_date, days_of_week } = req.body;

    if (!driver_id || !route_id || !shift_date) {
      return res.status(400).json({
        error: 'driver_id, route_id, and shift_date are required',
      });
    }

    // Check for conflicts - driver already assigned on this date
    const { data: existingShifts } = await supabase
      .from('driver_shifts')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('shift_date', shift_date)
      .eq('status', 'active');

    if (existingShifts && existingShifts.length > 0) {
      return res.status(409).json({
        error: 'Driver already has a shift on this date',
      });
    }

    const { data: shift, error } = await supabase
      .from('driver_shifts')
      .insert({
        driver_id,
        route_id,
        bus_id: bus_id || null,
        shift_date,
        shift_type: shift_type || 'single',
        end_date: end_date || null,
        days_of_week: days_of_week || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(shift);
  } catch (error: any) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/shifts/:id
 * Update a shift
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, route_id, bus_id, status, notes } = req.body;

    const updateData: any = {};
    if (driver_id) updateData.driver_id = driver_id;
    if (route_id) updateData.route_id = route_id;
    if (bus_id !== undefined) updateData.bus_id = bus_id;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: shift, error } = await supabase
      .from('driver_shifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(shift);
  } catch (error: any) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/shifts/:id
 * Delete a shift
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('driver_shifts').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shifts/auto-generate
 * Auto-generate shifts for a date range
 */
router.post('/auto-generate', async (req, res) => {
  try {
    const { start_date, end_date, route_ids } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required',
      });
    }

    const { data, error } = await supabase.rpc('auto_assign_driver_shifts', {
      p_start_date: start_date,
      p_end_date: end_date,
      p_route_ids: route_ids || null,
    });

    if (error) throw error;

    res.json(data[0]);
  } catch (error: any) {
    console.error('Error auto-generating shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shifts/stats?date=YYYY-MM-DD
 * Get shift statistics for a date
 */
router.get('/stats', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }

    const { data: shifts, error } = await supabase
      .from('driver_shifts')
      .select('*')
      .eq('shift_date', date)
      .eq('status', 'active');

    if (error) throw error;

    const stats = {
      total_shifts: shifts?.length || 0,
      drivers_assigned: new Set(shifts?.map((s: any) => s.driver_id)).size,
      routes_covered: new Set(shifts?.map((s: any) => s.route_id)).size,
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
