/**
 * API Key Authentication Middleware
 * Validates x-api-key header and injects company context into request
 */

const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * Middleware to authenticate requests using API key
 * Extracts company_id from valid API key and attaches to request
 */
const apiKeyAuth = async (req, res, next) => {
  const startTime = Date.now();
  const apiKey = req.header('x-api-key') || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header',
      code: 'MISSING_API_KEY',
    });
  }

  // Validate API key format
  if (!apiKey.startsWith('vts_') || apiKey.length < 20) {
    return res.status(401).json({
      error: 'Invalid API key format',
      message: 'API key must start with "vts_" prefix',
      code: 'INVALID_API_KEY_FORMAT',
    });
  }

  try {
    // Look up company by API key
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        code,
        logo_url,
        favicon_url,
        primary_color,
        secondary_color,
        accent_color,
        font_family,
        email,
        phone,
        website_url,
        address,
        city,
        country,
        features,
        settings,
        subscription_tier,
        subscription_status,
        subscription_expires_at,
        api_rate_limit,
        api_calls_this_month,
        api_calls_reset_at,
        webhook_url,
        webhook_events,
        is_active,
        is_verified
      `)
      .eq('api_key', apiKey)
      .single();

    if (error || !company) {
      await logApiRequest(req, null, 401, Date.now() - startTime, 'Invalid API key');
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been revoked',
        code: 'INVALID_API_KEY',
      });
    }

    // Check if company is active
    if (!company.is_active) {
      await logApiRequest(req, company.id, 403, Date.now() - startTime, 'Company inactive');
      return res.status(403).json({
        error: 'Company inactive',
        message: 'This company account has been deactivated',
        code: 'COMPANY_INACTIVE',
      });
    }

    // Check subscription status
    if (company.subscription_status !== 'active') {
      await logApiRequest(req, company.id, 403, Date.now() - startTime, 'Subscription expired');
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Please renew your subscription to continue using the API',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    // Check subscription expiry
    if (company.subscription_expires_at && new Date(company.subscription_expires_at) < new Date()) {
      await logApiRequest(req, company.id, 403, Date.now() - startTime, 'Subscription expired');
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    // Check rate limiting
    const rateLimit = company.api_rate_limit || 1000;
    const callsThisMonth = company.api_calls_this_month || 0;
    const resetAt = company.api_calls_reset_at ? new Date(company.api_calls_reset_at) : null;
    const now = new Date();

    // Reset counter if new month
    let currentCalls = callsThisMonth;
    if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      currentCalls = 0;
      await supabase
        .from('companies')
        .update({ api_calls_this_month: 0, api_calls_reset_at: now.toISOString() })
        .eq('id', company.id);
    }

    // Check if rate limit exceeded
    if (currentCalls >= rateLimit) {
      await logApiRequest(req, company.id, 429, Date.now() - startTime, 'Rate limit exceeded');
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded your monthly API limit of ${rateLimit} requests`,
        code: 'RATE_LIMIT_EXCEEDED',
        limit: rateLimit,
        used: currentCalls,
        reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      });
    }

    // Increment API call counter
    await supabase
      .from('companies')
      .update({ 
        api_calls_this_month: currentCalls + 1,
        api_key_last_used_at: now.toISOString()
      })
      .eq('id', company.id);

    // Attach company context to request
    req.company = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      code: company.code,
      branding: {
        logo_url: company.logo_url,
        favicon_url: company.favicon_url,
        primary_color: company.primary_color,
        secondary_color: company.secondary_color,
        accent_color: company.accent_color,
        font_family: company.font_family,
      },
      contact: {
        email: company.email,
        phone: company.phone,
        website_url: company.website_url,
        address: company.address,
        city: company.city,
        country: company.country,
      },
      features: company.features || {},
      settings: company.settings || {},
      subscription: {
        tier: company.subscription_tier,
        status: company.subscription_status,
        expires_at: company.subscription_expires_at,
      },
      webhook: {
        url: company.webhook_url,
        events: company.webhook_events,
      },
      is_verified: company.is_verified,
      rate_limit: {
        limit: rateLimit,
        used: currentCalls + 1,
        remaining: rateLimit - currentCalls - 1,
      },
    };

    // Add rate limit headers
    res.set('X-RateLimit-Limit', rateLimit.toString());
    res.set('X-RateLimit-Remaining', (rateLimit - currentCalls - 1).toString());
    res.set('X-RateLimit-Reset', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());

    // Log successful request (async, don't wait)
    logApiRequest(req, company.id, null, null, null).catch(() => {});

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred while validating your API key',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Log API request to database
 */
async function logApiRequest(req, companyId, statusCode, responseTimeMs, errorMessage) {
  try {
    await supabase.from('api_logs').insert({
      company_id: companyId,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('User-Agent'),
      request_body: req.method !== 'GET' ? sanitizeBody(req.body) : null,
      error_message: errorMessage,
    });
  } catch (error) {
    logger.error('Failed to log API request:', error);
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return null;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'api_key', 'api_secret', 'token', 'credit_card', 'cvv'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return sanitized;
}

/**
 * Middleware to check if a specific feature is enabled for the company
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.company) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const features = req.company.features || {};
    if (!features[featureName]) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `The "${featureName}" feature is not enabled for your account`,
        code: 'FEATURE_DISABLED',
      });
    }

    next();
  };
};

/**
 * Middleware to check subscription tier
 */
const requireTier = (...allowedTiers) => {
  return (req, res, next) => {
    if (!req.company) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const tier = req.company.subscription?.tier || 'basic';
    if (!allowedTiers.includes(tier)) {
      return res.status(403).json({
        error: 'Upgrade required',
        message: `This endpoint requires a ${allowedTiers.join(' or ')} subscription`,
        code: 'TIER_REQUIRED',
        current_tier: tier,
        required_tiers: allowedTiers,
      });
    }

    next();
  };
};

/**
 * Response logger middleware - logs response after completion
 */
const apiResponseLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    if (req.company?.id) {
      logApiRequest(req, req.company.id, res.statusCode, Date.now() - startTime, null)
        .catch(() => {});
    }
  });

  next();
};

module.exports = {
  apiKeyAuth,
  requireFeature,
  requireTier,
  apiResponseLogger,
};
