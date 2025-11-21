-- =====================================================
-- COMPLETE 09 - TICKETING DASHBOARD VIEWS & FUNCTIONS
-- =====================================================
-- Run this AFTER COMPLETE_01 through COMPLETE_08
-- Uses existing bookings and payments tables
-- =====================================================

-- Step 1: Create Terminals Table (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  terminal_code text UNIQUE NOT NULL,
  location text,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminals_code ON public.terminals(terminal_code);
CREATE INDEX IF NOT EXISTS idx_terminals_status ON public.terminals(status);

-- Step 2: Add terminal_id to bookings and payments (if not exists)
-- =====================================================

DO $$ BEGIN
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terminal_id uuid REFERENCES public.terminals(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS terminal_id uuid REFERENCES public.terminals(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_terminal ON public.bookings(terminal_id);
CREATE INDEX IF NOT EXISTS idx_payments_terminal ON public.payments(terminal_id);

-- Step 3: Create Ticket Alerts Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ticket_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('LOW_SEATS', 'OVERBOOKED', 'DELAYED', 'CANCELLED')),
  message text NOT NULL,
  severity text DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_alerts_trip ON public.ticket_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_read ON public.ticket_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_created ON public.ticket_alerts(created_at);

-- Step 4: Create Daily Reconciliation Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid REFERENCES public.terminals(id),
  reconciliation_date date NOT NULL,
  expected_cash numeric(10,2),
  actual_cash numeric(10,2),
  variance numeric(10,2),
  notes text,
  reconciled_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(terminal_id, reconciliation_date)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_terminal ON public.daily_reconciliation(terminal_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_date ON public.daily_reconciliation(reconciliation_date);

-- Step 5: Enable RLS
-- =====================================================

ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reconciliation ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.terminals;
CREATE POLICY "Allow all for authenticated users" ON public.terminals FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.ticket_alerts;
CREATE POLICY "Allow all for authenticated users" ON public.ticket_alerts FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.daily_reconciliation;
CREATE POLICY "Allow all for authenticated users" ON public.daily_reconciliation FOR ALL TO authenticated USING (true);

-- Step 7: Create Triggers
-- =====================================================

-- Create low seat alerts
DROP TRIGGER IF EXISTS trigger_create_low_seat_alert ON public.trips;
DROP FUNCTION IF EXISTS create_low_seat_alert() CASCADE;

CREATE OR REPLACE FUNCTION create_low_seat_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_seats <= 5 AND NEW.available_seats > 0 THEN
    INSERT INTO public.ticket_alerts (trip_id, alert_type, message, severity)
    VALUES (
      NEW.id,
      'LOW_SEATS',
      'Trip ' || COALESCE(NEW.trip_number, NEW.id::text) || ' has only ' || NEW.available_seats || ' seats remaining',
      CASE 
        WHEN NEW.available_seats <= 2 THEN 'HIGH'
        WHEN NEW.available_seats <= 5 THEN 'MEDIUM'
        ELSE 'LOW'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_low_seat_alert
AFTER UPDATE ON public.trips
FOR EACH ROW
WHEN (OLD.available_seats IS DISTINCT FROM NEW.available_seats)
EXECUTE FUNCTION create_low_seat_alert();

-- Step 8: Create Dashboard Views
-- =====================================================

-- Ticketing Dashboard Stats
DROP VIEW IF EXISTS public.ticketing_dashboard_stats CASCADE;
CREATE OR REPLACE VIEW public.ticketing_dashboard_stats AS
SELECT
  -- Today's metrics
  (SELECT COUNT(*) FROM public.bookings WHERE DATE(booking_date) = CURRENT_DATE) as tickets_sold_today,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE DATE(payment_date) = CURRENT_DATE AND payment_status = 'COMPLETED') as revenue_today,
  (SELECT COUNT(*) FROM public.trips WHERE DATE(scheduled_departure) = CURRENT_DATE AND status IN ('SCHEDULED', 'BOARDING')) as trips_available_today,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'CONFIRMED' AND DATE(check_in_time) = CURRENT_DATE) as passengers_checked_in_today,
  
  -- Overall metrics
  (SELECT COALESCE(AVG((total_seats - available_seats)::numeric / NULLIF(total_seats, 0) * 100), 0) 
   FROM public.trips 
   WHERE DATE(scheduled_departure) = CURRENT_DATE) as avg_occupancy_rate,
  
  (SELECT COUNT(*) FROM public.ticket_alerts WHERE is_read = false) as unread_alerts;

-- Trip Occupancy View
DROP VIEW IF EXISTS public.trip_occupancy CASCADE;
CREATE OR REPLACE VIEW public.trip_occupancy AS
SELECT
  t.id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.total_seats,
  t.available_seats,
  (t.total_seats - t.available_seats) as seats_sold,
  ROUND(((t.total_seats - t.available_seats)::numeric / NULLIF(t.total_seats, 0) * 100), 2) as occupancy_percentage,
  t.status,
  b.registration_number as bus_name,
  d.full_name as driver_name
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.buses b ON t.bus_id = b.id
LEFT JOIN public.drivers d ON t.driver_id = d.id
WHERE DATE(t.scheduled_departure) = CURRENT_DATE
ORDER BY t.scheduled_departure;

-- Payment Summary View
DROP VIEW IF EXISTS public.payment_summary_today CASCADE;
CREATE OR REPLACE VIEW public.payment_summary_today AS
SELECT
  payment_method::text as method,
  COUNT(*) as transaction_count,
  COALESCE(SUM(amount), 0) as total_amount
FROM public.payments
WHERE DATE(payment_date) = CURRENT_DATE
  AND payment_status = 'COMPLETED'
GROUP BY payment_method;

-- Passenger Manifest View
DROP VIEW IF EXISTS public.passenger_manifest CASCADE;
CREATE OR REPLACE VIEW public.passenger_manifest AS
SELECT
  bk.id as booking_id,
  bk.booking_reference as ticket_number,
  bk.passenger_name,
  bk.passenger_phone as phone_number,
  bk.seat_number,
  bk.status,
  bk.payment_status,
  bk.check_in_time as checked_in_at,
  t.id as trip_id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.scheduled_arrival,
  b.registration_number as bus_name
FROM public.bookings bk
JOIN public.trips t ON bk.trip_id = t.id
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.buses b ON t.bus_id = b.id
ORDER BY t.scheduled_departure, bk.seat_number;

-- Step 9: Create Helper Functions
-- =====================================================

-- Function to get today's ticketing stats for a specific terminal
DROP FUNCTION IF EXISTS get_terminal_stats(uuid);
CREATE OR REPLACE FUNCTION get_terminal_stats(terminal_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'tickets_sold', (SELECT COUNT(*) FROM public.bookings WHERE terminal_id = terminal_uuid AND DATE(booking_date) = CURRENT_DATE),
    'revenue', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE terminal_id = terminal_uuid AND DATE(payment_date) = CURRENT_DATE AND payment_status = 'COMPLETED'),
    'checked_in', (SELECT COUNT(*) FROM public.bookings WHERE terminal_id = terminal_uuid AND DATE(check_in_time) = CURRENT_DATE),
    'pending', (SELECT COUNT(*) FROM public.bookings WHERE terminal_id = terminal_uuid AND status = 'PENDING' AND DATE(booking_date) = CURRENT_DATE)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Insert Sample Terminals
-- =====================================================

INSERT INTO public.terminals (name, terminal_code, location, status)
VALUES 
  ('Main Terminal', 'TERM001', 'City Center', 'ACTIVE'),
  ('North Terminal', 'TERM002', 'North Station', 'ACTIVE'),
  ('South Terminal', 'TERM003', 'South Station', 'ACTIVE')
ON CONFLICT (terminal_code) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('terminals', 'ticket_alerts', 'daily_reconciliation')
ORDER BY table_name;

-- Check views created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('ticketing_dashboard_stats', 'trip_occupancy', 'payment_summary_today', 'passenger_manifest')
ORDER BY table_name;

-- Check triggers created
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_low_seat_alert'
ORDER BY trigger_name;

-- Test dashboard stats view
SELECT * FROM public.ticketing_dashboard_stats;

-- Test trip occupancy view
SELECT * FROM public.trip_occupancy LIMIT 5;

-- Test payment summary
SELECT * FROM public.payment_summary_today;

-- =====================================================
-- DONE! Ticketing Dashboard Setup Complete
-- =====================================================
-- This script integrates with existing COMPLETE_01-08 schema
-- Uses bookings table instead of tickets
-- Uses payment_status instead of status in payments
-- All views and functions align with existing schema
-- =====================================================
