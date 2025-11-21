-- =====================================================
-- HELPER FUNCTIONS
-- Useful functions for role checking, stats, etc.
-- =====================================================

-- =====================================================
-- 1. CHECK USER ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_name text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = role_name
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- 2. CHECK IF USER HAS ANY OF MULTIPLE ROLES
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_any_role(user_id_param uuid, role_names text[])
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = ANY(role_names)
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- 3. GET USER ROLES
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param uuid)
RETURNS TABLE(role text, role_level int)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role, ur.role_level
  FROM public.user_roles ur
  WHERE ur.user_id = user_id_param
  AND ur.is_active = true
  ORDER BY ur.role_level DESC;
END;
$$;

-- =====================================================
-- 4. CHECK SEAT AVAILABILITY
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_seat_available(trip_id_param uuid, seat_number_param text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

-- =====================================================
-- 5. GET AVAILABLE SEATS FOR TRIP
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_available_seats_count(trip_id_param uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total_capacity int;
  booked_seats int;
BEGIN
  -- Get bus capacity
  SELECT b.capacity INTO total_capacity
  FROM public.trips t
  JOIN public.buses b ON t.bus_id = b.id
  WHERE t.id = trip_id_param;
  
  -- Count booked seats
  SELECT COUNT(*) INTO booked_seats
  FROM public.bookings
  WHERE trip_id = trip_id_param
  AND status IN ('CONFIRMED', 'CHECKED_IN', 'PENDING');
  
  RETURN COALESCE(total_capacity, 0) - COALESCE(booked_seats, 0);
END;
$$;

-- =====================================================
-- 6. GET DASHBOARD STATS (OPERATIONS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_operations_stats(date_param date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_trips int,
  active_trips int,
  completed_trips int,
  total_bookings int,
  revenue numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id)::int AS total_trips,
    COUNT(DISTINCT CASE WHEN t.status IN ('SCHEDULED', 'BOARDING', 'IN_PROGRESS') THEN t.id END)::int AS active_trips,
    COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.id END)::int AS completed_trips,
    COUNT(DISTINCT b.id)::int AS total_bookings,
    COALESCE(SUM(CASE WHEN b.payment_status = 'COMPLETED' THEN b.total_amount ELSE 0 END), 0) AS revenue
  FROM public.trips t
  LEFT JOIN public.bookings b ON t.id = b.trip_id
  WHERE DATE(t.departure_time) = date_param;
END;
$$;

-- =====================================================
-- 7. GET USER BOOKING HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_bookings(user_id_param uuid, limit_param int DEFAULT 10)
RETURNS TABLE(
  booking_id uuid,
  booking_reference text,
  trip_id uuid,
  departure_time timestamptz,
  route_name text,
  origin text,
  destination text,
  seat_number text,
  fare numeric,
  status booking_status,
  payment_status payment_status
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS booking_id,
    b.booking_reference,
    b.trip_id,
    t.departure_time,
    r.name AS route_name,
    r.origin,
    r.destination,
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
-- 8. SEARCH AVAILABLE TRIPS
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_trips(
  origin_param text,
  destination_param text,
  date_param date
)
RETURNS TABLE(
  trip_id uuid,
  route_name text,
  departure_time timestamptz,
  arrival_time timestamptz,
  fare numeric,
  available_seats int,
  bus_model text,
  bus_registration text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS trip_id,
    r.name AS route_name,
    t.departure_time,
    t.arrival_time,
    t.fare,
    t.available_seats,
    b.model AS bus_model,
    b.registration_number AS bus_registration
  FROM public.trips t
  JOIN public.routes r ON t.route_id = r.id
  JOIN public.buses b ON t.bus_id = b.id
  WHERE r.origin ILIKE '%' || origin_param || '%'
  AND r.destination ILIKE '%' || destination_param || '%'
  AND DATE(t.departure_time) = date_param
  AND t.status = 'SCHEDULED'
  AND t.available_seats > 0
  ORDER BY t.departure_time;
END;
$$;

-- =====================================================
-- 9. CANCEL BOOKING (WITH REFUND LOGIC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cancel_booking(booking_id_param uuid, user_id_param uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record record;
  hours_until_departure numeric;
  refund_amount numeric;
  result jsonb;
BEGIN
  -- Get booking details
  SELECT b.*, t.departure_time
  INTO booking_record
  FROM public.bookings b
  JOIN public.trips t ON b.trip_id = t.id
  WHERE b.id = booking_id_param
  AND b.passenger_id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  IF booking_record.status IN ('CANCELLED', 'REFUNDED', 'COMPLETED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking cannot be cancelled');
  END IF;
  
  -- Calculate hours until departure
  hours_until_departure := EXTRACT(EPOCH FROM (booking_record.departure_time - NOW())) / 3600;
  
  -- Refund policy: 100% if >24h, 50% if >12h, 0% if <12h
  IF hours_until_departure > 24 THEN
    refund_amount := booking_record.total_amount;
  ELSIF hours_until_departure > 12 THEN
    refund_amount := booking_record.total_amount * 0.5;
  ELSE
    refund_amount := 0;
  END IF;
  
  -- Update booking
  UPDATE public.bookings
  SET status = 'CANCELLED',
      payment_status = CASE WHEN refund_amount > 0 THEN 'REFUNDED' ELSE payment_status END
  WHERE id = booking_id_param;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    user_id_param,
    'Booking Cancelled',
    'Your booking ' || booking_record.booking_reference || ' has been cancelled. Refund: ' || refund_amount::text,
    'BOOKING'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'refund_amount', refund_amount,
    'message', 'Booking cancelled successfully'
  );
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ All helper functions created successfully!';
  RAISE NOTICE '📝 Database setup complete! Ready for use.';
END $$;
