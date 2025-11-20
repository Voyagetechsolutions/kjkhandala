const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { data: staff, error } = await supabase.from('profiles').select('*').order('first_name');
    if (error) throw error;
    res.json({ data: staff || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
