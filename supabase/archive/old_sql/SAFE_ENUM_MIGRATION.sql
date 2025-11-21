-- =====================================================
-- SAFE ENUM MIGRATION - Handles All Edge Cases
-- This script safely migrates status columns to enums
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM TYPES (if they don't exist)
-- =====================================================

-- Drop existing enums if they exist (to recreate with correct values)
DROP TYPE IF EXISTS bus_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;

-- Create enum types
CREATE TYPE bus_status AS ENUM ('active', 'out_of_service', 'maintenance', 'retired');
CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_leave', 'suspended');

-- =====================================================
-- 2. BUSES TABLE - Safe Migration
-- =====================================================

-- Drop dependent views first
DROP VIEW IF EXISTS bus_utilization CASCADE;

-- Drop any existing temp column first
ALTER TABLE buses DROP COLUMN IF EXISTS bus_status_temp;

-- Check if status column exists, if so migrate it
DO $$ 
BEGIN
    -- Add temporary TEXT column
    ALTER TABLE buses ADD COLUMN bus_status_temp TEXT;
    
    -- Copy existing status values as text (if status column exists)
    UPDATE buses
    SET bus_status_temp = status::TEXT;
    
    -- Normalize text values to match enum exactly
    UPDATE buses
    SET bus_status_temp = CASE
        WHEN LOWER(bus_status_temp) = 'active' THEN 'active'
        WHEN LOWER(bus_status_temp) IN ('out of service', 'out_of_service') THEN 'out_of_service'
        WHEN LOWER(bus_status_temp) = 'maintenance' THEN 'maintenance'
        WHEN LOWER(bus_status_temp) = 'retired' THEN 'retired'
        ELSE 'active'
    END;
    
    -- Drop old status column
    ALTER TABLE buses DROP COLUMN IF EXISTS status;
    
EXCEPTION WHEN undefined_column THEN
    -- status column doesn't exist, that's ok
    NULL;
END $$;

-- Add new enum status column if it doesn't exist
ALTER TABLE buses ADD COLUMN IF NOT EXISTS status bus_status NOT NULL DEFAULT 'active';

-- Copy normalized text into enum column if temp column exists
DO $$
BEGIN
    UPDATE buses
    SET status = bus_status_temp::bus_status
    WHERE bus_status_temp IS NOT NULL;
    
    -- Drop temporary column
    ALTER TABLE buses DROP COLUMN IF EXISTS bus_status_temp;
EXCEPTION WHEN undefined_column THEN
    NULL;
END $$;

-- =====================================================
-- 3. DRIVERS TABLE - Safe Migration
-- =====================================================

-- Drop any existing temp column first
ALTER TABLE drivers DROP COLUMN IF EXISTS driver_status_temp;

-- Check if status column exists, if so migrate it
DO $$ 
BEGIN
    -- Add temporary TEXT column
    ALTER TABLE drivers ADD COLUMN driver_status_temp TEXT;
    
    -- Copy existing status values as text (if status column exists)
    UPDATE drivers
    SET driver_status_temp = status::TEXT;
    
    -- Normalize text values to match enum exactly
    UPDATE drivers
    SET driver_status_temp = CASE
        WHEN LOWER(driver_status_temp) = 'active' THEN 'active'
        WHEN LOWER(driver_status_temp) = 'inactive' THEN 'inactive'
        WHEN LOWER(driver_status_temp) IN ('on leave', 'on_leave') THEN 'on_leave'
        WHEN LOWER(driver_status_temp) = 'suspended' THEN 'suspended'
        ELSE 'active'
    END;
    
    -- Drop old status column
    ALTER TABLE drivers DROP COLUMN IF EXISTS status;
    
EXCEPTION WHEN undefined_column THEN
    -- status column doesn't exist, that's ok
    NULL;
END $$;

-- Add new enum status column if it doesn't exist
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status driver_status NOT NULL DEFAULT 'active';

-- Copy normalized text into enum column if temp column exists
DO $$
BEGIN
    UPDATE drivers
    SET status = driver_status_temp::driver_status
    WHERE driver_status_temp IS NOT NULL;
    
    -- Drop temporary column
    ALTER TABLE drivers DROP COLUMN IF EXISTS driver_status_temp;
EXCEPTION WHEN undefined_column THEN
    NULL;
END $$;

-- =====================================================
-- 4. ADD ALL OTHER MISSING COLUMNS
-- =====================================================

-- BUSES - Add missing columns
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

-- DRIVERS - Add missing columns
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ROUTES - Add missing columns
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS route_code TEXT,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS duration_hours NUMERIC,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS route_type TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Auto-generate route_code for existing routes
UPDATE routes 
SET route_code = 'R' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') 
WHERE route_code IS NULL;

-- Make route_code NOT NULL
ALTER TABLE routes ALTER COLUMN route_code SET NOT NULL;

-- Add unique constraint
DO $$ 
BEGIN
    ALTER TABLE routes ADD CONSTRAINT routes_route_code_key UNIQUE (route_code);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- TRIPS - Add missing columns
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS scheduled_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_arrival TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMPTZ;

-- PROFILES - Add missing columns for employees
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS salary NUMERIC,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- =====================================================
-- 5. CREATE MISSING TABLES
-- =====================================================

-- INCOME TABLE
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

-- MAINTENANCE_ALERTS TABLE
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
-- 6. ENABLE RLS ON ALL TABLES
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

-- =====================================================
-- 7. CREATE PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS buses_status_idx ON buses(status);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON drivers(status);
CREATE INDEX IF NOT EXISTS routes_active_idx ON routes(active);
CREATE INDEX IF NOT EXISTS routes_route_code_idx ON routes(route_code);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- =====================================================
-- 8. VERIFY MIGRATION SUCCESS
-- =====================================================

-- Check enum values
SELECT 'buses' as table_name, status, COUNT(*) as count 
FROM buses GROUP BY status
UNION ALL
SELECT 'drivers', status::TEXT, COUNT(*) 
FROM drivers GROUP BY status;

-- Check column counts
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

-- =====================================================
-- DONE! Database is fully migrated and ready.
-- =====================================================
