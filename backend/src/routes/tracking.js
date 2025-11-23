const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Basic tracking endpoint
router.get('/', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
