-- =====================================================
-- HELPER FUNCTIONS & VIEWS - Dashboard Support
-- Run AFTER COMPLETE_06_rls_policies.sql
-- =====================================================

-- =====================================================
-- 1. DASHBOARD KPI FUNCTIONS
-- =====================================================

-- Operations Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_operations_dashboard_stats(date_param date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'trips_summary', jsonb_build_object(
      'total_trips', COUNT(DISTINCT t.id),
      'active_trips', COUNT(DISTINCT CASE WHEN t.status IN ('BOARDING', 'DEPARTED', 'IN_PROGRESS') THEN t.id END),
      'completed_trips', COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.id END),
      'cancelled_trips', COUNT(DISTINCT CASE WHEN t.status = 'CANCELLED' THEN t.id END),
      'delayed_trips', COUNT(DISTINCT CASE WHEN t.status = 'DELAYED' THEN t.id END)
    ),
    'fleet_status', jsonb_build_object(
      'total_buses', (SELECT COUNT(*) FROM public.buses),
      'active_buses', (SELECT COUNT(*) FROM public.buses WHERE status = 'ACTIVE'),
      'maintenance_buses', (SELECT COUNT(*) FROM public.buses WHERE status = 'MAINTENANCE'),
      'out_of_service', (SELECT COUNT(*) FROM public.buses WHERE status = 'OUT_OF_SERVICE')
    ),
    'driver_status', jsonb_build_object(
      'total_drivers', (SELECT COUNT(*) FROM public.drivers),
      'active_drivers', (SELECT COUNT(*) FROM public.drivers WHERE status = 'ACTIVE'),
      'on_leave', (SELECT COUNT(*) FROM public.drivers WHERE status = 'ON_LEAVE')
    ),
    'revenue_snapshot', jsonb_build_object(
      'today_revenue', COALESCE(SUM(CASE WHEN b.payment_status = 'COMPLETED' AND DATE(b.booking_date) = date_param THEN b.total_amount ELSE 0 END), 0),
      'today_bookings', COUNT(DISTINCT CASE WHEN DATE(b.booking_date) = date_param THEN b.id END)
    )
  ) INTO result
  FROM public.trips t
  LEFT JOIN public.bookings b ON t.id = b.trip_id
  WHERE DATE(t.scheduled_departure) = date_param;
  
  RETURN result;
END;
$$;

-- Finance Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_finance_dashboard_stats(
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'revenue', jsonb_build_object(
      'total', COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END), 0),
      'cash', COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method = 'CASH' THEN total_amount ELSE 0 END), 0),
      'card', COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method = 'CARD' THEN total_amount ELSE 0 END), 0),
      'mobile_money', COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_method = 'MOBILE_MONEY' THEN total_amount ELSE 0 END), 0),
      'bookings_count', COUNT(DISTINCT CASE WHEN payment_status = 'COMPLETED' THEN id END)
    ),
    'expenses', jsonb_build_object(
      'total', COALESCE((SELECT SUM(amount) FROM public.expenses WHERE date BETWEEN start_date AND end_date AND status = 'PAID'), 0),
      'fuel', COALESCE((SELECT SUM(amount) FROM public.expenses WHERE date BETWEEN start_date AND end_date AND status = 'PAID' AND category = 'FUEL'), 0),
      'maintenance', COALESCE((SELECT SUM(amount) FROM public.expenses WHERE date BETWEEN start_date AND end_date AND status = 'PAID' AND category = 'MAINTENANCE'), 0),
      'salaries', COALESCE((SELECT SUM(amount) FROM public.expenses WHERE date BETWEEN start_date AND end_date AND status = 'PAID' AND category = 'SALARIES'), 0)
    ),
    'refunds', jsonb_build_object(
      'total', COALESCE((SELECT SUM(net_refund) FROM public.refunds WHERE DATE(requested_at) BETWEEN start_date AND end_date AND status = 'PROCESSED'), 0),
      'count', COALESCE((SELECT COUNT(*) FROM public.refunds WHERE DATE(requested_at) BETWEEN start_date AND end_date), 0),
      'pending', COALESCE((SELECT COUNT(*) FROM public.refunds WHERE status = 'PENDING'), 0)
    ),
    'invoices', jsonb_build_object(
      'overdue', COALESCE((SELECT COUNT(*) FROM public.invoices WHERE due_date < CURRENT_DATE AND status != 'PAID'), 0),
      'pending', COALESCE((SELECT COUNT(*) FROM public.invoices WHERE status = 'SENT'), 0)
    )
  ) INTO result
  FROM public.bookings
  WHERE DATE(booking_date) BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$;

