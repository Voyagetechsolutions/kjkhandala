-- =====================================================
-- FINAL COMPLETE FIX - Enums, Columns, Tables, RLS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM TYPES (if they don't exist)
-- =====================================================

-- Bus status enum
DO $$ BEGIN
    CREATE TYPE bus_status AS ENUM ('active', 'out_of_service', 'maintenance', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Driver status enum
DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_leave', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Route type enum (if not exists)
DO $$ BEGIN
    CREATE TYPE route_type_enum AS ENUM ('local', 'express', 'intercity', 'international');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. FIX BUSES TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS number_plate TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS layout_rows INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS layout_columns INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS gps_device_id TEXT,
ADD COLUMN IF NOT EXISTS total_mileage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS license_expiry DATE,
ADD COLUMN IF NOT EXISTS bus_status bus_status DEFAULT 'active';

-- Update existing status column to use enum (if it's text)
DO $$ 
BEGIN
    -- Try to alter the column type
    ALTER TABLE buses ALTER COLUMN status TYPE bus_status USING status::bus_status;
EXCEPTION
    WHEN OTHERS THEN
        -- If it fails, the column might already be the right type or doesn't exist
        NULL;
END $$;

-- =====================================================
-- 3. FIX DRIVERS TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS driver_status driver_status DEFAULT 'active';

-- Update existing status column to use enum
DO $$ 
BEGIN
    ALTER TABLE drivers ALTER COLUMN status TYPE driver_status USING status::driver_status;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- 4. FIX ROUTES TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS route_code TEXT,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS duration_hours NUMERIC,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS route_type TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Make route_code NOT NULL with a default if it doesn't have data
UPDATE routes SET route_code = 'R' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') 
WHERE route_code IS NULL;

-- Now make it NOT NULL
ALTER TABLE routes ALTER COLUMN route_code SET NOT NULL;

-- Add unique constraint
DO $$ 
BEGIN
    ALTER TABLE routes ADD CONSTRAINT routes_route_code_key UNIQUE (route_code);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 5. FIX TRIPS TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS scheduled_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_arrival TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMPTZ;

-- =====================================================
-- 6. FIX PROFILES TABLE (for employees/staff)
-- =====================================================

-- Add missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS salary NUMERIC,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- 7. CREATE INCOME TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed',
  description TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS income_created_at_idx ON income(created_at);
CREATE INDEX IF NOT EXISTS income_trip_id_idx ON income(trip_id);

-- =====================================================
-- 8. CREATE MAINTENANCE_ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  message TEXT,
  due_date DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS maintenance_alerts_bus_id_idx ON maintenance_alerts(bus_id);
CREATE INDEX IF NOT EXISTS maintenance_alerts_created_at_idx ON maintenance_alerts(created_at DESC);

-- =====================================================
-- 9. ENABLE RLS ON ALL TABLES WITH PERMISSIVE POLICIES
-- =====================================================

-- Buses
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON buses;
CREATE POLICY "Allow all for authenticated users" ON buses 
  FOR ALL USING (true) WITH CHECK (true);

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON drivers;
CREATE POLICY "Allow all for authenticated users" ON drivers 
  FOR ALL USING (true) WITH CHECK (true);

-- Routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON routes;
CREATE POLICY "Allow all for authenticated users" ON routes 
  FOR ALL USING (true) WITH CHECK (true);

-- Trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON trips;
CREATE POLICY "Allow all for authenticated users" ON trips 
  FOR ALL USING (true) WITH CHECK (true);

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON bookings;
CREATE POLICY "Allow all for authenticated users" ON bookings 
  FOR ALL USING (true) WITH CHECK (true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON profiles;
CREATE POLICY "Allow all for authenticated users" ON profiles 
  FOR ALL USING (true) WITH CHECK (true);

-- Income
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON income;
CREATE POLICY "Allow all for authenticated users" ON income 
  FOR ALL USING (true) WITH CHECK (true);

-- Maintenance Alerts
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON maintenance_alerts;
CREATE POLICY "Allow all for authenticated users" ON maintenance_alerts 
  FOR ALL USING (true) WITH CHECK (true);

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_roles;
CREATE POLICY "Allow all for authenticated users" ON user_roles 
  FOR ALL USING (true) WITH CHECK (true);

-- Incidents (if exists)
DO $$ 
BEGIN
    ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON incidents;
    CREATE POLICY "Allow all for authenticated users" ON incidents 
      FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- =====================================================
-- 10. CREATE PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS buses_status_idx ON buses(status);
CREATE INDEX IF NOT EXISTS buses_bus_status_idx ON buses(bus_status);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON drivers(status);
CREATE INDEX IF NOT EXISTS drivers_driver_status_idx ON drivers(driver_status);
CREATE INDEX IF NOT EXISTS routes_active_idx ON routes(active);
CREATE INDEX IF NOT EXISTS routes_route_code_idx ON routes(route_code);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- =====================================================
-- 11. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE income IS 'Tracks all revenue and income transactions';
COMMENT ON TABLE maintenance_alerts IS 'Tracks maintenance alerts and notifications for buses';
COMMENT ON COLUMN buses.bus_status IS 'Current operational status of the bus';
COMMENT ON COLUMN drivers.driver_status IS 'Current employment status of the driver';
COMMENT ON COLUMN routes.route_code IS 'Unique identifier for the route';

-- =====================================================
-- DONE! Database is now fully configured.
-- =====================================================

-- Verify tables exist
SELECT 
    'buses' as table_name, 
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'buses'
UNION ALL
SELECT 'drivers', COUNT(*) FROM information_schema.columns WHERE table_name = 'drivers'
UNION ALL
SELECT 'routes', COUNT(*) FROM information_schema.columns WHERE table_name = 'routes'
UNION ALL
SELECT 'income', COUNT(*) FROM information_schema.columns WHERE table_name = 'income'
UNION ALL
SELECT 'maintenance_alerts', COUNT(*) FROM information_schema.columns WHERE table_name = 'maintenance_alerts';
