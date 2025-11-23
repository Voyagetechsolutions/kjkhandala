import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * GET /api/shifts?date=YYYY-MM-DD
 * Get all shifts for a specific date
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }

    const { data: shifts, error } = await supabase
      .from('driver_shifts')
      .select(`
        id,
        shift_date,
        trip_id,
        driver_id,
        bus_id,
        conductor_id,
        status,
        trip:trips (
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          route:routes (
            origin,
            destination
          )
        ),
        driver:drivers (
          id,
          full_name
        ),
        bus:buses (
          id,
          registration_number
        ),
        conductor:conductors (
          id,
          full_name
        )
      `)
      .eq('shift_date', date)
      .order('trip.scheduled_departure', { ascending: true });

    if (error) throw error;

    // Transform data for frontend
    const transformedShifts = (shifts || []).map((shift: any) => ({
      id: shift.id,
      shift_date: shift.shift_date,
      trip_id: shift.trip_id,
      trip_number: shift.trip?.trip_number || 'N/A',
      route: shift.trip?.route
        ? `${shift.trip.route.origin} → ${shift.trip.route.destination}`
        : 'N/A',
      departure_time: shift.trip?.scheduled_departure,
      arrival_time: shift.trip?.scheduled_arrival,
      driver_id: shift.driver_id,
      driver_name: shift.driver?.full_name || 'Unassigned',
      bus_id: shift.bus_id,
      bus_registration: shift.bus?.registration_number || 'Unassigned',
      conductor_id: shift.conductor_id,
      conductor_name: shift.conductor?.full_name,
      status: determineShiftStatus(
        shift.trip?.scheduled_departure,
        shift.trip?.scheduled_arrival
      ),
    }));

    res.json(transformedShifts);
  } catch (error: any) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shifts/:id
 * Get a specific shift by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: shift, error } = await supabase
      .from('driver_shifts')
      .select(`
        *,
        trip:trips (*),
        driver:drivers (*),
        bus:buses (*),
        conductor:conductors (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error: any) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shifts
 * Create a new shift manually
 */
router.post('/', async (req, res) => {
  try {
    const { shift_date, trip_id, driver_id, bus_id, conductor_id } = req.body;

    if (!shift_date || !trip_id || !driver_id || !bus_id) {
      return res.status(400).json({
        error: 'shift_date, trip_id, driver_id, and bus_id are required',
      });
    }

    // Check for conflicts
    const { data: existingShifts } = await supabase
      .from('driver_shifts')
      .select('*, trip:trips(scheduled_departure, scheduled_arrival)')
      .eq('shift_date', shift_date)
      .or(`driver_id.eq.${driver_id},bus_id.eq.${bus_id}`);

    if (existingShifts && existingShifts.length > 0) {
      // Get the new trip times
      const { data: newTrip } = await supabase
        .from('trips')
        .select('scheduled_departure, scheduled_arrival')
        .eq('id', trip_id)
        .single();

      if (newTrip) {
        const hasConflict = existingShifts.some((existing: any) => {
          const newStart = new Date(newTrip.scheduled_departure).getTime();
          const newEnd = new Date(newTrip.scheduled_arrival).getTime();
          const existingStart = new Date(existing.trip.scheduled_departure).getTime();
          const existingEnd = new Date(existing.trip.scheduled_arrival).getTime();

          return newStart < existingEnd && existingStart < newEnd;
        });

        if (hasConflict) {
          return res.status(409).json({
            error: 'Driver or bus has a conflicting shift at this time',
          });
        }
      }
    }

    const { data: shift, error } = await supabase
      .from('driver_shifts')
      .insert({
        shift_date,
        trip_id,
        driver_id,
        bus_id,
        conductor_id,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    // Update trip with assignments
    await supabase
      .from('trips')
      .update({ driver_id, bus_id, conductor_id })
      .eq('id', trip_id);

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
    const { status, driver_id, bus_id, conductor_id } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (driver_id) updateData.driver_id = driver_id;
    if (bus_id) updateData.bus_id = bus_id;
    if (conductor_id !== undefined) updateData.conductor_id = conductor_id;

    const { data: shift, error } = await supabase
      .from('driver_shifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update trip if driver/bus/conductor changed
    if (driver_id || bus_id || conductor_id !== undefined) {
      const tripUpdateData: any = {};
      if (driver_id) tripUpdateData.driver_id = driver_id;
      if (bus_id) tripUpdateData.bus_id = bus_id;
      if (conductor_id !== undefined) tripUpdateData.conductor_id = conductor_id;

      await supabase
        .from('trips')
        .update(tripUpdateData)
        .eq('id', shift.trip_id);
    }

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

    // Get shift details first
    const { data: shift } = await supabase
      .from('driver_shifts')
      .select('trip_id')
      .eq('id', id)
      .single();

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Delete shift
    const { error } = await supabase.from('driver_shifts').delete().eq('id', id);

    if (error) throw error;

    // Clear trip assignments
    await supabase
      .from('trips')
      .update({
        driver_id: null,
        bus_id: null,
        conductor_id: null,
      })
      .eq('id', shift.trip_id);

    res.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shifts/driver/:driverId
 * Get all shifts for a specific driver
 */
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('driver_shifts')
      .select(`
        *,
        trip:trips (*),
        bus:buses (*),
        conductor:conductors (*)
      `)
      .eq('driver_id', driverId)
      .order('shift_date', { ascending: false });

    if (startDate) {
      query = query.gte('shift_date', startDate);
    }
    if (endDate) {
      query = query.lte('shift_date', endDate);
    }

    const { data: shifts, error } = await query;

    if (error) throw error;

    res.json(shifts || []);
  } catch (error: any) {
    console.error('Error fetching driver shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shifts/bus/:busId
 * Get all shifts for a specific bus
 */
router.get('/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('driver_shifts')
      .select(`
        *,
        trip:trips (*),
        driver:drivers (*),
        conductor:conductors (*)
      `)
      .eq('bus_id', busId)
      .order('shift_date', { ascending: false });

    if (startDate) {
      query = query.gte('shift_date', startDate);
    }
    if (endDate) {
      query = query.lte('shift_date', endDate);
    }

    const { data: shifts, error } = await query;

    if (error) throw error;

    res.json(shifts || []);
  } catch (error: any) {
    console.error('Error fetching bus shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to determine shift status based on time
 */
function determineShiftStatus(
  departureTime: string,
  arrivalTime: string
): 'upcoming' | 'active' | 'completed' {
  const now = new Date();
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  if (now >= departure && now < arrival) {
    return 'active';
  } else if (now < departure) {
    return 'upcoming';
  } else {
    return 'completed';
  }
}

export default router;
