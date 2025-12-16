/**
 * Public API - Configuration Routes
 * Returns company branding, features, and settings for external websites
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/config
 * Returns company configuration including branding, features, and settings
 */
router.get('/', (req, res) => {
  const { company } = req;

  res.json({
    success: true,
    data: {
      company: {
        name: company.name,
        slug: company.slug,
        code: company.code,
        is_verified: company.is_verified,
      },
      branding: company.branding,
      contact: company.contact,
      features: company.features,
      settings: {
        currency: company.settings.currency || 'USD',
        currency_symbol: company.settings.currency_symbol || '$',
        timezone: company.settings.timezone || 'Africa/Harare',
        date_format: company.settings.date_format || 'DD/MM/YYYY',
        time_format: company.settings.time_format || 'HH:mm',
        booking_advance_days: company.settings.booking_advance_days || 30,
        min_booking_hours: company.settings.min_booking_hours || 2,
        cancellation_policy_hours: company.settings.cancellation_policy_hours || 24,
        refund_percentage: company.settings.refund_percentage || 80,
        tax_rate: company.settings.tax_rate || 0,
        service_fee: company.settings.service_fee || 0,
      },
    },
  });
});

/**
 * GET /api/v1/config/branding
 * Returns only branding configuration
 */
router.get('/branding', (req, res) => {
  res.json({
    success: true,
    data: req.company.branding,
  });
});

/**
 * GET /api/v1/config/features
 * Returns enabled features for this company
 */
router.get('/features', (req, res) => {
  res.json({
    success: true,
    data: req.company.features,
  });
});

/**
 * GET /api/v1/config/settings
 * Returns business settings
 */
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: req.company.settings,
  });
});

module.exports = router;
