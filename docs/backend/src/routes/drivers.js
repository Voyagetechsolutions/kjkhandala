const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const { data: drivers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'DRIVER')
      .order('first_name');
    if (error) throw error;
    res.json({ data: drivers || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
