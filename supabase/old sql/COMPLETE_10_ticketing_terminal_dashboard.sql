-- =====================================================
-- TICKETING TERMINAL DASHBOARD - Complete Implementation
-- Run after COMPLETE_01 through COMPLETE_09
-- =====================================================

-- =====================================================
-- 1. TERMINAL MANAGEMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id text UNIQUE NOT NULL, -- TRM-GBE-001
  terminal_name text NOT NULL,
  location text NOT NULL,
  office_id uuid, -- Link to booking office if needed
  assigned_agent_id uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  last_sync timestamptz DEFAULT now(),
  connection_status text DEFAULT 'ONLINE' CHECK (connection_status IN ('ONLINE', 'OFFLINE', 'SYNCING')),
  printer_status text DEFAULT 'READY' CHECK (printer_status IN ('READY', 'OFFLINE', 'ERROR', 'OUT_OF_PAPER')),
  cash_drawer_balance numeric(10,2) DEFAULT 0,
  session_start_time timestamptz,
  session_end_time timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminals_id ON public.terminals(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminals_active ON public.terminals(is_active);
CREATE INDEX IF NOT EXISTS idx_terminals_agent ON public.terminals(assigned_agent_id);

-- =====================================================
-- 2. TICKET ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ticket_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('LOW_SEATS', 'FULLY_BOOKED', 'DEPARTURE_SOON', 'DELAYED', 'CANCELLED')),
  severity text DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message text NOT NULL,
  seats_remaining int,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_alerts_trip ON public.ticket_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_type ON public.ticket_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_resolved ON public.ticket_alerts(is_resolved);

-- =====================================================
-- 3. DAILY RECONCILIATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid REFERENCES public.terminals(id),
  agent_id uuid REFERENCES auth.users(id),
  reconciliation_date date NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz,
  
  -- Expected totals
  expected_cash numeric(10,2) DEFAULT 0,
  expected_card numeric(10,2) DEFAULT 0,
  expected_mobile numeric(10,2) DEFAULT 0,
  expected_total numeric(10,2) DEFAULT 0,
  
  -- Actual totals
  actual_cash numeric(10,2) DEFAULT 0,
  actual_card numeric(10,2) DEFAULT 0,
  actual_mobile numeric(10,2) DEFAULT 0,
  actual_total numeric(10,2) DEFAULT 0,
  
  -- Variance
  cash_variance numeric(10,2) GENERATED ALWAYS AS (actual_cash - expected_cash) STORED,
  card_variance numeric(10,2) GENERATED ALWAYS AS (actual_card - expected_card) STORED,
  mobile_variance numeric(10,2) GENERATED ALWAYS AS (actual_mobile - expected_mobile) STORED,
  total_variance numeric(10,2) GENERATED ALWAYS AS (actual_total - expected_total) STORED,
  
  tickets_sold_count int DEFAULT 0,
  refunds_count int DEFAULT 0,
  refunds_total numeric(10,2) DEFAULT 0,
  
  notes text,
  is_reconciled boolean DEFAULT false,
  reconciled_by uuid REFERENCES auth.users(id),
  reconciled_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(terminal_id, reconciliation_date)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_terminal ON public.daily_reconciliation(terminal_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_agent ON public.daily_reconciliation(agent_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_date ON public.daily_reconciliation(reconciliation_date);

-- =====================================================
-- 4. DASHBOARD VIEWS
-- =====================================================

-- View: Ticketing Dashboard Stats (Today)
CREATE OR REPLACE VIEW ticketing_dashboard_stats AS
SELECT
  -- Tickets sold today
  COUNT(DISTINCT b.id) FILTER (WHERE DATE(b.booking_date) = CURRENT_DATE) as tickets_sold_today,
  
  -- Revenue today
  COALESCE(SUM(b.total_amount) FILTER (WHERE DATE(b.booking_date) = CURRENT_DATE), 0) as revenue_today,
  
  -- Trips available today
  COUNT(DISTINCT t.id) FILTER (
    WHERE DATE(t.scheduled_departure) = CURRENT_DATE 
    AND t.status IN ('SCHEDULED', 'BOARDING')
  ) as trips_available_today,
  
  -- Average occupancy rate today
  CASE 
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_departure) = CURRENT_DATE) > 0 
    THEN ROUND(
      (COUNT(b.id) FILTER (WHERE DATE(t.scheduled_departure) = CURRENT_DATE)::numeric / 
       NULLIF(SUM(t.total_seats) FILTER (WHERE DATE(t.scheduled_departure) = CURRENT_DATE), 0)) * 100, 
      2
    )
    ELSE 0
  END as occupancy_rate_today,
  
  -- Checked in today
  COUNT(b.id) FILTER (
    WHERE DATE(b.booking_date) = CURRENT_DATE 
    AND b.status = 'CHECKED_IN'
  ) as checked_in_today,
  
  -- Pending check-in
  COUNT(b.id) FILTER (
    WHERE DATE(b.booking_date) = CURRENT_DATE 
    AND b.status = 'CONFIRMED'
    AND b.payment_status = 'COMPLETED'
  ) as pending_checkin_today,
  
  -- No shows
  COUNT(b.id) FILTER (
    WHERE DATE(b.booking_date) = CURRENT_DATE 
    AND b.status = 'NO_SHOW'
  ) as no_shows_today,
  
  -- Payment breakdown
  COALESCE(SUM(p.amount) FILTER (
    WHERE DATE(p.payment_date) = CURRENT_DATE 
    AND p.payment_method = 'CASH'
    AND p.payment_status = 'COMPLETED'
  ), 0) as cash_today,
  
  COALESCE(SUM(p.amount) FILTER (
    WHERE DATE(p.payment_date) = CURRENT_DATE 
    AND p.payment_method = 'CARD'
    AND p.payment_status = 'COMPLETED'
  ), 0) as card_today,
  
  COALESCE(SUM(p.amount) FILTER (
    WHERE DATE(p.payment_date) = CURRENT_DATE 
    AND p.payment_method = 'MOBILE_MONEY'
    AND p.payment_status = 'COMPLETED'
  ), 0) as mobile_money_today

