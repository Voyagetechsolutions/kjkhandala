-- =====================================================
-- CREATE ALL MISSING VIEWS AND TABLES
-- Run this to fix all 404 errors
-- =====================================================

-- =====================================================
-- 1. REVENUE_SUMMARY VIEW
-- =====================================================

DROP VIEW IF EXISTS revenue_summary CASCADE;

CREATE VIEW revenue_summary AS
SELECT 
  DATE(created_at) as date,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count
FROM income
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- 2. MAINTENANCE_REMINDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS maintenance_reminders_bus_id_idx ON maintenance_reminders(bus_id);
CREATE INDEX IF NOT EXISTS maintenance_reminders_due_date_idx ON maintenance_reminders(due_date);
CREATE INDEX IF NOT EXISTS maintenance_reminders_is_completed_idx ON maintenance_reminders(is_completed);

-- =====================================================
-- 3. GPS_TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  latitude NUMERIC,
  longitude NUMERIC,
  speed NUMERIC,
  heading NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gps_tracking_bus_id_idx ON gps_tracking(bus_id);
CREATE INDEX IF NOT EXISTS gps_tracking_timestamp_idx ON gps_tracking(timestamp DESC);

-- =====================================================
-- 4. MAINTENANCE_RECORDS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS maintenance_records_bus_id_idx ON maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS maintenance_records_status_idx ON maintenance_records(status);

-- =====================================================
-- 5. SCHEDULES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  scheduled_departure TIMESTAMPTZ NOT NULL,
  scheduled_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  available_seats INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedules_route_id_idx ON schedules(route_id);
CREATE INDEX IF NOT EXISTS schedules_bus_id_idx ON schedules(bus_id);
CREATE INDEX IF NOT EXISTS schedules_driver_id_idx ON schedules(driver_id);
CREATE INDEX IF NOT EXISTS schedules_status_idx ON schedules(status);

-- =====================================================
-- 6. BOOKINGS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT,
  passenger_phone TEXT,
  seat_number TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_schedule_id_idx ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings(payment_status);

-- =====================================================
-- 7. ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Maintenance Reminders - only if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_reminders') THEN
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON maintenance_reminders;
    CREATE POLICY "Allow all for authenticated users" ON maintenance_reminders 
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- GPS Tracking
DROP POLICY IF EXISTS "Allow all for authenticated users" ON gps_tracking;
CREATE POLICY "Allow all for authenticated users" ON gps_tracking 
  FOR ALL USING (true) WITH CHECK (true);

-- Maintenance Records
DROP POLICY IF EXISTS "Allow all for authenticated users" ON maintenance_records;
CREATE POLICY "Allow all for authenticated users" ON maintenance_records 
  FOR ALL USING (true) WITH CHECK (true);

-- Schedules
DROP POLICY IF EXISTS "Allow all for authenticated users" ON schedules;
CREATE POLICY "Allow all for authenticated users" ON schedules 
  FOR ALL USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Allow all for authenticated users" ON bookings;
CREATE POLICY "Allow all for authenticated users" ON bookings 
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 9. VERIFY CREATION
-- =====================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema='public' 
  AND table_name IN ('maintenance_reminders', 'gps_tracking', 'maintenance_records', 'schedules', 'bookings')
ORDER BY table_name;

-- Check views
SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name='revenue_summary';

-- =====================================================
-- DONE! All missing tables and views created.
-- =====================================================
