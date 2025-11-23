-- Fix auto_assign_driver_shifts function
-- Issue: The function was not properly tracking INSERT success

CREATE OR REPLACE FUNCTION auto_assign_driver_shifts(
  p_start_date DATE,
  p_end_date DATE,
  p_route_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  assigned_count INTEGER,
  conflicts_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_assigned INTEGER := 0;
  v_conflicts INTEGER := 0;
  v_date DATE;
  v_route RECORD;
  v_driver RECORD;
  v_bus RECORD;
  v_inserted BOOLEAN;
BEGIN
  -- Loop through each date in the range
  FOR v_date IN 
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE
  LOOP
    -- Loop through each route
    FOR v_route IN 
      SELECT * FROM routes 
      WHERE (p_route_ids IS NULL OR id = ANY(p_route_ids))
      AND (status = 'active' OR is_active = true)
    LOOP
      -- Find an available driver for this date
      SELECT * INTO v_driver
      FROM drivers
      WHERE status = 'active'
      AND id NOT IN (
        SELECT driver_id FROM driver_shifts 
        WHERE shift_date = v_date AND status = 'active'
      )
      ORDER BY full_name
      LIMIT 1;

      -- If we found a driver, try to assign them
      IF FOUND THEN
        -- Find an available bus (optional)
        SELECT * INTO v_bus
        FROM buses
        WHERE status = 'active'
        AND id NOT IN (
          SELECT bus_id FROM driver_shifts 
          WHERE shift_date = v_date AND status = 'active' AND bus_id IS NOT NULL
        )
        ORDER BY seating_capacity DESC
        LIMIT 1;

        -- Try to insert the shift
        BEGIN
          INSERT INTO driver_shifts (
            driver_id,
            route_id,
            bus_id,
            shift_date,
            shift_type,
            status
          ) VALUES (
            v_driver.id,
            v_route.id,
            v_bus.id,  -- Can be NULL if no bus found
            v_date,
            'single',
            'active'
          )
          ON CONFLICT (driver_id, shift_date, route_id) 
          WHERE status = 'active'
          DO NOTHING;

          -- Check if the insert actually happened
          GET DIAGNOSTICS v_inserted = ROW_COUNT;
          
          IF v_inserted THEN
            v_assigned := v_assigned + 1;
          ELSE
            -- Conflict: shift already exists
            v_conflicts := v_conflicts + 1;
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            -- Any error counts as a conflict
            v_conflicts := v_conflicts + 1;
        END;
      ELSE
        -- No available driver for this route/date
        v_conflicts := v_conflicts + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT v_assigned, v_conflicts, 
    format('Assigned %s shifts, %s conflicts', v_assigned, v_conflicts);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_assign_driver_shifts(DATE, DATE, UUID[]) TO authenticated;

COMMENT ON FUNCTION auto_assign_driver_shifts IS 'Automatically assign available drivers to routes for a date range. Returns count of successful assignments and conflicts.';
