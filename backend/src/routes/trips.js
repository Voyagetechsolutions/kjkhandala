const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all trips
router.get('/', async (req, res) => {
  try {
    const { date, routeId, status } = req.query;
    let q = supabase.from('trips').select('*');
    if (date) q = q.eq('departure_time', new Date(date).toISOString().split('T')[0]);
    if (routeId) q = q.eq('route_id', routeId);
    if (status) q = q.eq('status', status);
    q = q.order('departure_time');
    const { data: trips, error } = await q;
    if (error) throw error;
    res.json({ data: trips || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trip by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create trip
router.post('/', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert(req.body)
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trip
router.put('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete trip
router.delete('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
