-- ============================================
-- MULTI-TENANCY SETUP FOR VOYAGE VTS SAAS
-- ============================================
-- This migration adds multi-tenant support to the system
-- Each bus company is a tenant with isolated data

-- ============================================
-- PART 1: Create Tenants Table
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#DC2626',
  status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_tier VARCHAR(20) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  max_buses INT DEFAULT 2,
  max_routes INT DEFAULT 1,
  max_users INT DEFAULT 2,
  settings JSONB DEFAULT '{
    "currency": "BWP",
    "timezone": "Africa/Gaborone",
    "language": "en",
    "country": "BW"
  }'::jsonb,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  billing_email VARCHAR(255),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- ============================================
-- PART 2: Create Tenant Users Junction Table
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'OPERATIONS_MANAGER',
    'FINANCE_MANAGER',
    'HR_MANAGER',
    'MAINTENANCE_MANAGER',
    'TICKETING_AGENT',
    'TICKETING_SUPERVISOR',
    'DRIVER'
  )),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);

-- ============================================
-- PART 3: Add tenant_id to existing tables
-- ============================================

-- Routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id);

-- Buses table  
ALTER TABLE buses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_buses_tenant_id ON buses(tenant_id);

-- Drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);

-- Cities table (shared across tenants - no tenant_id needed)
-- Cities are global resources

-- Route frequencies
ALTER TABLE route_frequencies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_tenant_id ON route_frequencies(tenant_id);

-- Trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON trips(tenant_id);

-- Schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_id ON schedules(tenant_id);

-- Driver shifts table
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_tenant_id ON driver_shifts(tenant_id);

-- Bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);

-- Passengers table
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_passengers_tenant_id ON passengers(tenant_id);

-- Payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- Offices table
ALTER TABLE offices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_offices_tenant_id ON offices(tenant_id);

-- Employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);

-- Maintenance records
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_tenant_id ON maintenance_records(tenant_id);

-- ============================================
-- PART 4: Create Helper Functions
-- ============================================

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role in tenant
CREATE OR REPLACE FUNCTION has_tenant_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = get_user_tenant_id()
    AND role = required_role
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Tenants table policies
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id() OR belongs_to_tenant(id));

CREATE POLICY "Tenant admins can update their tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id() AND has_tenant_role('TENANT_ADMIN'));

-- Tenant users policies
CREATE POLICY "Users can view their tenant's users"
  ON tenant_users FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can manage users"
  ON tenant_users FOR ALL
  USING (tenant_id = get_user_tenant_id() AND has_tenant_role('TENANT_ADMIN'));

-- Generic policy for all tenant-scoped tables
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'routes', 'buses', 'drivers', 'route_frequencies', 'trips', 
      'schedules', 'driver_shifts', 'bookings', 'passengers', 
      'payments', 'offices', 'employees', 'maintenance_records'
    ])
  LOOP
    -- SELECT policy
    EXECUTE format('
      CREATE POLICY "Users can view their tenant %I"
        ON %I FOR SELECT
        USING (tenant_id = get_user_tenant_id())
    ', table_name, table_name);

    -- INSERT policy
    EXECUTE format('
      CREATE POLICY "Users can insert into their tenant %I"
        ON %I FOR INSERT
        WITH CHECK (tenant_id = get_user_tenant_id())
    ', table_name, table_name);

    -- UPDATE policy
    EXECUTE format('
      CREATE POLICY "Users can update their tenant %I"
        ON %I FOR UPDATE
        USING (tenant_id = get_user_tenant_id())
    ', table_name, table_name);

    -- DELETE policy
    EXECUTE format('
      CREATE POLICY "Admins can delete their tenant %I"
        ON %I FOR DELETE
        USING (tenant_id = get_user_tenant_id() AND 
               (has_tenant_role(''TENANT_ADMIN'') OR has_tenant_role(''SUPER_ADMIN'')))
    ', table_name, table_name);
  END LOOP;
END $$;

-- ============================================
-- PART 6: Create Default Tenant (KJ Khandala)
-- ============================================

INSERT INTO tenants (
  name, 
  slug, 
  status, 
  subscription_tier,
  max_buses,
  max_routes,
  max_users,
  subscription_started_at,
  settings
) VALUES (
  'KJ Khandala Bus Services',
  'kj-khandala',
  'active',
  'enterprise',
  999,
  999,
  999,
  NOW(),
  '{
    "currency": "BWP",
    "timezone": "Africa/Gaborone",
    "language": "en",
    "country": "BW",
    "payment_methods": ["cash", "card", "mobile_money"],
    "enable_online_booking": true
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PART 7: Audit Trail
-- ============================================

COMMENT ON TABLE tenants IS 'Multi-tenant support - each bus company is a tenant';
COMMENT ON TABLE tenant_users IS 'Maps users to tenants with roles';
COMMENT ON FUNCTION get_user_tenant_id() IS 'Returns the tenant_id for the current authenticated user';
COMMENT ON FUNCTION has_tenant_role(TEXT) IS 'Checks if current user has a specific role in their tenant';
COMMENT ON FUNCTION belongs_to_tenant(UUID) IS 'Checks if current user belongs to a specific tenant';
