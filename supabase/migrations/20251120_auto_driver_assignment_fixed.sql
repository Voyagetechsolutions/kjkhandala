-- =====================================================
-- AUTOMATIC DRIVER ASSIGNMENT SYSTEM (FIXED)
-- =====================================================
-- Uses correct column names: start_time, end_time
-- =====================================================

-- =====================================================
-- FUNCTION: auto_assign_driver()
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_driver()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_driver UUID;
BEGIN
  -- Only auto-assign if driver_id is not already set
  IF NEW.driver_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find next available driver
  SELECT d.id INTO selected_driver
  FROM drivers d
  WHERE d.active = TRUE
  
    -- Driver not already assigned to overlapping shifts
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING')
        AND tstzrange(s.start_time, s.end_time)
            && tstzrange(NEW.scheduled_departure, NEW.scheduled_arrival)
    )
    
    -- Fatigue rule: last shift must have ended 10+ hours ago (min rest)
    AND (
      SELECT COALESCE(MAX(s.end_time), NOW() - INTERVAL '10 hours')
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING', 'completed', 'COMPLETED')
    ) <= NEW.scheduled_departure - INTERVAL '10 hours'
    
    -- Max 9 hours driving per day
    AND (
      SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 
        0
      )
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.start_time >= DATE_TRUNC('day', NEW.scheduled_departure)
        AND s.start_time < DATE_TRUNC('day', NEW.scheduled_departure) + INTERVAL '1 day'
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING', 'completed', 'COMPLETED')
    ) + EXTRACT(EPOCH FROM (NEW.scheduled_arrival - NEW.scheduled_departure)) / 3600 <= 9
    
    -- Max 56 hours driving per week
    AND (
      SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 
        0
      )
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.start_time >= DATE_TRUNC('week', NEW.scheduled_departure)
        AND s.start_time < DATE_TRUNC('week', NEW.scheduled_departure) + INTERVAL '7 days'
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING', 'completed', 'COMPLETED')
    ) + EXTRACT(EPOCH FROM (NEW.scheduled_arrival - NEW.scheduled_departure)) / 3600 <= 56
  
  ORDER BY
    -- Prioritize the driver with least driving hours in last 7 days (fair rotation)
    (
      SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 
        0
      )
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.start_time >= NOW() - INTERVAL '7 days'
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING', 'completed', 'COMPLETED')
    ) ASC,
    -- Secondary: least trips this week
    (
      SELECT COUNT(*)
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.start_time >= DATE_TRUNC('week', NOW())
        AND s.status IN ('scheduled', 'SCHEDULED', 'on_duty', 'ON_DUTY', 'driving', 'DRIVING', 'completed', 'COMPLETED')
    ) ASC,
    -- Tertiary: random for true round-robin
    RANDOM()
  
  LIMIT 1;

  -- If no driver found, log warning and keep trip unassigned
  IF selected_driver IS NULL THEN
    RAISE NOTICE 'No available driver found for trip % at %', NEW.id, NEW.scheduled_departure;
    RETURN NEW;
  END IF;

  -- Update trip with assigned driver
  NEW.driver_id := selected_driver;

  -- Create the driver shift automatically
  INSERT INTO driver_shifts(
    driver_id,
    trip_id,
    bus_id,
    route_id,
    shift_date,
    start_time,
    end_time,
    status
  )
  VALUES (
    selected_driver,
    NEW.id,
    NEW.bus_id,
    NEW.route_id,
    DATE(NEW.scheduled_departure),
    NEW.scheduled_departure - INTERVAL '30 minutes',
    NEW.scheduled_arrival + INTERVAL '20 minutes',
    'scheduled'
  );

  RAISE NOTICE 'Auto-assigned driver % to trip %', selected_driver, NEW.id;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: trg_auto_assign_driver
-- =====================================================

DROP TRIGGER IF EXISTS trg_auto_assign_driver ON trips;

CREATE TRIGGER trg_auto_assign_driver
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION auto_assign_driver();

-- =====================================================
-- FUNCTION: update_driver_shift_on_trip_change()
-- =====================================================

CREATE OR REPLACE FUNCTION update_driver_shift_on_trip_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update corresponding driver shift if trip times changed
  IF OLD.scheduled_departure != NEW.scheduled_departure 
     OR OLD.scheduled_arrival != NEW.scheduled_arrival THEN
    
    UPDATE driver_shifts
    SET 
      start_time = NEW.scheduled_departure - INTERVAL '30 minutes',
      end_time = NEW.scheduled_arrival + INTERVAL '20 minutes',
      shift_date = DATE(NEW.scheduled_departure)
    WHERE trip_id = NEW.id;
    
  END IF;

  -- Update driver if changed
  IF OLD.driver_id != NEW.driver_id THEN
    
    -- Update existing shift with new driver
    UPDATE driver_shifts
    SET driver_id = NEW.driver_id
    WHERE trip_id = NEW.id;
    
  END IF;

  -- Update bus if changed
  IF OLD.bus_id != NEW.bus_id THEN
    
    UPDATE driver_shifts
    SET bus_id = NEW.bus_id
    WHERE trip_id = NEW.id;
    
  END IF;

  -- Update route if changed
  IF OLD.route_id != NEW.route_id THEN
    
    UPDATE driver_shifts
    SET route_id = NEW.route_id
    WHERE trip_id = NEW.id;
    
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: trg_update_driver_shift_on_trip_change
-- =====================================================

DROP TRIGGER IF EXISTS trg_update_driver_shift_on_trip_change ON trips;

CREATE TRIGGER trg_update_driver_shift_on_trip_change
AFTER UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_driver_shift_on_trip_change();

-- =====================================================
-- FUNCTION: delete_driver_shift_on_trip_delete()
-- =====================================================

CREATE OR REPLACE FUNCTION delete_driver_shift_on_trip_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete corresponding driver shift
  DELETE FROM driver_shifts
  WHERE trip_id = OLD.id;
  
  RAISE NOTICE 'Deleted driver shift for trip %', OLD.id;
  
  RETURN OLD;
END;
$$;

-- =====================================================
-- TRIGGER: trg_delete_driver_shift_on_trip_delete
-- =====================================================

DROP TRIGGER IF EXISTS trg_delete_driver_shift_on_trip_delete ON trips;

CREATE TRIGGER trg_delete_driver_shift_on_trip_delete
AFTER DELETE ON trips
FOR EACH ROW
EXECUTE FUNCTION delete_driver_shift_on_trip_delete();

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Index for driver shift lookups by driver and time range
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_time 
ON driver_shifts(driver_id, start_time, end_time);

-- Index for driver shift status filtering
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status 
ON driver_shifts(status);

-- Index for trip lookups by bus and time range
CREATE INDEX IF NOT EXISTS idx_trips_bus_time 
ON trips(bus_id, scheduled_departure, scheduled_arrival);

-- Index for trip status filtering
CREATE INDEX IF NOT EXISTS idx_trips_status 
ON trips(status);

-- Index for active drivers
CREATE INDEX IF NOT EXISTS idx_drivers_active 
ON drivers(active) WHERE active = TRUE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION auto_assign_driver() IS 
'Automatically assigns the next available driver to a trip based on availability, fatigue rules, and fair rotation';

COMMENT ON FUNCTION update_driver_shift_on_trip_change() IS 
'Updates driver shift when trip times, driver, or bus changes';

COMMENT ON FUNCTION delete_driver_shift_on_trip_delete() IS 
'Deletes driver shift when trip is deleted';

-- =====================================================
-- DONE!
-- =====================================================
