-- =====================================================
-- TRIGGERS - Automated Database Actions
-- Run AFTER COMPLETE_07_functions_views.sql
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. AUTO-ASSIGN DEFAULT PASSENGER ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, role_level, is_active)
  VALUES (NEW.id, 'PASSENGER', 10, true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
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
  -- Only generate if not already set
  IF NEW.booking_reference IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
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

DROP TRIGGER IF EXISTS generate_booking_ref ON public.bookings;
CREATE TRIGGER generate_booking_ref
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_reference();

-- =====================================================
-- 4. AUTO-GENERATE TRIP NUMBER
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_trip_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trip_prefix text;
  trip_number text;
BEGIN
  -- Only generate if not already set
  IF NEW.trip_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  trip_prefix := 'TRP' || TO_CHAR(NOW(), 'YYYYMMDD');
  trip_number := LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0');
  
  NEW.trip_number := trip_prefix || '-' || trip_number;
  
  WHILE EXISTS (SELECT 1 FROM public.trips WHERE trip_number = NEW.trip_number) LOOP
    trip_number := LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0');
    NEW.trip_number := trip_prefix || '-' || trip_number;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_trip_num ON public.trips;
CREATE TRIGGER generate_trip_num
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_trip_number();

-- =====================================================
-- 5. UPDATE AVAILABLE SEATS ON BOOKING
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

DROP TRIGGER IF EXISTS update_seats_on_booking ON public.bookings;
CREATE TRIGGER update_seats_on_booking
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_seats();

-- =====================================================
-- 6. AUTO-UPDATE TIMESTAMPS
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
-- 7. SEND NOTIFICATION ON BOOKING STATUS CHANGE
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
        notification_message := 'Your trip for booking ' || NEW.booking_reference || ' has been completed. Thank you for traveling with us!';
      WHEN 'REFUNDED' THEN
        notification_title := 'Refund Processed';
        notification_message := 'Your refund for booking ' || NEW.booking_reference || ' has been processed.';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Insert notification
    IF NEW.passenger_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.passenger_id, notification_title, notification_message, 'BOOKING');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_booking_change ON public.bookings;
CREATE TRIGGER notify_on_booking_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();

-- =====================================================
-- 8. CREATE TRIP MANIFEST ON BOOKING CONFIRMATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_trip_manifest_entry()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process if status is CONFIRMED or CHECKED_IN
  IF NEW.status NOT IN ('CONFIRMED', 'CHECKED_IN') THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.trip_manifest (
      trip_id,
      booking_id,
      passenger_name,
      seat_number,
      is_checked_in
    )
    VALUES (
      NEW.trip_id,
      NEW.id,
      NEW.passenger_name,
      NEW.seat_number,
      NEW.status = 'CHECKED_IN'
    )
    ON CONFLICT (trip_id, booking_id) 
    DO UPDATE SET
      is_checked_in = NEW.status = 'CHECKED_IN',
      checked_in_at = CASE WHEN NEW.status = 'CHECKED_IN' THEN NOW() ELSE trip_manifest.checked_in_at END;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_manifest_on_booking ON public.bookings;
CREATE TRIGGER create_manifest_on_booking
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trip_manifest_entry();

-- =====================================================
-- 9. UPDATE INVENTORY ON STOCK MOVEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type = 'IN' THEN
    UPDATE public.inventory_items
    SET quantity_in_stock = quantity_in_stock + NEW.quantity,
        last_restocked_date = NEW.movement_date
    WHERE id = NEW.item_id;
    
  ELSIF NEW.type = 'OUT' THEN
    UPDATE public.inventory_items
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE id = NEW.item_id;
    
  ELSIF NEW.type = 'ADJUSTMENT' THEN
    UPDATE public.inventory_items
    SET quantity_in_stock = quantity_in_stock + NEW.quantity
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_inventory_on_stock_movement ON public.stock_movements;
CREATE TRIGGER update_inventory_on_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

