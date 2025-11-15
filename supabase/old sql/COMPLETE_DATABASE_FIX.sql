-- =====================================================
-- COMPLETE DATABASE FIX - ALL MISSING COLUMNS & TABLES
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX BUSES TABLE
-- =====================================================
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
ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- =====================================================
-- 2. FIX DRIVERS TABLE
-- =====================================================
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- 3. FIX ROUTES TABLE
-- =====================================================
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS duration_hours NUMERIC,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS route_type TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- =====================================================
-- 4. FIX TRIPS TABLE
-- =====================================================
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS scheduled_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_arrival TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMPTZ;

-- =====================================================
-- 5. FIX PROFILES TABLE (for employees/staff)
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS salary NUMERIC,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- 6. CREATE INCOME TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
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
-- 7. CREATE MAINTENANCE_ALERTS TABLE
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
-- 8. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Buses
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON buses;
CREATE POLICY "Enable all for authenticated users" ON buses FOR ALL USING (true) WITH CHECK (true);

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON drivers;
CREATE POLICY "Enable all for authenticated users" ON drivers FOR ALL USING (true) WITH CHECK (true);

-- Routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON routes;
CREATE POLICY "Enable all for authenticated users" ON routes FOR ALL USING (true) WITH CHECK (true);

-- Trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON trips;
CREATE POLICY "Enable all for authenticated users" ON trips FOR ALL USING (true) WITH CHECK (true);

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON bookings;
CREATE POLICY "Enable all for authenticated users" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON profiles;
CREATE POLICY "Enable all for authenticated users" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Income
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON income;
CREATE POLICY "Enable all for authenticated users" ON income FOR ALL USING (true) WITH CHECK (true);

-- Maintenance Alerts
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON maintenance_alerts;
CREATE POLICY "Enable all for authenticated users" ON maintenance_alerts FOR ALL USING (true) WITH CHECK (true);

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_roles;
CREATE POLICY "Enable all for authenticated users" ON user_roles FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 9. CREATE MISSING INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS buses_status_idx ON buses(status);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON drivers(status);
CREATE INDEX IF NOT EXISTS routes_active_idx ON routes(active);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- =====================================================
-- DONE! Your database is now ready.
-- =====================================================
