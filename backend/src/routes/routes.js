const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all routes
router.get('/', async (req, res) => {
  try {
    const { data: routes, error } = await supabase.from('routes').select('*').order('origin');
    if (error) throw error;
    res.json({ data: routes || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get route by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: route, error } = await supabase.from('routes').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create route
router.post('/', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: route, error } = await supabase.from('routes').insert(req.body).select('*').single();
    if (error) throw error;
    res.status(201).json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update route
router.put('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { data: route, error } = await supabase.from('routes').update(req.body).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete route
router.delete('/:id', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_MANAGER']), async (req, res) => {
  try {
    const { error } = await supabase.from('routes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
