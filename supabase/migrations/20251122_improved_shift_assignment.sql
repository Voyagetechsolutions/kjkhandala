-- Improved Driver Shift Assignment using Route Frequencies
-- This version assigns drivers based on actual scheduled routes from route_frequencies

CREATE OR REPLACE FUNCTION auto_assign_driver_shifts_from_schedules(
  p_start_date DATE,
  p_end_date DATE
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
  v_schedule RECORD;
  v_driver RECORD;
  v_bus RECORD;
  v_row_count INTEGER;
  v_day_of_week INTEGER;
  v_should_generate BOOLEAN;
BEGIN
  -- Loop through each date in the range
  FOR v_date IN 
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE
  LOOP
    -- Get day of week (0=Sunday, 1=Monday, etc.)
    v_day_of_week := EXTRACT(DOW FROM v_date)::INTEGER;
    
    -- Loop through each active route frequency/schedule
    FOR v_schedule IN 
      SELECT 
        rf.*,
        r.origin,
        r.destination
      FROM route_frequencies rf
      JOIN routes r ON rf.route_id = r.id
      WHERE rf.active = true
      AND (r.status IN ('active', 'ACTIVE') OR r.is_active = true)
    LOOP
      v_should_generate := false;
      
      -- Determine if we should create a shift for this date
      IF v_schedule.frequency_type = 'DAILY' THEN
        v_should_generate := true;
      ELSIF v_schedule.frequency_type = 'SPECIFIC_DAYS' THEN
        -- Check if today's day is in the days_of_week array
        v_should_generate := v_day_of_week = ANY(v_schedule.days_of_week);
      ELSIF v_schedule.frequency_type = 'WEEKLY' THEN
        v_should_generate := v_day_of_week = ANY(v_schedule.days_of_week);
      END IF;
      
      -- Only proceed if this schedule should run on this date
      IF v_should_generate THEN
        -- Find an available driver for this date
        -- Prefer the driver assigned to the schedule, otherwise find any available
        IF v_schedule.driver_id IS NOT NULL THEN
          SELECT * INTO v_driver
          FROM drivers
          WHERE id = v_schedule.driver_id
          AND status IN ('active', 'ACTIVE')
          AND id NOT IN (
            SELECT driver_id FROM driver_shifts 
            WHERE shift_date = v_date 
            AND status IN ('active', 'ACTIVE')
            AND driver_id IS NOT NULL
          );
        END IF;
        
        -- If schedule driver not available, find any available driver
        IF v_driver.id IS NULL THEN
          SELECT * INTO v_driver
          FROM drivers
          WHERE status IN ('active', 'ACTIVE')
          AND id NOT IN (
            SELECT driver_id FROM driver_shifts 
            WHERE shift_date = v_date 
            AND status IN ('active', 'ACTIVE')
            AND driver_id IS NOT NULL
          )
          ORDER BY full_name
          LIMIT 1;
        END IF;

        -- If we found a driver, try to assign them
        IF v_driver.id IS NOT NULL THEN
          -- Find the bus assigned to the schedule, or any available bus
          IF v_schedule.bus_id IS NOT NULL THEN
            SELECT * INTO v_bus
            FROM buses
            WHERE id = v_schedule.bus_id
            AND status IN ('active', 'ACTIVE')
            AND id NOT IN (
              SELECT bus_id FROM driver_shifts 
              WHERE shift_date = v_date 
              AND status IN ('active', 'ACTIVE') 
              AND bus_id IS NOT NULL
            );
          END IF;
          
          -- If schedule bus not available, find any available bus
          IF v_bus.id IS NULL THEN
            SELECT * INTO v_bus
            FROM buses
            WHERE status IN ('active', 'ACTIVE')
            AND id NOT IN (
              SELECT bus_id FROM driver_shifts 
              WHERE shift_date = v_date 
              AND status IN ('active', 'ACTIVE') 
              AND bus_id IS NOT NULL
            )
            ORDER BY seating_capacity DESC
            LIMIT 1;
          END IF;

          -- Try to insert the shift
          BEGIN
            INSERT INTO driver_shifts (
              driver_id,
              route_id,
              bus_id,
              shift_date,
              shift_type,
              status,
              start_time,
              notes
            ) VALUES (
              v_driver.id,
              v_schedule.route_id,
              v_bus.id,  -- Can be NULL if no bus found
              v_date,
              'single',
              'ACTIVE',  -- Use UPPERCASE to match enum
              v_schedule.departure_time,
              format('Auto-assigned for %s → %s', v_schedule.origin, v_schedule.destination)
            )
            ON CONFLICT (driver_id, shift_date, route_id) 
            WHERE UPPER(status) = 'ACTIVE'
            DO NOTHING;

            -- Check if the insert actually happened
            GET DIAGNOSTICS v_row_count = ROW_COUNT;
            
            IF v_row_count > 0 THEN
              v_assigned := v_assigned + 1;
            ELSE
              -- Conflict: shift already exists
              v_conflicts := v_conflicts + 1;
            END IF;
          EXCEPTION
            WHEN OTHERS THEN
              -- Any error counts as a conflict
              v_conflicts := v_conflicts + 1;
              RAISE NOTICE 'Error assigning shift: %', SQLERRM;
          END;
        ELSE
          -- No available driver for this route/date
          v_conflicts := v_conflicts + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_assigned, 
    v_conflicts, 
    format('Assigned %s shifts from schedules, %s conflicts', v_assigned, v_conflicts);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_assign_driver_shifts_from_schedules IS 
  'Auto-assigns driver shifts based on route_frequencies schedules. Uses scheduled drivers/buses when available, falls back to any available resources.';
