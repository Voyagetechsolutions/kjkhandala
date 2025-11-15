-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- Auto-create profiles, assign roles, generate references, etc.
-- =====================================================

-- =====================================================
-- 1. AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. AUTO-ASSIGN DEFAULT ROLE (PASSENGER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Assign default PASSENGER role
  INSERT INTO public.user_roles (user_id, role, role_level, is_active)
  VALUES (NEW.id, 'PASSENGER', 0, true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Create trigger
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- 3. AUTO-GENERATE BOOKING REFERENCE
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  ref_prefix text;
  ref_number text;
BEGIN
  -- Generate reference like: BK20251111-XXXX
  ref_prefix := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD');
  ref_number := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  
  NEW.booking_reference := ref_prefix || '-' || ref_number;
  
  -- Ensure uniqueness (retry if collision)
  WHILE EXISTS (SELECT 1 FROM public.bookings WHERE booking_reference = NEW.booking_reference) LOOP
    ref_number := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    NEW.booking_reference := ref_prefix || '-' || ref_number;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS generate_booking_ref ON public.bookings;

-- Create trigger
CREATE TRIGGER generate_booking_ref
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_reference IS NULL)
  EXECUTE FUNCTION public.generate_booking_reference();

-- =====================================================
-- 4. UPDATE AVAILABLE SEATS ON BOOKING
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_trip_seats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('CONFIRMED', 'CHECKED_IN') THEN
    -- Decrease available seats
    UPDATE public.trips
    SET available_seats = available_seats - 1
    WHERE id = NEW.trip_id AND available_seats > 0;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Booking confirmed/checked-in
    IF OLD.status IN ('PENDING', 'CANCELLED') AND NEW.status IN ('CONFIRMED', 'CHECKED_IN') THEN
      UPDATE public.trips
      SET available_seats = available_seats - 1
      WHERE id = NEW.trip_id AND available_seats > 0;
    
    -- Booking cancelled/refunded
    ELSIF OLD.status IN ('CONFIRMED', 'CHECKED_IN') AND NEW.status IN ('CANCELLED', 'REFUNDED') THEN
      UPDATE public.trips
      SET available_seats = available_seats + 1
      WHERE id = NEW.trip_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status IN ('CONFIRMED', 'CHECKED_IN') THEN
    -- Increase available seats if confirmed booking deleted
    UPDATE public.trips
    SET available_seats = available_seats + 1
    WHERE id = OLD.trip_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_seats_on_booking ON public.bookings;

-- Create trigger
CREATE TRIGGER update_seats_on_booking
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_seats();

-- =====================================================
-- 5. AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_routes_timestamp ON public.routes;
CREATE TRIGGER update_routes_timestamp
  BEFORE UPDATE ON public.routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_buses_timestamp ON public.buses;
CREATE TRIGGER update_buses_timestamp
  BEFORE UPDATE ON public.buses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_drivers_timestamp ON public.drivers;
CREATE TRIGGER update_drivers_timestamp
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_trips_timestamp ON public.trips;
CREATE TRIGGER update_trips_timestamp
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_bookings_timestamp ON public.bookings;
CREATE TRIGGER update_bookings_timestamp
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 6. SEND NOTIFICATION ON BOOKING STATUS CHANGE
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  notification_title text;
  notification_message text;
BEGIN
  -- Only notify on status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'CONFIRMED' THEN
        notification_title := 'Booking Confirmed';
        notification_message := 'Your booking ' || NEW.booking_reference || ' has been confirmed.';
      WHEN 'CANCELLED' THEN
        notification_title := 'Booking Cancelled';
        notification_message := 'Your booking ' || NEW.booking_reference || ' has been cancelled.';
      WHEN 'CHECKED_IN' THEN
        notification_title := 'Checked In';
        notification_message := 'You have been checked in for booking ' || NEW.booking_reference || '.';
      WHEN 'COMPLETED' THEN
        notification_title := 'Trip Completed';
        notification_message := 'Your trip for booking ' || NEW.booking_reference || ' has been completed.';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Insert notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.passenger_id, notification_title, notification_message, 'BOOKING');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS notify_on_booking_change ON public.bookings;

-- Create trigger
CREATE TRIGGER notify_on_booking_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();

-- =====================================================
-- 7. AUDIT LOG FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit logging to critical tables (optional - can be enabled as needed)
-- Uncomment to enable audit logging:

-- DROP TRIGGER IF EXISTS audit_bookings ON public.bookings;
-- CREATE TRIGGER audit_bookings
--   AFTER INSERT OR UPDATE OR DELETE ON public.bookings
--   FOR EACH ROW
--   EXECUTE FUNCTION public.log_audit();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ All triggers and functions created successfully!';
  RAISE NOTICE '📝 Next: Run 04_helper_functions.sql';
END $$;
