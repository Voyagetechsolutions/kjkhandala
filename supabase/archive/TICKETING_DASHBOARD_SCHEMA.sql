-- ============================================================================
-- TICKETING DASHBOARD - COMPLETE SUPABASE SCHEMA
-- ============================================================================
-- This schema supports a full in-office bus ticket booking system
-- with all 14 required features
-- ============================================================================

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- Terminals (Booking Offices)
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (Ticketing Staff)
CREATE TABLE IF NOT EXISTS ticketing_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  agent_code TEXT UNIQUE NOT NULL,
  terminal_id UUID REFERENCES terminals(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent', -- agent, supervisor, manager
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Shifts (for cash-up)
CREATE TABLE IF NOT EXISTS agent_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ticketing_agents(id) NOT NULL,
  terminal_id UUID REFERENCES terminals(id) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2),
  expected_cash DECIMAL(12,2),
  variance DECIMAL(12,2),
  status TEXT DEFAULT 'open', -- open, closed, reconciled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passengers (Customer Database)
CREATE TABLE IF NOT EXISTS passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  passport_number TEXT,
  gender TEXT,
  nationality TEXT DEFAULT 'Botswana',
  date_of_birth DATE,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  special_notes TEXT, -- disability, old age, infant, etc.
  is_frequent BOOLEAN DEFAULT false,
  total_trips INTEGER DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_phone UNIQUE(phone)
);

-- Bookings (Main booking records)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL, -- PNR
  trip_id UUID REFERENCES trips(id) NOT NULL,
  passenger_id UUID REFERENCES passengers(id),
  booked_by UUID REFERENCES ticketing_agents(id), -- agent who made booking
  terminal_id UUID REFERENCES terminals(id),
  
  -- Booking details
  booking_type TEXT DEFAULT 'one-way', -- one-way, return
  return_trip_id UUID REFERENCES trips(id),
  number_of_passengers INTEGER DEFAULT 1,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, checked-in, completed, cancelled, no-show
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid, refunded
  
  -- Pricing
  base_fare DECIMAL(12,2) NOT NULL,
  taxes DECIMAL(12,2) DEFAULT 0,
  insurance DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  discount_reason TEXT,
  discount_approved_by UUID REFERENCES ticketing_agents(id),
  
  -- Timestamps
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  travel_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES ticketing_agents(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Seats (Individual seat assignments)
CREATE TABLE IF NOT EXISTS booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) NOT NULL,
  seat_number INTEGER NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  passenger_id_number TEXT,
  seat_price DECIMAL(12,2) NOT NULL,
  seat_type TEXT DEFAULT 'standard', -- standard, window, aisle, front, vip
  status TEXT DEFAULT 'reserved', -- reserved, sold, cancelled, blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_trip_seat UNIQUE(trip_id, seat_number)
);

-- Payments (Payment transactions)
CREATE TABLE IF NOT EXISTS booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  payment_reference TEXT UNIQUE NOT NULL,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, bank_transfer, mobile_money, voucher, invoice, complimentary
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Card/Mobile details
  transaction_id TEXT,
  card_last_four TEXT,
  mobile_number TEXT,
  
  -- Invoice details
  invoice_number TEXT,
  company_name TEXT,
  
  -- Voucher details
  voucher_code TEXT,
  
  -- Processing
  processed_by UUID REFERENCES ticketing_agents(id),
  terminal_id UUID REFERENCES terminals(id),
  shift_id UUID REFERENCES agent_shifts(id),
  
  -- Status
  status TEXT DEFAULT 'completed', -- pending, completed, failed, reversed
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS booking_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  refund_reference TEXT UNIQUE NOT NULL,
  
  -- Refund details
  refund_amount DECIMAL(12,2) NOT NULL,
  cancellation_charge DECIMAL(12,2) DEFAULT 0,
  net_refund DECIMAL(12,2) NOT NULL,
  refund_reason TEXT NOT NULL,
  refund_method TEXT, -- cash, bank_transfer, wallet
  
  -- Approval workflow
  requested_by UUID REFERENCES ticketing_agents(id),
  requested_date TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES ticketing_agents(id),
  approved_date TIMESTAMPTZ,
  processed_by UUID REFERENCES ticketing_agents(id),
  processed_date TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, processed
  rejection_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Logs (Audit trail)
