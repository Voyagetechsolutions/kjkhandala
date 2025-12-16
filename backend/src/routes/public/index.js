/**
 * Public API v1 Routes
 * These routes are accessible via API key authentication for external websites
 */

const express = require('express');
const router = express.Router();

const { apiKeyAuth, requireFeature, apiResponseLogger } = require('../../middleware/apiKeyAuth');
const configRoutes = require('./config');
const routesRoutes = require('./routes');
const tripsRoutes = require('./trips');
const bookingsRoutes = require('./bookings');
const paymentsRoutes = require('./payments');
const trackingRoutes = require('./tracking');

// Apply API key authentication to all public routes
router.use(apiKeyAuth);
router.use(apiResponseLogger);

// Mount sub-routes
router.use('/config', configRoutes);
router.use('/routes', routesRoutes);
router.use('/trips', tripsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/tracking', requireFeature('live_tracking'), trackingRoutes);

// Health check for public API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    company: req.company.name,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