FROM public.trips t
LEFT JOIN public.bookings b ON t.id = b.trip_id
LEFT JOIN public.payments p ON b.id = p.booking_id;

-- View: Trip Occupancy (Today's trips with seat availability)
CREATE OR REPLACE VIEW trip_occupancy AS
SELECT
  t.id as trip_id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.scheduled_arrival,
  t.total_seats,
  t.available_seats,
  (t.total_seats - t.available_seats) as seats_sold,
  ROUND(((t.total_seats - t.available_seats)::numeric / NULLIF(t.total_seats, 0)) * 100, 2) as occupancy_percentage,
  t.status,
  b.registration_number as bus_number,
  d.full_name as driver_name,
  
  -- Seat status breakdown
  COUNT(bk.id) FILTER (WHERE bk.status = 'CONFIRMED') as confirmed_seats,
  COUNT(bk.id) FILTER (WHERE bk.status = 'CHECKED_IN') as checked_in_seats,
  COUNT(bk.id) FILTER (WHERE bk.status = 'PENDING') as pending_seats,
  
  -- Alert level
  CASE
    WHEN t.available_seats = 0 THEN 'FULL'
    WHEN t.available_seats <= 5 THEN 'LOW'
    WHEN t.available_seats <= 10 THEN 'MEDIUM'
    ELSE 'AVAILABLE'
  END as seat_alert_level

FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.buses b ON t.bus_id = b.id
LEFT JOIN public.profiles d ON t.driver_id = d.id
LEFT JOIN public.bookings bk ON t.id = bk.trip_id
WHERE DATE(t.scheduled_departure) = CURRENT_DATE
GROUP BY t.id, t.trip_number, r.name, r.origin, r.destination, 
         t.scheduled_departure, t.scheduled_arrival, t.total_seats, 
         t.available_seats, t.status, b.registration_number, d.full_name
ORDER BY t.scheduled_departure;

-- View: Payment Summary (Today)
CREATE OR REPLACE VIEW payment_summary_today AS
SELECT
  DATE(p.payment_date) as payment_date,
  p.payment_method,
  COUNT(p.id) as transaction_count,
  SUM(p.amount) as total_amount,
  AVG(p.amount) as average_amount,
  MIN(p.amount) as min_amount,
  MAX(p.amount) as max_amount,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'COMPLETED') as completed_count,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'PENDING') as pending_count,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'FAILED') as failed_count,
  SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED') as completed_amount