-- HR Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_hr_dashboard_stats(date_param date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'employees', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
      'drivers', (SELECT COUNT(*) FROM public.drivers WHERE status = 'ACTIVE'),
      'staff', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true) - (SELECT COUNT(*) FROM public.drivers WHERE status = 'ACTIVE')
    ),
    'attendance', jsonb_build_object(
      'present', (SELECT COUNT(*) FROM public.attendance WHERE date = date_param AND status = 'PRESENT'),
      'absent', (SELECT COUNT(*) FROM public.attendance WHERE date = date_param AND status = 'ABSENT'),
      'late', (SELECT COUNT(*) FROM public.attendance WHERE date = date_param AND status = 'LATE'),
      'on_leave', (SELECT COUNT(*) FROM public.attendance WHERE date = date_param AND status = 'ON_LEAVE')
    ),
    'leave_requests', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM public.leave_requests WHERE status = 'PENDING'),
      'approved_this_month', (SELECT COUNT(*) FROM public.leave_requests WHERE status = 'APPROVED' AND DATE_TRUNC('month', start_date) = DATE_TRUNC('month', date_param))
    ),
    'certifications', jsonb_build_object(
      'expiring_soon', (SELECT COUNT(*) FROM public.certifications WHERE status = 'ACTIVE' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'),
      'expired', (SELECT COUNT(*) FROM public.certifications WHERE status = 'EXPIRED')
    ),
    'payroll', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM public.payroll WHERE status = 'PENDING'),
      'current_month', (SELECT COUNT(*) FROM public.payroll WHERE month = TO_CHAR(date_param, 'YYYY-MM'))
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Maintenance Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_maintenance_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'work_orders', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM public.work_orders WHERE status = 'PENDING'),
      'in_progress', (SELECT COUNT(*) FROM public.work_orders WHERE status = 'IN_PROGRESS'),
      'overdue', (SELECT COUNT(*) FROM public.work_orders WHERE status NOT IN ('COMPLETED', 'CANCELLED') AND due_date < CURRENT_DATE)
    ),
    'inspections', jsonb_build_object(
      'due_this_week', (SELECT COUNT(*) FROM public.inspections WHERE next_inspection_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'),
      'overdue', (SELECT COUNT(*) FROM public.inspections WHERE next_inspection_date < CURRENT_DATE AND result != 'PASS')
    ),
    'inventory', jsonb_build_object(
      'low_stock', (SELECT COUNT(*) FROM public.inventory_items WHERE quantity_in_stock <= reorder_level AND is_active = true),
      'total_value', (SELECT COALESCE(SUM(total_value), 0) FROM public.inventory_items WHERE is_active = true)
    ),
    'buses_in_maintenance', (SELECT COUNT(*) FROM public.buses WHERE status = 'MAINTENANCE'),
    'maintenance_costs_this_month', (SELECT COALESCE(SUM(amount), 0) FROM public.maintenance_costs WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE))
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Ticketing Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_ticketing_dashboard_stats(date_param date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'tickets_sold', COUNT(DISTINCT CASE WHEN DATE(booking_date) = date_param THEN id END),
    'revenue_today', COALESCE(SUM(CASE WHEN DATE(booking_date) = date_param AND payment_status = 'COMPLETED' THEN total_amount ELSE 0 END), 0),
    'upcoming_trips', (SELECT COUNT(*) FROM public.trips WHERE DATE(scheduled_departure) = date_param AND status = 'SCHEDULED'),
    'occupancy_rate', CASE 
      WHEN SUM(CASE WHEN DATE(t.scheduled_departure) = date_param THEN t.total_seats ELSE 0 END) > 0 
      THEN ROUND((COUNT(DISTINCT CASE WHEN DATE(t.scheduled_departure) = date_param AND b.status IN ('CONFIRMED', 'CHECKED_IN') THEN b.id END)::numeric / 
           SUM(CASE WHEN DATE(t.scheduled_departure) = date_param THEN t.total_seats ELSE 0 END)::numeric) * 100, 2)
      ELSE 0 
    END,
    'pending_bookings', COUNT(DISTINCT CASE WHEN status = 'PENDING' THEN id END)
  ) INTO result
  FROM public.bookings b
  LEFT JOIN public.trips t ON b.trip_id = t.id;
  
  RETURN result;
END;
$$;

