-- ============================================
-- FIX MISSING TABLES AND VIEWS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1️⃣ Create revenue_summary VIEW
-- Used by: SuperAdminDashboard, AnalyticsCharts
-- ============================================
DROP VIEW IF EXISTS public.revenue_summary CASCADE;

CREATE VIEW public.revenue_summary AS
SELECT
  date_trunc('day', b.booking_date)::date AS date,
  COUNT(b.id) AS total_bookings,
  SUM(b.total_amount) AS total_revenue,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  SUM(b.total_amount) - COALESCE(SUM(e.amount), 0) AS net_profit
FROM public.bookings b
LEFT JOIN public.expenses e ON date_trunc('day', e.expense_date)::date = date_trunc('day', b.booking_date)::date
WHERE b.status IN ('confirmed', 'checked_in', 'completed')
GROUP BY date_trunc('day', b.booking_date)::date
ORDER BY date DESC;

COMMENT ON VIEW public.revenue_summary IS 'Daily revenue summary with bookings, revenue, expenses, and net profit';

-- Grant access
GRANT SELECT ON public.revenue_summary TO authenticated;
GRANT SELECT ON public.revenue_summary TO service_role;


-- 2️⃣ Create daily_revenue_summary VIEW
-- Used by: FinanceReports
-- ============================================
DROP VIEW IF EXISTS public.daily_revenue_summary CASCADE;

CREATE VIEW public.daily_revenue_summary AS
SELECT
  date_trunc('day', b.booking_date)::date AS date,
  COUNT(b.id) AS booking_count,
  SUM(b.total_amount) AS total_revenue,
  AVG(b.total_amount) AS avg_booking_value,
  COUNT(DISTINCT b.trip_id) AS trips_count,
  COUNT(DISTINCT b.passenger_id) AS unique_passengers
FROM public.bookings b
WHERE b.status IN ('confirmed', 'checked_in', 'completed')
GROUP BY date_trunc('day', b.booking_date)::date
ORDER BY date DESC;

COMMENT ON VIEW public.daily_revenue_summary IS 'Daily revenue summary for finance reports';

-- Grant access
GRANT SELECT ON public.daily_revenue_summary TO authenticated;
GRANT SELECT ON public.daily_revenue_summary TO service_role;


-- 3️⃣ Check if schedules table exists, if not use trips
-- Used by: SuperAdminDashboard
-- ============================================
-- The system uses 'trips' table, not 'schedules'
-- Create a view alias for backward compatibility

DROP VIEW IF EXISTS public.schedules CASCADE;

CREATE VIEW public.schedules AS
SELECT
  t.id,
  t.route_id,
  t.bus_id,
  t.driver_id,
  t.departure_time::date AS departure_date,
  t.departure_time::time AS departure_time,
  t.arrival_time::time AS arrival_time,
  t.status,
  t.total_seats,
  t.available_seats,
  t.created_at,
  t.updated_at
FROM public.trips t;

COMMENT ON VIEW public.schedules IS 'Alias view for trips table (backward compatibility)';

-- Grant access
GRANT SELECT ON public.schedules TO authenticated;
GRANT SELECT ON public.schedules TO service_role;


-- 4️⃣ Create trip_tracking table if missing
-- Used by: Operations dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  current_location text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  speed decimal(5, 2),
  status text DEFAULT 'on_route',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.trip_tracking IS 'Real-time GPS tracking for trips';

-- Create index
CREATE INDEX IF NOT EXISTS idx_trip_tracking_trip_id ON public.trip_tracking(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tracking_last_updated ON public.trip_tracking(last_updated DESC);

-- Grant access
GRANT ALL ON public.trip_tracking TO authenticated;
GRANT ALL ON public.trip_tracking TO service_role;

-- Enable RLS
ALTER TABLE public.trip_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view trip tracking" ON public.trip_tracking;
CREATE POLICY "Allow authenticated users to view trip tracking"
  ON public.trip_tracking FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow drivers to update their trip tracking" ON public.trip_tracking;
CREATE POLICY "Allow drivers to update their trip tracking"
  ON public.trip_tracking FOR ALL
  TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM public.trips 
      WHERE driver_id = auth.uid()
    )
  );


-- 5️⃣ Create maintenance_reminders table if missing
-- Used by: Maintenance dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  description text,
  due_date date NOT NULL,
  due_mileage int,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.maintenance_reminders IS 'Maintenance reminders and alerts';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_bus_id ON public.maintenance_reminders(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_due_date ON public.maintenance_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_status ON public.maintenance_reminders(status);

-- Grant access
GRANT ALL ON public.maintenance_reminders TO authenticated;
GRANT ALL ON public.maintenance_reminders TO service_role;

-- Enable RLS
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view maintenance reminders" ON public.maintenance_reminders;
CREATE POLICY "Allow authenticated users to view maintenance reminders"
  ON public.maintenance_reminders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow maintenance staff to manage reminders" ON public.maintenance_reminders;
CREATE POLICY "Allow maintenance staff to manage reminders"
  ON public.maintenance_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'MAINTENANCE_MANAGER', 'MAINTENANCE_STAFF')
    )
  );


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if all views exist
SELECT 
  schemaname, 
  viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('revenue_summary', 'daily_revenue_summary', 'schedules')
ORDER BY viewname;

-- Check if all tables exist
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trip_tracking', 'maintenance_reminders')
ORDER BY tablename;

-- Test revenue_summary view
SELECT * FROM public.revenue_summary LIMIT 5;

-- Test daily_revenue_summary view
SELECT * FROM public.daily_revenue_summary LIMIT 5;

-- Test schedules view
SELECT * FROM public.schedules LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables and views created successfully!';
  RAISE NOTICE '✅ revenue_summary view created';
  RAISE NOTICE '✅ daily_revenue_summary view created';
  RAISE NOTICE '✅ schedules view created (alias for trips)';
  RAISE NOTICE '✅ trip_tracking table created';
  RAISE NOTICE '✅ maintenance_reminders table created';
END $$;
