-- =====================================================
-- TICKETING DASHBOARD - DATABASE SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor to set up
-- the complete ticketing dashboard with real-time data
-- =====================================================

-- Step 1: Create Core Tables
-- =====================================================

-- Terminals table (create first - referenced by other tables)
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  terminal_code TEXT UNIQUE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table (bookings)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone_number TEXT,
  email TEXT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_number TEXT,
  fare NUMERIC NOT NULL,
  status TEXT DEFAULT 'booked', -- booked, checked_in, cancelled, no_show
  payment_status TEXT DEFAULT 'unpaid', -- paid, unpaid, refunded
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  terminal_id UUID REFERENCES terminals(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL, -- cash, card, mobile_money, bank_transfer
  reference_number TEXT,
  status TEXT DEFAULT 'completed', -- completed, pending, failed, refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  terminal_id UUID REFERENCES terminals(id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS ticket_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- low_seats, overbooked, delayed
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconciliation table
CREATE TABLE IF NOT EXISTS daily_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id UUID REFERENCES terminals(id),
  reconciliation_date DATE NOT NULL,
  expected_cash NUMERIC,
  actual_cash NUMERIC,
  variance NUMERIC,
  notes TEXT,
  reconciled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(terminal_id, reconciliation_date)
);

-- Step 2: Enable Row Level Security
-- =====================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reconciliation ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
-- =====================================================

-- Tickets policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tickets;
CREATE POLICY "Allow all for authenticated users" ON tickets FOR ALL TO authenticated USING (true);

-- Payments policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payments;
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL TO authenticated USING (true);

-- Terminals policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON terminals;
CREATE POLICY "Allow all for authenticated users" ON terminals FOR ALL TO authenticated USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON ticket_alerts;
CREATE POLICY "Allow all for authenticated users" ON ticket_alerts FOR ALL TO authenticated USING (true);

-- Reconciliation policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_reconciliation;
CREATE POLICY "Allow all for authenticated users" ON daily_reconciliation FOR ALL TO authenticated USING (true);

-- Step 4: Create Triggers & Functions
-- =====================================================

-- Auto-generate ticket number
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  ticket_prefix TEXT;
  ticket_num TEXT;
BEGIN
  IF NEW.ticket_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  ticket_prefix := 'TKT' || TO_CHAR(NOW(), 'YYYYMMDD');
  ticket_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  NEW.ticket_number := ticket_prefix || '-' || ticket_num;
  
  WHILE EXISTS (SELECT 1 FROM tickets WHERE ticket_number = NEW.ticket_number) LOOP
    ticket_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    NEW.ticket_number := ticket_prefix || '-' || ticket_num;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Update available seats when ticket is sold/cancelled
DROP TRIGGER IF EXISTS trigger_update_trip_seats ON tickets;
DROP FUNCTION IF EXISTS update_trip_seats() CASCADE;

CREATE OR REPLACE FUNCTION update_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    -- Decrease available seats
    UPDATE trips 
    SET available_seats = available_seats - 1
    WHERE id = NEW.trip_id AND available_seats > 0;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
      -- Increase available seats
      UPDATE trips 
      SET available_seats = available_seats + 1
      WHERE id = NEW.trip_id;
    ELSIF OLD.status = 'cancelled' AND NEW.status = 'booked' THEN
      -- Decrease available seats
      UPDATE trips 
      SET available_seats = available_seats - 1
      WHERE id = NEW.trip_id AND available_seats > 0;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Increase available seats
    UPDATE trips 
    SET available_seats = available_seats + 1
    WHERE id = OLD.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trip_seats
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_trip_seats();

-- Create low seat alerts
DROP TRIGGER IF EXISTS trigger_create_low_seat_alert ON trips;
DROP FUNCTION IF EXISTS create_low_seat_alert() CASCADE;

CREATE OR REPLACE FUNCTION create_low_seat_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_seats <= 5 AND NEW.available_seats > 0 THEN
    INSERT INTO ticket_alerts (trip_id, alert_type, message, severity)
    VALUES (
      NEW.id,
      'low_seats',
      'Trip ' || COALESCE(NEW.trip_number, NEW.id::TEXT) || ' has only ' || NEW.available_seats || ' seats remaining',
      CASE 
        WHEN NEW.available_seats <= 2 THEN 'high'
        WHEN NEW.available_seats <= 5 THEN 'medium'
        ELSE 'low'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_low_seat_alert
AFTER UPDATE ON trips
FOR EACH ROW
WHEN (OLD.available_seats IS DISTINCT FROM NEW.available_seats)
EXECUTE FUNCTION create_low_seat_alert();

-- Step 5: Create Dashboard Views
-- =====================================================

-- Ticketing Dashboard Stats
DROP VIEW IF EXISTS ticketing_dashboard_stats CASCADE;
CREATE OR REPLACE VIEW ticketing_dashboard_stats AS
SELECT
  -- Today's metrics
  (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE) as tickets_sold_today,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as revenue_today,
  (SELECT COUNT(*) FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE AND status IN ('SCHEDULED', 'BOARDING')) as trips_available_today,
  (SELECT COUNT(*) FROM tickets WHERE status = 'checked_in' AND DATE(checked_in_at) = CURRENT_DATE) as passengers_checked_in_today,
  
  -- Overall metrics
  (SELECT COALESCE(AVG((total_seats - available_seats)::NUMERIC / NULLIF(total_seats, 0) * 100), 0) 
   FROM trips 
   WHERE DATE(scheduled_departure) = CURRENT_DATE) as avg_occupancy_rate,
  
  (SELECT COUNT(*) FROM ticket_alerts WHERE is_read = false) as unread_alerts;

-- Trip Occupancy View
DROP VIEW IF EXISTS trip_occupancy CASCADE;
CREATE OR REPLACE VIEW trip_occupancy AS
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
  ROUND(((t.total_seats - t.available_seats)::NUMERIC / NULLIF(t.total_seats, 0) * 100), 2) as occupancy_percentage,
  t.status,
  b.name as bus_name,
  d.full_name as driver_name
FROM trips t
JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE DATE(t.scheduled_departure) = CURRENT_DATE
ORDER BY t.scheduled_departure;

-- Payment Summary View
DROP VIEW IF EXISTS payment_summary_today CASCADE;
CREATE OR REPLACE VIEW payment_summary_today AS
SELECT
  method,
  COUNT(*) as transaction_count,
  COALESCE(SUM(amount), 0) as total_amount
FROM payments
WHERE DATE(created_at) = CURRENT_DATE
  AND status = 'completed'
GROUP BY method;

-- Passenger Manifest View
DROP VIEW IF EXISTS passenger_manifest CASCADE;
CREATE OR REPLACE VIEW passenger_manifest AS
SELECT
  tk.id as ticket_id,
  tk.ticket_number,
  tk.passenger_name,
  tk.phone_number,
  tk.seat_number,
  tk.status,
  tk.payment_status,
  tk.checked_in_at,
  t.id as trip_id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.scheduled_arrival,
  b.name as bus_name
FROM tickets tk
JOIN trips t ON tk.trip_id = t.id
JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
ORDER BY t.scheduled_departure, tk.seat_number;

-- Step 6: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_trip_id ON tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_ticket_id ON payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_is_read ON ticket_alerts(is_read);

-- Step 7: Insert Sample Terminal (Optional)
-- =====================================================

INSERT INTO terminals (name, terminal_code, location, status)
VALUES 
  ('Main Terminal', 'TERM001', 'City Center', 'active'),
  ('North Terminal', 'TERM002', 'North Station', 'active')
ON CONFLICT (terminal_code) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tickets', 'payments', 'terminals', 'ticket_alerts', 'daily_reconciliation')
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
WHERE trigger_name IN ('trigger_generate_ticket_number', 'trigger_update_trip_seats', 'trigger_create_low_seat_alert')
ORDER BY trigger_name;

-- Test dashboard stats view
SELECT * FROM ticketing_dashboard_stats;

-- =====================================================
-- DONE! Ticketing Dashboard Database Setup Complete
-- =====================================================