FROM public.payments p
WHERE DATE(p.payment_date) = CURRENT_DATE
GROUP BY DATE(p.payment_date), p.payment_method;

-- View: Passenger Manifest (For specific trip)
CREATE OR REPLACE VIEW passenger_manifest AS
SELECT
  b.id as booking_id,
  b.booking_reference,
  b.seat_number,
  b.passenger_name,
  b.passenger_phone,
  b.passenger_email,
  b.passenger_id_number,
  b.total_amount,
  b.status as booking_status,
  b.payment_status,
  b.payment_method,
  b.check_in_time,
  b.luggage_count,
  b.special_requests,
  
  -- Trip details
  t.id as trip_id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.scheduled_arrival,
  
  -- Agent info
  agent.full_name as booked_by_agent,
  
  -- Check-in status
  CASE
    WHEN b.status = 'CHECKED_IN' THEN 'Checked In'
    WHEN b.status = 'CONFIRMED' AND b.payment_status = 'COMPLETED' THEN 'Pending Check-In'
    WHEN b.status = 'NO_SHOW' THEN 'No Show'
    WHEN b.status = 'CANCELLED' THEN 'Cancelled'
    ELSE 'Pending Payment'
  END as checkin_status_label

FROM public.bookings b
JOIN public.trips t ON b.trip_id = t.id
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.profiles agent ON b.booked_by = agent.id
ORDER BY b.seat_number;

-- =====================================================
-- 5. FUNCTIONS FOR DASHBOARD OPERATIONS
-- =====================================================

-- Function: Get tickets sold today
CREATE OR REPLACE FUNCTION get_tickets_sold_today()
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.bookings
    WHERE DATE(booking_date) = CURRENT_DATE
    AND status != 'CANCELLED'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get revenue today
CREATE OR REPLACE FUNCTION get_revenue_today()
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.payments
    WHERE DATE(payment_date) = CURRENT_DATE
    AND payment_status = 'COMPLETED'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get trips available today
CREATE OR REPLACE FUNCTION get_trips_available_today()
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.trips
    WHERE DATE(scheduled_departure) = CURRENT_DATE
    AND status IN ('SCHEDULED', 'BOARDING')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate occupancy rate for a trip
CREATE OR REPLACE FUNCTION calculate_trip_occupancy(trip_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_seats int;
  available_seats int;
  occupancy numeric;
BEGIN
  SELECT t.total_seats, t.available_seats
  INTO total_seats, available_seats
  FROM public.trips t
  WHERE t.id = trip_uuid;
  
  IF total_seats IS NULL OR total_seats = 0 THEN
    RETURN 0;
  END IF;
  
  occupancy := ((total_seats - available_seats)::numeric / total_seats) * 100;
  RETURN ROUND(occupancy, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check-in passenger
CREATE OR REPLACE FUNCTION checkin_passenger(
  p_booking_id uuid,
  p_checked_in_by uuid
)
RETURNS jsonb AS $$
DECLARE
  v_booking record;
  v_result jsonb;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;
  
  -- Validate booking exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- Validate payment completed
  IF v_booking.payment_status != 'COMPLETED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not completed'
    );
  END IF;
  
  -- Validate not already checked in
  IF v_booking.status = 'CHECKED_IN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already checked in',
      'check_in_time', v_booking.check_in_time
    );
  END IF;
  
  -- Validate not cancelled
  IF v_booking.status = 'CANCELLED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking is cancelled'
    );
  END IF;
  
  -- Update booking status
  UPDATE public.bookings
  SET 
    status = 'CHECKED_IN',
    check_in_time = now(),
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_checked_in_by,
    'Passenger Checked In',
    format('Passenger %s checked in for seat %s', v_booking.passenger_name, v_booking.seat_number),
    'SUCCESS'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'booking_reference', v_booking.booking_reference,
    'passenger_name', v_booking.passenger_name,
    'seat_number', v_booking.seat_number,
    'check_in_time', now()
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text AS $$
DECLARE
  v_date text;
  v_sequence int;
  v_reference text;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(booking_reference FROM 10) AS int)
  ), 0) + 1
  INTO v_sequence
  FROM public.bookings
  WHERE booking_reference LIKE 'BK' || v_date || '%';
  
  v_reference := 'BK' || v_date || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger: Auto-generate booking reference