-- Driver Dashboard Stats
CREATE OR REPLACE FUNCTION public.get_driver_dashboard_stats(driver_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  driver_record RECORD;
BEGIN
  -- Get driver record
  SELECT * INTO driver_record FROM public.drivers WHERE user_id = driver_user_id;
  
  IF driver_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Driver not found');
  END IF;
  
  SELECT jsonb_build_object(
    'driver_info', jsonb_build_object(
      'name', driver_record.first_name || ' ' || driver_record.last_name,
      'rating', driver_record.rating,
      'total_trips', driver_record.total_trips,
      'total_distance', driver_record.total_distance_km
    ),
    'current_trip', (
      SELECT jsonb_build_object(
        'trip_id', t.id,
        'trip_number', t.trip_number,
        'route', r.name,
        'departure', t.scheduled_departure,
        'arrival', t.scheduled_arrival,
        'status', t.status,
        'passengers', COUNT(b.id)
      )
      FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      LEFT JOIN public.bookings b ON t.trip_id = b.trip_id AND b.status IN ('CONFIRMED', 'CHECKED_IN')
      WHERE t.driver_id = driver_record.id 
      AND t.status IN ('BOARDING', 'DEPARTED', 'IN_PROGRESS')
      AND DATE(t.scheduled_departure) = CURRENT_DATE
      GROUP BY t.id, r.name
      LIMIT 1
    ),
    'next_trip', (
      SELECT jsonb_build_object(
        'trip_id', t.id,
        'trip_number', t.trip_number,
        'route', r.name,
        'departure', t.scheduled_departure,
        'arrival', t.scheduled_arrival
      )
      FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      WHERE t.driver_id = driver_record.id 
      AND t.status = 'SCHEDULED'
      AND t.scheduled_departure > NOW()
      ORDER BY t.scheduled_departure
      LIMIT 1
    ),
    'today_stats', jsonb_build_object(
      'trips_completed', (SELECT COUNT(*) FROM public.trips WHERE driver_id = driver_record.id AND DATE(actual_arrival) = CURRENT_DATE AND status = 'COMPLETED'),
      'trips_scheduled', (SELECT COUNT(*) FROM public.trips WHERE driver_id = driver_record.id AND DATE(scheduled_departure) = CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 2. SEARCH & FILTER FUNCTIONS
-- =====================================================

-- Search Available Trips
CREATE OR REPLACE FUNCTION public.search_available_trips(
  origin_param text,
  destination_param text,
  date_param date
)
RETURNS TABLE(
  trip_id uuid,
  trip_number text,
  route_name text,
  origin text,
  destination text,
  departure_time timestamptz,
  arrival_time timestamptz,
  fare numeric,
  available_seats int,
  total_seats int,
  bus_model text,
  bus_registration text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.trip_number,
    r.name,
    r.origin,
    r.destination,
    t.scheduled_departure,
    t.scheduled_arrival,
    t.fare,
    t.available_seats,
    t.total_seats,
    b.model,
    b.registration_number
  FROM public.trips t
  JOIN public.routes r ON t.route_id = r.id
  JOIN public.buses b ON t.bus_id = b.id
  WHERE r.origin ILIKE '%' || origin_param || '%'
  AND r.destination ILIKE '%' || destination_param || '%'
  AND DATE(t.scheduled_departure) = date_param
  AND t.status = 'SCHEDULED'
  AND t.available_seats > 0
  ORDER BY t.scheduled_departure;
END;
$$;

-- Get User Booking History
CREATE OR REPLACE FUNCTION public.get_user_booking_history(
  user_id_param uuid,
  limit_param int DEFAULT 10
)
RETURNS TABLE(
  booking_id uuid,
  booking_reference text,
  trip_number text,
  route_name text,
  departure_time timestamptz,
  seat_number text,
  fare numeric,
  status booking_status,
  payment_status payment_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.booking_reference,
    t.trip_number,
    r.name,
    t.scheduled_departure,
    b.seat_number,
    b.fare,
    b.status,
    b.payment_status
  FROM public.bookings b
  JOIN public.trips t ON b.trip_id = t.id
  JOIN public.routes r ON t.route_id = r.id
  WHERE b.passenger_id = user_id_param
  ORDER BY b.booking_date DESC
  LIMIT limit_param;
END;
$$;

-- =====================================================
-- 3. BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Check Seat Availability
CREATE OR REPLACE FUNCTION public.is_seat_available(
  trip_id_param uuid,
  seat_number_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE trip_id = trip_id_param
    AND seat_number = seat_number_param
    AND status IN ('CONFIRMED', 'CHECKED_IN', 'PENDING')
  );
END;
$$;

-- Calculate Refund Amount
CREATE OR REPLACE FUNCTION public.calculate_refund_amount(
  booking_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  hours_until_departure numeric;
  refund_percentage numeric;
  refund_amount numeric;
  penalty_amount numeric;
  result jsonb;
BEGIN
  -- Get booking details
  SELECT b.*, t.scheduled_departure
  INTO booking_record
  FROM public.bookings b
  JOIN public.trips t ON b.trip_id = t.id
  WHERE b.id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  -- Calculate hours until departure
  hours_until_departure := EXTRACT(EPOCH FROM (booking_record.scheduled_departure - NOW())) / 3600;
  
  -- Refund policy: 100% if >48h, 75% if >24h, 50% if >12h, 0% if <12h
  IF hours_until_departure > 48 THEN
    refund_percentage := 100;
    penalty_amount := 0;
  ELSIF hours_until_departure > 24 THEN
    refund_percentage := 75;
    penalty_amount := booking_record.total_amount * 0.25;
  ELSIF hours_until_departure > 12 THEN
    refund_percentage := 50;
    penalty_amount := booking_record.total_amount * 0.50;
  ELSE
    refund_percentage := 0;
    penalty_amount := booking_record.total_amount;
  END IF;
  
  refund_amount := booking_record.total_amount * (refund_percentage / 100);
  
  RETURN jsonb_build_object(
    'original_amount', booking_record.total_amount,
    'refund_percentage', refund_percentage,
    'refund_amount', refund_amount,
    'penalty_amount', penalty_amount,
    'hours_until_departure', ROUND(hours_until_departure, 2)
  );
END;
$$;

-- =====================================================
-- 4. REPORTING VIEWS
-- =====================================================

-- Daily Revenue Report View
CREATE OR REPLACE VIEW public.daily_revenue_report AS
SELECT
  DATE(b.booking_date) as report_date,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'COMPLETED' THEN b.id END) as paid_bookings,
  SUM(CASE WHEN b.payment_status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN b.payment_status = 'COMPLETED' AND b.payment_method = 'CASH' THEN b.total_amount ELSE 0 END) as cash_revenue,
  SUM(CASE WHEN b.payment_status = 'COMPLETED' AND b.payment_method = 'CARD' THEN b.total_amount ELSE 0 END) as card_revenue,
  SUM(CASE WHEN b.payment_status = 'COMPLETED' AND b.payment_method = 'MOBILE_MONEY' THEN b.total_amount ELSE 0 END) as mobile_money_revenue
FROM public.bookings b
GROUP BY DATE(b.booking_date)
ORDER BY report_date DESC;

-- Route Performance View
CREATE OR REPLACE VIEW public.route_performance AS
SELECT
  r.id as route_id,
  r.name as route_name,
  r.origin,
  r.destination,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(CASE WHEN b.payment_status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as total_revenue,
  ROUND(AVG(t.available_seats::numeric / t.total_seats::numeric) * 100, 2) as avg_occupancy_rate
FROM public.routes r
LEFT JOIN public.trips t ON r.id = t.route_id
LEFT JOIN public.bookings b ON t.id = b.trip_id
WHERE t.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY r.id, r.name, r.origin, r.destination
ORDER BY total_revenue DESC;

-- Bus Utilization View
CREATE OR REPLACE VIEW public.bus_utilization AS
SELECT
  b.id as bus_id,
  b.registration_number,
  b.model,
  b.status,
  COUNT(DISTINCT t.id) as total_trips,
  SUM(t.total_seats - t.available_seats) as total_passengers,
  ROUND(AVG((t.total_seats - t.available_seats)::numeric / t.total_seats::numeric) * 100, 2) as avg_occupancy_rate,
  COALESCE(SUM(mc.amount), 0) as maintenance_costs
FROM public.buses b
LEFT JOIN public.trips t ON b.id = t.bus_id AND t.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN public.maintenance_costs mc ON b.id = mc.bus_id AND mc.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.registration_number, b.model, b.status
ORDER BY total_trips DESC;

-- Driver Performance View
CREATE OR REPLACE VIEW public.driver_performance AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  d.status,
  d.rating,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.id END) as completed_trips,
  COUNT(DISTINCT CASE WHEN t.status = 'CANCELLED' THEN t.id END) as cancelled_trips,
  ROUND(AVG(EXTRACT(EPOCH FROM (t.actual_arrival - t.actual_departure)) / 3600), 2) as avg_trip_duration_hours
FROM public.drivers d
LEFT JOIN public.trips t ON d.id = t.driver_id AND t.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.id, d.first_name, d.last_name, d.status, d.rating
ORDER BY completed_trips DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Functions and views created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_08_triggers.sql';
END $$;