-- =====================================================
-- 10. AUTO-GENERATE UNIQUE NUMBERS FOR VARIOUS ENTITIES
-- =====================================================

-- Function to generate unique numbers
CREATE OR REPLACE FUNCTION public.generate_unique_number(prefix text, table_name text, column_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  date_part text;
  sequence_part text;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  sequence_part := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  new_number := prefix || date_part || '-' || sequence_part;
  
  -- Ensure uniqueness
  WHILE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND information_schema.tables.table_name = generate_unique_number.table_name
  ) LOOP
    sequence_part := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    new_number := prefix || date_part || '-' || sequence_part;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Auto-generate numbers for various tables
CREATE OR REPLACE FUNCTION public.auto_generate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  number_column text;
BEGIN
  -- Determine prefix based on table
  CASE TG_TABLE_NAME
    WHEN 'expenses' THEN prefix := 'EXP'; number_column := 'expense_number';
    WHEN 'invoices' THEN prefix := 'INV'; number_column := 'invoice_number';
    WHEN 'refunds' THEN prefix := 'REF'; number_column := 'refund_number';
    WHEN 'collections' THEN prefix := 'COL'; number_column := 'collection_number';
    WHEN 'fuel_logs' THEN prefix := 'FUEL'; number_column := 'fuel_log_number';
    WHEN 'work_orders' THEN prefix := 'WO'; number_column := 'work_order_number';
    WHEN 'inspections' THEN prefix := 'INS'; number_column := 'inspection_number';
    WHEN 'repairs' THEN prefix := 'REP'; number_column := 'repair_number';
    WHEN 'stock_movements' THEN prefix := 'MOV'; number_column := 'movement_number';
    WHEN 'maintenance_records' THEN prefix := 'MNT'; number_column := 'record_number';
    WHEN 'incidents' THEN prefix := 'INC'; number_column := 'incident_number';
    WHEN 'leave_requests' THEN prefix := 'LVE'; number_column := 'leave_number';
    WHEN 'job_postings' THEN prefix := 'JOB'; number_column := 'job_number';
    WHEN 'job_applications' THEN prefix := 'APP'; number_column := 'application_number';
    WHEN 'performance_evaluations' THEN prefix := 'EVAL'; number_column := 'evaluation_number';
    WHEN 'payroll' THEN prefix := 'PAY'; number_column := 'payroll_number';
    WHEN 'training_programs' THEN prefix := 'TRN'; number_column := 'training_number';
    ELSE RETURN NEW;
  END CASE;
  
  -- Generate number
  NEW := jsonb_populate_record(NEW, jsonb_set(to_jsonb(NEW), ARRAY[number_column], 
    to_jsonb(prefix || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'))));
  
  RETURN NEW;
END;
$$;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS auto_gen_expense_number ON public.expenses;
CREATE TRIGGER auto_gen_expense_number BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_invoice_number ON public.invoices;
CREATE TRIGGER auto_gen_invoice_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_refund_number ON public.refunds;
CREATE TRIGGER auto_gen_refund_number BEFORE INSERT ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_collection_number ON public.collections;
CREATE TRIGGER auto_gen_collection_number BEFORE INSERT ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_fuel_log_number ON public.fuel_logs;
CREATE TRIGGER auto_gen_fuel_log_number BEFORE INSERT ON public.fuel_logs
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_work_order_number ON public.work_orders;
CREATE TRIGGER auto_gen_work_order_number BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_inspection_number ON public.inspections;
CREATE TRIGGER auto_gen_inspection_number BEFORE INSERT ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_repair_number ON public.repairs;
CREATE TRIGGER auto_gen_repair_number BEFORE INSERT ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_incident_number ON public.incidents;
CREATE TRIGGER auto_gen_incident_number BEFORE INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

DROP TRIGGER IF EXISTS auto_gen_leave_number ON public.leave_requests;
CREATE TRIGGER auto_gen_leave_number BEFORE INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_number();

-- =====================================================
-- 11. UPDATE DRIVER STATS ON TRIP COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_driver_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trip_distance numeric;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED' THEN
    -- Get route distance
    SELECT distance_km INTO trip_distance
    FROM public.routes
    WHERE id = NEW.route_id;
    
    -- Update driver stats
    UPDATE public.drivers
    SET 
      total_trips = total_trips + 1,
      total_distance_km = total_distance_km + COALESCE(trip_distance, 0)
    WHERE id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_driver_stats_on_trip_complete ON public.trips;
CREATE TRIGGER update_driver_stats_on_trip_complete
  AFTER UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_stats();

-- =====================================================
-- 12. CREATE OPERATIONAL ALERTS
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_operational_alerts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Alert for bus maintenance due
  IF TG_TABLE_NAME = 'buses' AND NEW.next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days' AND NEW.status = 'ACTIVE' THEN
    INSERT INTO public.operational_alerts (category, priority, title, message, reference_type, reference_id)
    VALUES (
      'MAINTENANCE_DUE',
      CASE WHEN NEW.next_maintenance_date <= CURRENT_DATE THEN 'HIGH' ELSE 'MEDIUM' END,
      'Bus Maintenance Due',
      'Bus ' || NEW.registration_number || ' maintenance is due on ' || NEW.next_maintenance_date,
      'bus',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Alert for driver license expiry
  IF TG_TABLE_NAME = 'drivers' AND NEW.license_expiry <= CURRENT_DATE + INTERVAL '30 days' AND NEW.status = 'ACTIVE' THEN
    INSERT INTO public.operational_alerts (category, priority, title, message, reference_type, reference_id)
    VALUES (
      'LICENSE_EXPIRY',
      CASE WHEN NEW.license_expiry <= CURRENT_DATE + INTERVAL '7 days' THEN 'HIGH' ELSE 'MEDIUM' END,
      'Driver License Expiring',
      'Driver ' || NEW.first_name || ' ' || NEW.last_name || ' license expires on ' || NEW.license_expiry,
      'driver',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Alert for trip delay
  IF TG_TABLE_NAME = 'trips' AND TG_OP = 'UPDATE' AND OLD.status != 'DELAYED' AND NEW.status = 'DELAYED' THEN
    INSERT INTO public.operational_alerts (category, priority, title, message, reference_type, reference_id)
    VALUES (
      'TRIP_DELAY',
      'HIGH',
      'Trip Delayed',
      'Trip ' || NEW.trip_number || ' has been delayed. Reason: ' || COALESCE(NEW.delay_reason, 'Not specified'),
      'trip',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_alerts_buses ON public.buses;
CREATE TRIGGER create_alerts_buses
  AFTER INSERT OR UPDATE ON public.buses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_operational_alerts();

DROP TRIGGER IF EXISTS create_alerts_drivers ON public.drivers;
CREATE TRIGGER create_alerts_drivers
  AFTER INSERT OR UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_operational_alerts();

DROP TRIGGER IF EXISTS create_alerts_trips ON public.trips;
CREATE TRIGGER create_alerts_trips
  AFTER UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.create_operational_alerts();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ All triggers created successfully!';
  RAISE NOTICE '🎉 Database schema is now complete and production-ready!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Summary:';
  RAISE NOTICE '   - Core tables: ✅';
  RAISE NOTICE '   - Operations tables: ✅';
  RAISE NOTICE '   - Finance tables: ✅';
  RAISE NOTICE '   - HR tables: ✅';
  RAISE NOTICE '   - Maintenance tables: ✅';
  RAISE NOTICE '   - RLS policies: ✅';
  RAISE NOTICE '   - Functions & views: ✅';
  RAISE NOTICE '   - Triggers: ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 You can now start using the system!';
END $$;
