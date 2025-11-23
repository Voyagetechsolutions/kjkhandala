const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { data: schedules, error } = await supabase.from('trips').select('*').order('departure_time');
    if (error) throw error;
    res.json({ data: schedules || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
