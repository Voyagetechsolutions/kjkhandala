-- =====================================================
-- CRITICAL FIX: Add ALL missing columns and tables
-- Run this in Supabase SQL Editor immediately
-- =====================================================

-- 1. Fix buses table - add missing columns
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

-- Add unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'buses_number_plate_key'
    ) THEN
        ALTER TABLE buses ADD CONSTRAINT buses_number_plate_key UNIQUE (number_plate);
    END IF;
END $$;

-- 2. Create maintenance_alerts table
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

-- Enable RLS for maintenance_alerts
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON maintenance_alerts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON maintenance_alerts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON maintenance_alerts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON maintenance_alerts;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON maintenance_alerts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON maintenance_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON maintenance_alerts
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON maintenance_alerts
  FOR DELETE USING (true);

-- 3. Ensure RLS is enabled on buses table with permissive policies
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON buses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON buses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON buses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON buses;

CREATE POLICY "Enable read access for all users" ON buses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON buses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON buses
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON buses
  FOR DELETE USING (true);

-- 4. Ensure drivers table has proper RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON drivers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON drivers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON drivers;

CREATE POLICY "Enable read access for all users" ON drivers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON drivers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON drivers
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON drivers
  FOR DELETE USING (true);

-- 5. Ensure routes table has proper RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON routes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON routes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON routes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON routes;

CREATE POLICY "Enable read access for all users" ON routes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON routes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON routes
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON routes
  FOR DELETE USING (true);

-- 6. Ensure trips table has proper RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON trips;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON trips;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON trips;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON trips;

CREATE POLICY "Enable read access for all users" ON trips
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON trips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON trips
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON trips
  FOR DELETE USING (true);
