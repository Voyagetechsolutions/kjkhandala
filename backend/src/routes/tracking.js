const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const trackingEngine = require('../services/trackingEngine');

// Update GPS location
router.post('/location', authenticate, async (req, res) => {
  try {
    const location = await trackingEngine.updateLocation(req.body);
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get trip location
router.get('/location/:tripId', authenticate, async (req, res) => {
  try {
    const location = await trackingEngine.getLatestLocation(req.params.tripId);
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get location history
router.get('/location/:tripId/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await trackingEngine.getLocationHistory(req.params.tripId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all driver locations
router.get('/drivers', authenticate, authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const locations = await trackingEngine.getAllDriverLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all bus locations
router.get('/buses', authenticate, authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const locations = await trackingEngine.getAllBusLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get trip progress
router.get('/progress/:tripId', authenticate, async (req, res) => {
  try {
    const progress = await trackingEngine.calculateTripProgress(req.params.tripId);
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get live dashboard
router.get('/dashboard', authenticate, authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const dashboard = await trackingEngine.getLiveDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
