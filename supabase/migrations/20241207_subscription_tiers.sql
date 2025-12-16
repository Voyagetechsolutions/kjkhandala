-- ============================================
-- VTS SaaS Subscription Tiers Migration
-- 4 packages optimized for bus companies
-- ============================================

-- Update subscription_tier enum to support new tiers
-- Note: We're using text instead of enum for flexibility

-- Add new columns to companies table for tier limits tracking
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS bus_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS terminal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trips_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS setup_fee_amount DECIMAL(10,2) DEFAULT 0;

-- Create subscription_tiers reference table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  target_audience TEXT,
  bus_range TEXT,
  
  -- Pricing (in ZAR)
  setup_fee DECIMAL(10,2) NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  
  -- Limits
  max_buses INTEGER NOT NULL,
  max_employees INTEGER NOT NULL,
  max_terminals INTEGER NOT NULL,
  max_trips_per_month INTEGER, -- NULL means unlimited
  
  -- Feature flags (JSON for flexibility)
  features JSONB NOT NULL DEFAULT '{}',
  
  -- Display
  color TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 4 subscription tiers
INSERT INTO subscription_tiers (id, name, tagline, description, target_audience, bus_range, setup_fee, monthly_fee, max_buses, max_employees, max_terminals, max_trips_per_month, color, is_popular, display_order, features)
VALUES 
  (
    'starter',
    'Starter Operator',
    'Get started with the basics',
    'Perfect for new operators with 1-3 buses. Entry-level package to get you running.',
    'New Operators',
    '1-3 buses',
    3500,
    2500,
    3,
    5,
    2,
    20,
    'green',
    FALSE,
    1,
    '{
      "adminDashboard": "limited",
      "operationsDashboard": true,
      "financeDashboard": "basic",
      "ticketing": "basic",
      "qrCheckIn": false,
      "refunds": false,
      "passengerManifest": "none",
      "maintenance": "basic",
      "gpsTracking": "none",
      "hr": "basic",
      "reports": "none",
      "apiAccess": false,
      "supportLevel": "basic"
    }'::jsonb
  ),
  (
    'small',
    'Small Fleet',
    'Full system for growing fleets',
    'Complete fleet management for small operators. Full functionality without enterprise analytics.',
    'Small Fleet Operators',
    '3-10 buses',
    8500,
    7500,
    10,
    20,
    5,
    NULL,
    'yellow',
    FALSE,
    2,
    '{
      "adminDashboard": "full",
      "operationsDashboard": true,
      "financeDashboard": "standard",
      "ticketing": "standard",
      "qrCheckIn": true,
      "refunds": true,
      "passengerManifest": "basic",
      "maintenance": "standard",
      "gpsTracking": "basic",
      "hr": "standard",
      "reports": "basic",
      "apiAccess": false,
      "supportLevel": "standard"
    }'::jsonb
  ),
  (
    'medium',
    'Medium Fleet',
    'Advanced features for growing companies',
    'Ideal for growing companies. Includes advanced ticketing, finance, reporting, and maintenance features.',
    'Growing Fleet Operators',
    '10-25 buses',
    11000,
    8000,
    25,
    50,
    10,
    NULL,
    'orange',
    TRUE,
    3,
    '{
      "adminDashboard": "full",
      "operationsDashboard": true,
      "financeDashboard": "advanced",
      "ticketing": "advanced",
      "qrCheckIn": true,
      "refunds": true,
      "passengerManifest": "advanced",
      "maintenance": "advanced",
      "gpsTracking": "advanced",
      "hr": "advanced",
      "reports": "advanced",
      "apiAccess": false,
      "supportLevel": "priority"
    }'::jsonb
  ),
  (
    'large',
    'Large Fleet / Enterprise',
    'Unlimited power for large operators',
    'Full access for large operators. Unlimited everything with API access, real-time dashboards, and premium support.',
    'Large Fleet Operators',
    '25+ buses',
    13000,
    10500,
    999999,
    999999,
    999999,
    NULL,
    'red',
    FALSE,
    4,
    '{
      "adminDashboard": "full",
      "operationsDashboard": true,
      "financeDashboard": "full",
      "ticketing": "full",
      "qrCheckIn": true,
      "refunds": true,
      "passengerManifest": "full",
      "maintenance": "full",
      "gpsTracking": "full",
      "hr": "full",
      "reports": "full",
      "apiAccess": true,
      "supportLevel": "premium"
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  setup_fee = EXCLUDED.setup_fee,
  monthly_fee = EXCLUDED.monthly_fee,
  max_buses = EXCLUDED.max_buses,
  max_employees = EXCLUDED.max_employees,
  max_terminals = EXCLUDED.max_terminals,
  max_trips_per_month = EXCLUDED.max_trips_per_month,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Migrate existing subscription tiers
-- Convert old tier names to new ones
UPDATE companies SET subscription_tier = 'starter' WHERE subscription_tier IN ('free', 'basic', 'starter');
UPDATE companies SET subscription_tier = 'small' WHERE subscription_tier IN ('pro', 'professional');
UPDATE companies SET subscription_tier = 'medium' WHERE subscription_tier IN ('business', 'growth');
UPDATE companies SET subscription_tier = 'large' WHERE subscription_tier IN ('enterprise', 'unlimited');

-- Create function to check if tenant is within limits
CREATE OR REPLACE FUNCTION check_tenant_limits(
  p_company_id UUID,
  p_resource_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Get the company's subscription tier
  SELECT subscription_tier INTO v_tier FROM companies WHERE id = p_company_id;
  
  IF v_tier IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the limit for this resource type
  SELECT 
    CASE p_resource_type
      WHEN 'buses' THEN max_buses
      WHEN 'employees' THEN max_employees
      WHEN 'terminals' THEN max_terminals
      WHEN 'trips' THEN max_trips_per_month
    END
  INTO v_max_limit
  FROM subscription_tiers
  WHERE id = v_tier;
  
  -- If unlimited (NULL), always return true
  IF v_max_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current count
  SELECT 
    CASE p_resource_type
      WHEN 'buses' THEN (SELECT COUNT(*) FROM buses WHERE company_id = p_company_id)
      WHEN 'employees' THEN (SELECT COUNT(*) FROM profiles WHERE company_id = p_company_id)
      WHEN 'terminals' THEN (SELECT COUNT(*) FROM terminals WHERE company_id = p_company_id)
      WHEN 'trips' THEN (SELECT trips_this_month FROM companies WHERE id = p_company_id)
    END
  INTO v_current_count;
  
  RETURN v_current_count < v_max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_company_id UUID,
  p_feature TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_features JSONB;
  v_feature_value JSONB;
BEGIN
  -- Get the company's subscription tier
  SELECT subscription_tier INTO v_tier FROM companies WHERE id = p_company_id;
  
  IF v_tier IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get features for this tier
  SELECT features INTO v_features FROM subscription_tiers WHERE id = v_tier;
  
  -- Check if feature exists and is enabled
  v_feature_value := v_features->p_feature;
  
  IF v_feature_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Handle boolean features
  IF jsonb_typeof(v_feature_value) = 'boolean' THEN
    RETURN v_feature_value::boolean;
  END IF;
  
  -- Handle level-based features (not 'none' means enabled)
  IF jsonb_typeof(v_feature_value) = 'string' THEN
    RETURN v_feature_value::text != 'none';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update counts
CREATE OR REPLACE FUNCTION update_company_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'buses' THEN
    UPDATE companies SET bus_count = (SELECT COUNT(*) FROM buses WHERE company_id = NEW.company_id) WHERE id = NEW.company_id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    UPDATE companies SET employee_count = (SELECT COUNT(*) FROM profiles WHERE company_id = NEW.company_id) WHERE id = NEW.company_id;
  ELSIF TG_TABLE_NAME = 'terminals' THEN
    UPDATE companies SET terminal_count = (SELECT COUNT(*) FROM terminals WHERE company_id = NEW.company_id) WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for count updates
DROP TRIGGER IF EXISTS update_bus_count ON buses;
CREATE TRIGGER update_bus_count
  AFTER INSERT OR DELETE ON buses
  FOR EACH ROW
  EXECUTE FUNCTION update_company_counts();

DROP TRIGGER IF EXISTS update_employee_count ON profiles;
CREATE TRIGGER update_employee_count
  AFTER INSERT OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_counts();

-- Reset trips_this_month on the 1st of each month (run via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_trip_counts()
RETURNS void AS $$
BEGIN
  UPDATE companies SET trips_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON subscription_tiers TO authenticated;
GRANT EXECUTE ON FUNCTION check_tenant_limits TO authenticated;
GRANT EXECUTE ON FUNCTION has_feature_access TO authenticated;

COMMENT ON TABLE subscription_tiers IS 'VTS SaaS subscription packages with pricing and feature configuration';
COMMENT ON FUNCTION check_tenant_limits IS 'Check if a tenant is within their subscription tier limits';
COMMENT ON FUNCTION has_feature_access IS 'Check if a tenant has access to a specific feature based on their subscription tier';
