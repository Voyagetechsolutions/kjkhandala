-- ============================================================================
-- PRODUCTION SCHEMA PART 3: TICKETING TABLES
-- Bookings, Payments, Terminals
-- ============================================================================

-- Terminals
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  booking_reference TEXT UNIQUE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_email TEXT,
  seat_number TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  booking_status booking_status DEFAULT 'pending',
  booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (trip_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_reference TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_company_date ON payments(company_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- Ticket Alerts
CREATE TABLE IF NOT EXISTS ticket_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund Requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  route TEXT,
  travel_date DATE,
  ticket_amount NUMERIC(10, 2) NOT NULL,
  refund_percentage INTEGER NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  refund_amount NUMERIC(10, 2) NOT NULL,
  penalty_amount NUMERIC(10, 2) DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refunds_booking ON refund_requests(booking_id);
