-- =====================================================
-- FIX TRIP_NUMBER FUNCTIONS AND AMBIGUITY
-- =====================================================

-- Step 1: Ensure trip_number column exists in trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_number TEXT UNIQUE;

-- Step 2: Drop all problematic functions (they depend on each other)
DROP FUNCTION IF EXISTS get_driver_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS search_available_trips(TEXT, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_user_booking_history(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS create_operational_alerts() CASCADE;
DROP FUNCTION IF EXISTS generate_trip_number() CASCADE;

-- Step 3: Recreate generate_trip_number trigger function
CREATE OR REPLACE FUNCTION generate_trip_number()
RETURNS TRIGGER AS $$
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
  
  WHILE EXISTS (SELECT 1 FROM trips WHERE trip_number = NEW.trip_number) LOOP
    trip_number := LPAD(FLOOR(RANDOM() * 1000)::text, 3, '0');
    NEW.trip_number := trip_prefix || '-' || trip_number;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for trip_number generation
DROP TRIGGER IF EXISTS trigger_generate_trip_number ON trips;
CREATE TRIGGER trigger_generate_trip_number
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION generate_trip_number();

-- Step 5: Recreate create_operational_alerts function (fixed)
CREATE OR REPLACE FUNCTION create_operational_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- 🔧 Handle bus maintenance alerts
  IF TG_TABLE_NAME = 'buses' THEN
    IF NEW.next_maintenance_date IS NOT NULL
       AND NEW.next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days'
       AND NEW.status = 'active' THEN
      INSERT INTO operational_alerts (category, priority, title, message, reference_type, reference_id)
      VALUES (
        'MAINTENANCE_DUE',
        CASE 
          WHEN NEW.next_maintenance_date <= CURRENT_DATE THEN 'HIGH' 
          ELSE 'MEDIUM' 
        END,
        'Bus Maintenance Due',
        'Bus ' || NEW.number_plate || ' maintenance is due on ' || NEW.next_maintenance_date,
        'bus',
        NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- 🔧 Handle driver license expiry alerts
  IF TG_TABLE_NAME = 'drivers' THEN
    IF NEW.license_expiry IS NOT NULL
       AND NEW.license_expiry <= CURRENT_DATE + INTERVAL '30 days'
       AND NEW.status = 'active' THEN
      INSERT INTO operational_alerts (category, priority, title, message, reference_type, reference_id)
      VALUES (
        'LICENSE_EXPIRY',
        CASE 
          WHEN NEW.license_expiry <= CURRENT_DATE + INTERVAL '7 days' THEN 'HIGH' 
          ELSE 'MEDIUM' 
        END,
        'Driver License Expiring',
        'Driver ' || NEW.full_name || ' license expires on ' || NEW.license_expiry,
        'driver',
        NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- 🔧 Handle trip delay alerts
  IF TG_TABLE_NAME = 'trips' THEN
    IF TG_OP = 'UPDATE' 
       AND OLD.status IS DISTINCT FROM 'DELAYED' 
       AND NEW.status = 'DELAYED' THEN
      INSERT INTO operational_alerts (category, priority, title, message, reference_type, reference_id)
      VALUES (
        'TRIP_DELAY',
        'HIGH',
        'Trip Delayed',
        'Trip ' || COALESCE(NEW.trip_number, NEW.id::text) || ' has been delayed. Reason: ' || COALESCE(NEW.delay_reason, 'Not specified'),
        'trip',
        NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers for operational alerts
DROP TRIGGER IF EXISTS trigger_bus_alerts ON buses;
CREATE TRIGGER trigger_bus_alerts
AFTER INSERT OR UPDATE ON buses
FOR EACH ROW
EXECUTE FUNCTION create_operational_alerts();

DROP TRIGGER IF EXISTS trigger_driver_alerts ON drivers;
CREATE TRIGGER trigger_driver_alerts
AFTER INSERT OR UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION create_operational_alerts();

DROP TRIGGER IF EXISTS trigger_trip_alerts ON trips;
CREATE TRIGGER trigger_trip_alerts
AFTER INSERT OR UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION create_operational_alerts();

-- Step 7: Recreate get_driver_dashboard_stats function (fixed)
CREATE OR REPLACE FUNCTION get_driver_dashboard_stats(driver_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  driver_record RECORD;
BEGIN
  -- Get driver record
  SELECT * INTO driver_record FROM drivers WHERE id = driver_user_id;
  
  IF driver_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Driver not found');
  END IF;
  
  SELECT jsonb_build_object(
    'driver_info', jsonb_build_object(
      'name', driver_record.full_name,
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
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      LEFT JOIN bookings b ON b.schedule_id = t.id AND b.status IN ('confirmed', 'checked_in')
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
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      WHERE t.driver_id = driver_record.id 
      AND t.status = 'SCHEDULED'
      AND t.scheduled_departure > NOW()
      ORDER BY t.scheduled_departure
      LIMIT 1
    ),
    'today_stats', jsonb_build_object(
      'trips_completed', (SELECT COUNT(*) FROM trips WHERE driver_id = driver_record.id AND DATE(actual_arrival) = CURRENT_DATE AND status = 'COMPLETED'),
      'trips_scheduled', (SELECT COUNT(*) FROM trips WHERE driver_id = driver_record.id AND DATE(scheduled_departure) = CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Recreate search_available_trips function (fixed)
CREATE OR REPLACE FUNCTION search_available_trips(origin_param TEXT, destination_param TEXT, date_param DATE)
RETURNS TABLE (
  id UUID,
  trip_number TEXT,
  route_name TEXT,
  origin TEXT,
  destination TEXT,
  scheduled_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ,
  fare NUMERIC,
  available_seats INTEGER,
  bus_model TEXT,
  bus_registration TEXT
) AS $$
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
    b.model,
    b.number_plate
  FROM trips t
  JOIN routes r ON t.route_id = r.id
  JOIN buses b ON t.bus_id = b.id
  WHERE r.origin ILIKE '%' || origin_param || '%'
  AND r.destination ILIKE '%' || destination_param || '%'
  AND DATE(t.scheduled_departure) = date_param
  AND t.status = 'SCHEDULED'
  AND t.available_seats > 0
  ORDER BY t.scheduled_departure;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Recreate get_user_booking_history function (fixed)
CREATE OR REPLACE FUNCTION get_user_booking_history(user_id_param UUID, limit_param INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  booking_reference TEXT,
  trip_number TEXT,
  route_name TEXT,
  departure TIMESTAMPTZ,
  seat_number TEXT,
  fare NUMERIC,
  status TEXT,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.id::text,
    t.trip_number,
    r.name,
    t.scheduled_departure,
    b.seat_number,
    b.total_amount,
    b.status,
    b.payment_status
  FROM bookings b
  JOIN trips t ON b.schedule_id = t.id
  JOIN routes r ON t.route_id = r.id
  WHERE b.passenger_name IS NOT NULL
  ORDER BY b.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFY ALL FUNCTIONS CREATED
-- =====================================================

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_trip_number',
    'create_operational_alerts',
    'get_driver_dashboard_stats',
    'search_available_trips',
    'get_user_booking_history'
  )
ORDER BY routine_name;

-- =====================================================
-- DONE! All functions fixed and recreated.
-- =====================================================