CREATE OR REPLACE FUNCTION auto_generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_booking_reference ON public.bookings;
CREATE TRIGGER trigger_auto_booking_reference
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_booking_reference();

-- Trigger: Update trip available seats on booking
CREATE OR REPLACE FUNCTION update_trip_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease available seats
    UPDATE public.trips
    SET available_seats = available_seats - 1,
        updated_at = now()
    WHERE id = NEW.trip_id
    AND available_seats > 0;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed to CANCELLED, increase available seats
    IF OLD.status != 'CANCELLED' AND NEW.status = 'CANCELLED' THEN
      UPDATE public.trips
      SET available_seats = available_seats + 1,
          updated_at = now()
      WHERE id = NEW.trip_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Increase available seats
    UPDATE public.trips
    SET available_seats = available_seats + 1,
        updated_at = now()
    WHERE id = OLD.trip_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trip_seats ON public.bookings;
CREATE TRIGGER trigger_update_trip_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_seats_on_booking();

-- Trigger: Create low seat alerts
CREATE OR REPLACE FUNCTION create_low_seat_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create alert if seats drop below 10
  IF NEW.available_seats <= 10 AND NEW.available_seats > 0 THEN
    INSERT INTO public.ticket_alerts (
      trip_id,
      alert_type,
      severity,
      message,
      seats_remaining
    ) VALUES (
      NEW.id,
      'LOW_SEATS',
      CASE 
        WHEN NEW.available_seats <= 5 THEN 'CRITICAL'
        ELSE 'WARNING'
      END,
      format('Only %s seats remaining for trip %s', NEW.available_seats, NEW.trip_number),
      NEW.available_seats
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Create fully booked alert
  IF NEW.available_seats = 0 THEN
    INSERT INTO public.ticket_alerts (
      trip_id,
      alert_type,
      severity,
      message,
      seats_remaining
    ) VALUES (
      NEW.id,
      'FULLY_BOOKED',
      'INFO',
      format('Trip %s is now fully booked', NEW.trip_number),
      0
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_low_seat_alert ON public.trips;
CREATE TRIGGER trigger_low_seat_alert
  AFTER UPDATE OF available_seats ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION create_low_seat_alert();

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant access to ticketing agents
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.trips TO authenticated;
GRANT SELECT ON public.routes TO authenticated;
GRANT SELECT ON public.terminals TO authenticated;
GRANT SELECT ON public.ticket_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_reconciliation TO authenticated;

-- Grant access to views
GRANT SELECT ON ticketing_dashboard_stats TO authenticated;
GRANT SELECT ON trip_occupancy TO authenticated;
GRANT SELECT ON payment_summary_today TO authenticated;
GRANT SELECT ON passenger_manifest TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_tickets_sold_today() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_today() TO authenticated;
GRANT EXECUTE ON FUNCTION get_trips_available_today() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trip_occupancy(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION checkin_passenger(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_booking_reference() TO authenticated;

COMMENT ON TABLE public.terminals IS 'Terminal/POS management for ticketing agents';
COMMENT ON TABLE public.ticket_alerts IS 'Real-time alerts for low seats, delays, etc.';
COMMENT ON TABLE public.daily_reconciliation IS 'End-of-day cash reconciliation for terminals';
COMMENT ON VIEW ticketing_dashboard_stats IS 'Real-time dashboard statistics for ticketing';
COMMENT ON VIEW trip_occupancy IS 'Current seat availability and occupancy for all trips';
COMMENT ON VIEW payment_summary_today IS 'Payment breakdown by method for today';
COMMENT ON VIEW passenger_manifest IS 'Complete passenger list for trips';
