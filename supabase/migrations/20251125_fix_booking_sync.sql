-- =====================================================
-- Fix Booking & Seat Synchronization
-- =====================================================
-- This migration ensures bookings from customer app
-- properly sync with ticketing dashboard seat counts
-- =====================================================

-- =====================================================
-- 1. CREATE FUNCTION: Decrement Available Seats
-- =====================================================
-- Called when a booking is created to update trip seats

CREATE OR REPLACE FUNCTION decrement_available_seats(trip_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the trip's available_seats count
  UPDATE trips
  SET available_seats = GREATEST(0, available_seats - 1)
  WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE FUNCTION: Increment Available Seats
-- =====================================================
-- Called when a booking is cancelled to restore seats

CREATE OR REPLACE FUNCTION increment_available_seats(trip_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the trip's available_seats count
  UPDATE trips
  SET available_seats = LEAST(total_seats, available_seats + 1)
  WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CREATE FUNCTION: Sync Trip Seats
-- =====================================================
-- Recalculates available seats based on actual bookings
-- Useful for fixing any sync issues

CREATE OR REPLACE FUNCTION sync_trip_seats(trip_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_seats INTEGER;
  v_booked_count INTEGER;
BEGIN
  -- Get total seats for the trip
  SELECT total_seats INTO v_total_seats
  FROM trips
  WHERE id = trip_id;

  -- Count confirmed/pending bookings (not cancelled)
  SELECT COUNT(*) INTO v_booked_count
  FROM bookings
  WHERE bookings.trip_id = sync_trip_seats.trip_id
    AND booking_status NOT IN ('cancelled', 'refunded');

  -- Update available seats
  UPDATE trips
  SET available_seats = GREATEST(0, v_total_seats - v_booked_count)
  WHERE id = trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE TRIGGER: Auto-sync seats on booking insert
-- =====================================================
-- Automatically decrements available seats when booking created

CREATE OR REPLACE FUNCTION trg_booking_insert_sync_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if booking is confirmed or pending (not cancelled)
  IF NEW.booking_status IN ('confirmed', 'pending') THEN
    PERFORM decrement_available_seats(NEW.trip_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_booking_insert_sync_seats ON bookings;
CREATE TRIGGER tg_booking_insert_sync_seats
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_booking_insert_sync_seats();

-- =====================================================
-- 5. CREATE TRIGGER: Auto-sync seats on booking update
-- =====================================================
-- Handles cancellations and status changes

CREATE OR REPLACE FUNCTION trg_booking_update_sync_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking was cancelled, increment available seats
  IF OLD.booking_status NOT IN ('cancelled', 'refunded') 
     AND NEW.booking_status IN ('cancelled', 'refunded') THEN
    PERFORM increment_available_seats(NEW.trip_id);
  END IF;

  -- If booking was restored from cancelled, decrement available seats
  IF OLD.booking_status IN ('cancelled', 'refunded')
     AND NEW.booking_status IN ('confirmed', 'pending') THEN
    PERFORM decrement_available_seats(NEW.trip_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_booking_update_sync_seats ON bookings;
CREATE TRIGGER tg_booking_update_sync_seats
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status)
EXECUTE FUNCTION trg_booking_update_sync_seats();

-- =====================================================
-- 6. CREATE TRIGGER: Auto-sync seats on booking delete
-- =====================================================

CREATE OR REPLACE FUNCTION trg_booking_delete_sync_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore seat if booking was confirmed/pending
  IF OLD.booking_status IN ('confirmed', 'pending') THEN
    PERFORM increment_available_seats(OLD.trip_id);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_booking_delete_sync_seats ON bookings;
CREATE TRIGGER tg_booking_delete_sync_seats
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_booking_delete_sync_seats();

-- =====================================================
-- 7. FIX: Sync all existing trips
-- =====================================================
-- Run this once to fix any existing discrepancies

DO $$
DECLARE
  trip_record RECORD;
BEGIN
  FOR trip_record IN 
    SELECT id FROM trips WHERE scheduled_departure >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    PERFORM sync_trip_seats(trip_record.id);
  END LOOP;
END $$;

-- =====================================================
-- 8. CREATE VIEW: Real-time Trip Occupancy
-- =====================================================
-- Provides accurate seat counts for dashboard

CREATE OR REPLACE VIEW trip_occupancy_realtime AS
SELECT 
  t.id AS trip_id,
  t.trip_number,
  t.scheduled_departure,
  t.status,
  t.total_seats,
  t.available_seats,
  COUNT(b.id) FILTER (WHERE b.booking_status IN ('confirmed', 'pending')) AS booked_seats_actual,
  t.total_seats - COUNT(b.id) FILTER (WHERE b.booking_status IN ('confirmed', 'pending')) AS available_seats_actual,
  ROUND(
    (COUNT(b.id) FILTER (WHERE b.booking_status IN ('confirmed', 'pending'))::NUMERIC / t.total_seats) * 100, 
    1
  ) AS occupancy_rate,
  r.origin,
  r.destination,
  bu.name AS bus_name,
  bu.seating_capacity AS bus_capacity
FROM trips t
LEFT JOIN bookings b ON b.trip_id = t.id
LEFT JOIN routes r ON r.id = t.route_id
LEFT JOIN buses bu ON bu.id = t.bus_id
WHERE t.scheduled_departure >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY t.id, t.trip_number, t.scheduled_departure, t.status, t.total_seats, 
         t.available_seats, r.origin, r.destination, bu.name, bu.seating_capacity
ORDER BY t.scheduled_departure;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION decrement_available_seats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_available_seats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION sync_trip_seats(UUID) TO authenticated, service_role;
GRANT SELECT ON trip_occupancy_realtime TO authenticated, anon;

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Created decrement_available_seats function
-- ✅ Created increment_available_seats function  
-- ✅ Created sync_trip_seats function for manual fixes
-- ✅ Added trigger on booking INSERT to auto-decrement seats
-- ✅ Added trigger on booking UPDATE to handle cancellations
-- ✅ Added trigger on booking DELETE to restore seats
-- ✅ Synced all existing trips to fix discrepancies
-- ✅ Created real-time occupancy view for dashboard
-- ✅ Granted necessary permissions
--
-- RESULT: Customer app bookings now properly sync with
--         ticketing dashboard seat counts in real-time!
-- =====================================================
