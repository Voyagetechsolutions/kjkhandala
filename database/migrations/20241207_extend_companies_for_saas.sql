-- Migration: Extend companies table for SaaS multi-tenancy
-- Date: 2024-12-07
-- Description: Adds API keys, branding, features, and subscription fields for external website integration

-- ============================================
-- 1. EXTEND COMPANIES TABLE
-- ============================================

-- Unique slug for URL-friendly identification
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE;

-- API Authentication
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_secret VARCHAR(128);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_key_last_used_at TIMESTAMPTZ;

-- Branding
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#1E40AF';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#10B981';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter';

-- Contact Information
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Zimbabwe';

-- Features Configuration (flexible JSON)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
  "online_booking": true,
  "seat_selection": true,
  "loyalty_program": false,
  "live_tracking": true,
  "sms_notifications": true,
  "email_notifications": true,
  "refunds_enabled": true,
  "guest_checkout": true,
  "multi_currency": false
}'::jsonb;

-- Business Settings (flexible JSON)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "currency": "USD",
  "currency_symbol": "$",
  "timezone": "Africa/Harare",
  "date_format": "DD/MM/YYYY",
  "time_format": "HH:mm",
  "booking_advance_days": 30,
  "min_booking_hours": 2,
  "cancellation_policy_hours": 24,
  "refund_percentage": 80,
  "tax_rate": 0,
  "service_fee": 0
}'::jsonb;

-- Subscription/Billing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'basic';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);

-- API Rate Limiting
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_rate_limit INTEGER DEFAULT 1000;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_calls_this_month INTEGER DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_calls_reset_at TIMESTAMPTZ;

-- Webhook Configuration
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(128);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT '["booking.created", "booking.confirmed", "booking.cancelled", "payment.completed"]'::jsonb;

-- Status
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_api_key ON public.companies(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON public.companies(subscription_status);

-- ============================================
-- 3. API LOGS TABLE (for tracking API usage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_company_id ON public.api_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);

-- ============================================
-- 4. WEBHOOK LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_company_id ON public.webhook_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to generate a secure API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  key := 'vts_' || encode(gen_random_bytes(24), 'hex');
  RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a secure API secret
CREATE OR REPLACE FUNCTION generate_api_secret()
RETURNS TEXT AS $$
DECLARE
  secret TEXT;
BEGIN
  secret := 'vts_secret_' || encode(gen_random_bytes(48), 'hex');
  RETURN secret;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug from 1 for 40);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ROW LEVEL SECURITY (Optional - for multi-tenant isolation)
-- ============================================

-- Enable RLS on key tables if not already enabled
-- Note: This requires setting app.company_id in the session

-- ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment to enable):
-- CREATE POLICY company_isolation_routes ON public.routes
--   USING (company_id = current_setting('app.company_id', true)::UUID);

-- ============================================
-- 7. UPDATE EXISTING COMPANIES WITH DEFAULTS
-- ============================================

-- Generate slugs for existing companies without one
UPDATE public.companies 
SET slug = generate_company_slug(name)
WHERE slug IS NULL;

-- Generate API keys for existing companies without one
UPDATE public.companies 
SET 
  api_key = generate_api_key(),
  api_secret = generate_api_secret(),
  api_key_created_at = NOW()
WHERE api_key IS NULL;

COMMENT ON TABLE public.companies IS 'Multi-tenant company configuration for SaaS bus management system';
COMMENT ON COLUMN public.companies.api_key IS 'Public API key for external website integration (prefix: vts_)';
COMMENT ON COLUMN public.companies.api_secret IS 'Secret key for webhook signature verification';
COMMENT ON COLUMN public.companies.features IS 'JSON object containing enabled/disabled features for this company';
COMMENT ON COLUMN public.companies.settings IS 'JSON object containing business settings (currency, timezone, policies)';
