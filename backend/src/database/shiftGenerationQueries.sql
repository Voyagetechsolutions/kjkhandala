-- ============================================
-- SHIFT GENERATION QUERIES
-- For Auto-Generate Driver Shifts Feature
-- ============================================

-- 1. Get trips for selected date and routes
-- Usage: Replace $1 with start date, $2 with end date, $3 with route IDs array
CREATE OR REPLACE FUNCTION get_trips_for_shift_generation(
  p_date DATE,
  p_route_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  trip_number TEXT,
  route_id UUID,
  scheduled_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ,
  status TEXT,
  total_seats INTEGER,
  driver_id UUID,
  bus_id UUID,
  conductor_id UUID,
  route_origin TEXT,
  route_destination TEXT,
  route_distance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.trip_number,
    t.route_id,
    t.scheduled_departure,
    t.scheduled_arrival,
    t.status,
    t.total_seats,
    t.driver_id,
    t.bus_id,
    t.conductor_id,
    r.origin as route_origin,
    r.destination as route_destination,
    r.distance_km as route_distance
  FROM trips t
  LEFT JOIN routes r ON t.route_id = r.id
  WHERE DATE(t.scheduled_departure) = p_date
    AND t.status != 'CANCELLED'
    AND (array_length(p_route_ids, 1) IS NULL OR t.route_id = ANY(p_route_ids))
  ORDER BY t.scheduled_departure ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. Get available drivers for a date
CREATE OR REPLACE FUNCTION get_available_drivers(p_date DATE)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  license_number TEXT,
  license_expiry DATE,
  status user_status,
  rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.license_number,
    d.license_expiry,
    d.status,
    d.rating
  FROM drivers d
  WHERE d.status = 'active'
    AND d.license_expiry >= p_date
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts ds
      WHERE ds.driver_id = d.id
        AND ds.shift_date = p_date
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Get available buses for a date
CREATE OR REPLACE FUNCTION get_available_buses(p_date DATE)
RETURNS TABLE (
  id UUID,
  registration_number TEXT,
  seating_capacity INTEGER,
  status TEXT,
  service_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.registration_number,
    b.seating_capacity,
    b.status,
    b.service_status
  FROM buses b
  WHERE b.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts ds
      WHERE ds.bus_id = b.id
        AND ds.shift_date = p_date
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Get available conductors for a date
CREATE OR REPLACE FUNCTION get_available_conductors(p_date DATE)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  status user_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.status
  FROM conductors c
  WHERE c.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts ds
      WHERE ds.conductor_id = c.id
        AND ds.shift_date = p_date
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Bulk insert shifts
CREATE OR REPLACE FUNCTION bulk_insert_shifts(
  p_shifts JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_shift JSONB;
BEGIN
  v_count := 0;
  
  FOR v_shift IN SELECT * FROM jsonb_array_elements(p_shifts)
  LOOP
    INSERT INTO driver_shifts (
      id,
      shift_date,
      trip_id,
      driver_id,
      bus_id,
      conductor_id,
      status,
      created_at
    ) VALUES (
      gen_random_uuid(),
      (v_shift->>'shift_date')::DATE,
      (v_shift->>'trip_id')::UUID,
      (v_shift->>'driver_id')::UUID,
      (v_shift->>'bus_id')::UUID,
      (v_shift->>'conductor_id')::UUID,
      COALESCE(v_shift->>'status', 'upcoming'),
      now()
    );
    
    -- Update trip with assignments
    UPDATE trips
    SET 
      driver_id = (v_shift->>'driver_id')::UUID,
      bus_id = (v_shift->>'bus_id')::UUID,
      conductor_id = (v_shift->>'conductor_id')::UUID
    WHERE id = (v_shift->>'trip_id')::UUID;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Get shift statistics for a date
CREATE OR REPLACE FUNCTION get_shift_stats(p_date DATE)
RETURNS TABLE (
  active INTEGER,
  upcoming INTEGER,
  completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE now() >= t.scheduled_departure AND now() < t.scheduled_arrival)::INTEGER as active,
    COUNT(*) FILTER (WHERE now() < t.scheduled_departure)::INTEGER as upcoming,
    COUNT(*) FILTER (WHERE now() >= t.scheduled_arrival)::INTEGER as completed
  FROM driver_shifts ds
  JOIN trips t ON ds.trip_id = t.id
  WHERE ds.shift_date = p_date;
END;
$$ LANGUAGE plpgsql;

-- 7. Check for time conflicts
CREATE OR REPLACE FUNCTION check_time_conflict(
  p_driver_id UUID,
  p_bus_id UUID,
  p_conductor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_date DATE
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflict_type TEXT,
  conflict_details TEXT
) AS $$
DECLARE
  v_driver_conflict BOOLEAN := FALSE;
  v_bus_conflict BOOLEAN := FALSE;
  v_conductor_conflict BOOLEAN := FALSE;
BEGIN
  -- Check driver conflict
  IF p_driver_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM driver_shifts ds
      JOIN trips t ON ds.trip_id = t.id
      WHERE ds.driver_id = p_driver_id
        AND ds.shift_date = p_date
        AND p_start_time < t.scheduled_arrival
        AND t.scheduled_departure < p_end_time
    ) INTO v_driver_conflict;
  END IF;
  
  -- Check bus conflict
  IF p_bus_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM driver_shifts ds
      JOIN trips t ON ds.trip_id = t.id
      WHERE ds.bus_id = p_bus_id
        AND ds.shift_date = p_date
        AND p_start_time < t.scheduled_arrival
        AND t.scheduled_departure < p_end_time
    ) INTO v_bus_conflict;
  END IF;
  
  -- Check conductor conflict
  IF p_conductor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM driver_shifts ds
      JOIN trips t ON ds.trip_id = t.id
      WHERE ds.conductor_id = p_conductor_id
        AND ds.shift_date = p_date
        AND p_start_time < t.scheduled_arrival
        AND t.scheduled_departure < p_end_time
    ) INTO v_conductor_conflict;
  END IF;
  
  -- Return results
  IF v_driver_conflict THEN
    RETURN QUERY SELECT TRUE, 'driver', 'Driver has overlapping shift';
  ELSIF v_bus_conflict THEN
    RETURN QUERY SELECT TRUE, 'bus', 'Bus has overlapping shift';
  ELSIF v_conductor_conflict THEN
    RETURN QUERY SELECT TRUE, 'conductor', 'Conductor has overlapping shift';
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Get driver workload for a date
CREATE OR REPLACE FUNCTION get_driver_workload(p_date DATE)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  total_hours NUMERIC,
  trip_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.driver_id,
    d.full_name as driver_name,
    SUM(EXTRACT(EPOCH FROM (t.scheduled_arrival - t.scheduled_departure)) / 3600)::NUMERIC as total_hours,
    COUNT(*)::INTEGER as trip_count
  FROM driver_shifts ds
  JOIN trips t ON ds.trip_id = t.id
  JOIN drivers d ON ds.driver_id = d.id
  WHERE ds.shift_date = p_date
  GROUP BY ds.driver_id, d.full_name
  ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_trips_for_shift_generation(DATE, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_drivers(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_buses(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_conductors(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_insert_shifts(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_stats(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_time_conflict(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_workload(DATE) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_trips_for_shift_generation IS 'Get all trips for a specific date and routes for shift generation';
COMMENT ON FUNCTION get_available_drivers IS 'Get drivers available for assignment on a specific date';
COMMENT ON FUNCTION get_available_buses IS 'Get buses available for assignment on a specific date';
COMMENT ON FUNCTION get_available_conductors IS 'Get conductors available for assignment on a specific date';
COMMENT ON FUNCTION bulk_insert_shifts IS 'Bulk insert driver shifts from JSON array';
COMMENT ON FUNCTION get_shift_stats IS 'Get shift statistics (active, upcoming, completed) for a date';
COMMENT ON FUNCTION check_time_conflict IS 'Check if driver/bus/conductor has time conflicts';
COMMENT ON FUNCTION get_driver_workload IS 'Get driver workload summary for a date';