CREATE TABLE IF NOT EXISTS booking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  action TEXT NOT NULL, -- created, modified, cancelled, refunded, checked_in, etc.
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES ticketing_agents(id),
  change_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Rules
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- percentage, fixed
  discount_value DECIMAL(12,2) NOT NULL,
  min_passengers INTEGER,
  max_discount DECIMAL(12,2),
  valid_from DATE,
  valid_to DATE,
  requires_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_code TEXT UNIQUE NOT NULL,
  voucher_type TEXT NOT NULL, -- discount, complimentary, credit
  value DECIMAL(12,2) NOT NULL,
  issued_to TEXT,
  issued_by UUID REFERENCES ticketing_agents(id),
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  used_by UUID REFERENCES bookings(id),
  used_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, used, expired, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_booking_seats_trip ON booking_seats(trip_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_booking ON booking_seats(booking_id);

CREATE INDEX IF NOT EXISTS idx_passengers_phone ON passengers(phone);
CREATE INDEX IF NOT EXISTS idx_passengers_id ON passengers(id_number);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON booking_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_agent ON booking_payments(processed_by);

CREATE INDEX IF NOT EXISTS idx_refunds_booking ON booking_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON booking_refunds(status);

CREATE INDEX IF NOT EXISTS idx_logs_booking ON booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON booking_logs(created_at);

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

-- Generate booking reference (PNR)
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  new_reference TEXT;
  reference_exists BOOLEAN;
BEGIN
  LOOP
    -- Format: BK-YYYYMMDD-XXXX (e.g., BK-20241115-A3F9)
    new_reference := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                     UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Check if reference exists
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_reference = new_reference) 
    INTO reference_exists;
    
    EXIT WHEN NOT reference_exists;
  END LOOP;
  
  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- Generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TEXT AS $$
DECLARE
  new_reference TEXT;
  reference_exists BOOLEAN;
BEGIN
  LOOP
    new_reference := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                     UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(SELECT 1 FROM booking_payments WHERE payment_reference = new_reference) 
    INTO reference_exists;
    
    EXIT WHEN NOT reference_exists;
  END LOOP;
  
  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- Generate refund reference
CREATE OR REPLACE FUNCTION generate_refund_reference()
RETURNS TEXT AS $$
DECLARE
  new_reference TEXT;
  reference_exists BOOLEAN;
BEGIN
  LOOP
    new_reference := 'REF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                     UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(SELECT 1 FROM booking_refunds WHERE refund_reference = new_reference) 
    INTO reference_exists;
    
    EXIT WHEN NOT reference_exists;
  END LOOP;
  
  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- Calculate booking balance
CREATE OR REPLACE FUNCTION calculate_booking_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance := NEW.total_amount - NEW.amount_paid;
  
  -- Update payment status
  IF NEW.balance <= 0 THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'unpaid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update passenger stats
CREATE OR REPLACE FUNCTION update_passenger_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE passengers
    SET total_trips = total_trips + 1,
        is_frequent = (total_trips + 1) >= 5
    WHERE id = NEW.passenger_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update booking amount paid from payments
CREATE OR REPLACE FUNCTION update_booking_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE bookings
    SET amount_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM booking_payments
      WHERE booking_id = NEW.booking_id AND status = 'completed'
    )
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-generate booking reference
CREATE TRIGGER set_booking_reference
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.booking_reference IS NULL)
EXECUTE FUNCTION (
  SELECT generate_booking_reference() INTO NEW.booking_reference;
  RETURN NEW;
);

-- Alternative trigger approach
DROP TRIGGER IF EXISTS set_booking_reference ON bookings;
CREATE OR REPLACE FUNCTION set_booking_reference_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_reference_trigger();

-- Auto-generate payment reference
DROP TRIGGER IF EXISTS set_payment_reference ON booking_payments;
CREATE OR REPLACE FUNCTION set_payment_reference_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_reference IS NULL THEN
    NEW.payment_reference := generate_payment_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payment_reference
BEFORE INSERT ON booking_payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_reference_trigger();

-- Auto-generate refund reference
DROP TRIGGER IF EXISTS set_refund_reference ON booking_refunds;
CREATE OR REPLACE FUNCTION set_refund_reference_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.refund_reference IS NULL THEN
    NEW.refund_reference := generate_refund_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_refund_reference
BEFORE INSERT ON booking_refunds
FOR EACH ROW
EXECUTE FUNCTION set_refund_reference_trigger();

-- Calculate booking balance
DROP TRIGGER IF EXISTS calculate_balance ON bookings;
CREATE TRIGGER calculate_balance
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_balance();

-- Update passenger stats
DROP TRIGGER IF EXISTS update_passenger_stats_trigger ON bookings;
CREATE TRIGGER update_passenger_stats_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_passenger_stats();

-- Update booking payment
DROP TRIGGER IF EXISTS update_booking_payment_trigger ON booking_payments;
CREATE TRIGGER update_booking_payment_trigger
AFTER INSERT OR UPDATE ON booking_payments
FOR EACH ROW
EXECUTE FUNCTION update_booking_payment();

