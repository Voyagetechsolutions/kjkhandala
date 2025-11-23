const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all buses
router.get('/', async (req, res) => {
  try {
    const { data: buses, error } = await supabase.from('buses').select('*').order('registration_number');
    if (error) throw error;
    res.json({ data: buses || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: bus, error } = await supabase.from('buses').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bus
router.post('/', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: bus, error } = await supabase.from('buses').insert(req.body).select('*').single();
    if (error) throw error;
    res.status(201).json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bus
router.put('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: bus, error } = await supabase.from('buses').update(req.body).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ data: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bus
router.delete('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { error } = await supabase.from('buses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