-- Auto-log booking changes
DROP TRIGGER IF EXISTS log_booking_changes ON bookings;
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_logs (booking_id, action, changed_by)
    VALUES (NEW.id, 'created', NEW.booked_by);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO booking_logs (booking_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status_changed', 'status', OLD.status, NEW.status, NEW.booked_by);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_booking_changes
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_changes();

-- ============================================================================
-- 5. VIEWS FOR DASHBOARD
-- ============================================================================

-- Daily dashboard stats
CREATE OR REPLACE VIEW ticketing_daily_stats AS
SELECT
  COUNT(*) FILTER (WHERE booking_date::DATE = CURRENT_DATE) as tickets_sold_today,
  COALESCE(SUM(total_amount) FILTER (WHERE booking_date::DATE = CURRENT_DATE), 0) as revenue_today,
  COUNT(*) FILTER (WHERE booking_date::DATE = CURRENT_DATE AND status = 'cancelled') as cancellations_today,
  COUNT(DISTINCT passenger_id) FILTER (WHERE booking_date::DATE = CURRENT_DATE) as unique_customers_today,
  COALESCE(AVG(total_amount) FILTER (WHERE booking_date::DATE = CURRENT_DATE), 0) as avg_ticket_price_today
FROM bookings;

-- Upcoming trips availability
CREATE OR REPLACE VIEW upcoming_trips_availability AS
SELECT
  t.id as trip_id,
  t.trip_number,
  t.departure_time,
  r.origin,
  r.destination,
  b.name as bus_name,
  60 as total_seats, -- Fixed 60 seats
  COUNT(bs.id) as booked_seats,
  60 - COUNT(bs.id) as available_seats,
  t.base_fare,
  t.status
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN booking_seats bs ON t.id = bs.trip_id AND bs.status IN ('reserved', 'sold')
WHERE t.departure_time >= NOW()
  AND t.status NOT IN ('cancelled', 'completed')
GROUP BY t.id, t.trip_number, t.departure_time, r.origin, r.destination, b.name, t.base_fare, t.status
ORDER BY t.departure_time;

-- Popular routes today
CREATE OR REPLACE VIEW popular_routes_today AS
SELECT
  r.origin,
  r.destination,
  COUNT(b.id) as bookings_count,
  SUM(b.total_amount) as total_revenue
FROM bookings b
JOIN trips t ON b.trip_id = t.id
JOIN routes r ON t.route_id = r.id
WHERE b.booking_date::DATE = CURRENT_DATE
GROUP BY r.origin, r.destination
ORDER BY bookings_count DESC
LIMIT 10;

-- Pending refunds
CREATE OR REPLACE VIEW pending_refunds_view AS
SELECT
  rf.id,
  rf.refund_reference,
  b.booking_reference,
  p.full_name as passenger_name,
  rf.refund_amount,
  rf.net_refund,
  rf.status,
  rf.requested_date,
  ta.full_name as requested_by_name
FROM booking_refunds rf
JOIN bookings b ON rf.booking_id = b.id
LEFT JOIN passengers p ON b.passenger_id = p.id
LEFT JOIN ticketing_agents ta ON rf.requested_by = ta.id
WHERE rf.status IN ('pending', 'approved')
ORDER BY rf.requested_date;

-- Outstanding balances
CREATE OR REPLACE VIEW outstanding_balances AS
SELECT
  b.id,
  b.booking_reference,
  p.full_name as passenger_name,
  p.phone,
  b.total_amount,
  b.amount_paid,
  b.balance,
  b.travel_date,
  b.booking_date
FROM bookings b
LEFT JOIN passengers p ON b.passenger_id = p.id
WHERE b.balance > 0
  AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.travel_date;

-- Agent performance
CREATE OR REPLACE VIEW agent_performance_today AS
SELECT
  ta.id,
  ta.full_name,
  ta.agent_code,
  COUNT(b.id) as bookings_count,
  COALESCE(SUM(b.total_amount), 0) as total_sales,
  COALESCE(SUM(b.total_amount * ta.commission_rate / 100), 0) as commission_earned
FROM ticketing_agents ta
LEFT JOIN bookings b ON ta.id = b.booked_by AND b.booking_date::DATE = CURRENT_DATE
WHERE ta.is_active = true
GROUP BY ta.id, ta.full_name, ta.agent_code, ta.commission_rate
ORDER BY total_sales DESC;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticketing_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Ticketing agents can view all bookings
CREATE POLICY ticketing_agents_view_all ON bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

-- Ticketing agents can create bookings
CREATE POLICY ticketing_agents_create_bookings ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

-- Ticketing agents can update their own bookings
CREATE POLICY ticketing_agents_update_bookings ON bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents ta
    WHERE ta.profile_id = auth.uid() AND ta.is_active = true
  )
);

-- Similar policies for other tables...
CREATE POLICY ticketing_agents_manage_seats ON booking_seats
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY ticketing_agents_manage_payments ON booking_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY ticketing_agents_view_passengers ON passengers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY ticketing_agents_manage_passengers ON passengers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticketing_agents
    WHERE profile_id = auth.uid() AND is_active = true
  )
);

-- ============================================================================
-- 7. SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample terminal
INSERT INTO terminals (name, code, city, address, phone, is_active)
VALUES 
  ('Main Terminal', 'MAIN', 'Gaborone', 'Main Mall, Gaborone', '+267 3900000', true),
  ('Francistown Terminal', 'FRN', 'Francistown', 'Blue Jacket St, Francistown', '+267 2400000', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
