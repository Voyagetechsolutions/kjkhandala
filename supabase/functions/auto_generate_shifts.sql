-- =====================================================
-- AUTO-GENERATE DRIVER SHIFTS FUNCTION
-- Automatically assigns drivers, buses, and conductors to scheduled trips
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_shifts(
  p_date DATE,
  p_route_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_shifts_created INTEGER := 0;
  v_schedule RECORD;
  v_driver RECORD;
  v_bus RECORD;
  v_conductor RECORD;
  v_shift_start TIMESTAMP;
  v_shift_end TIMESTAMP;
  v_result JSON;
BEGIN
  -- Loop through all schedules for the given date and routes
  FOR v_schedule IN
    SELECT 
      s.id as schedule_id,
      s.route_id,
      s.departure_date,
      s.departure_time,
      s.arrival_time,
      r.duration_hours,
      r.origin,
      r.destination
    FROM schedules s
    JOIN routes r ON s.route_id = r.id
    WHERE s.departure_date = p_date
      AND s.route_id = ANY(p_route_ids)
      AND s.status = 'scheduled'
      AND NOT EXISTS (
        -- Don't create shift if one already exists
        SELECT 1 FROM driver_shifts ds
        WHERE ds.schedule_id = s.id
      )
    ORDER BY s.departure_time
  LOOP
    -- Calculate shift times (1.5 hours before departure, 30 min after arrival)
    v_shift_start := (v_schedule.departure_date + v_schedule.departure_time) - INTERVAL '1.5 hours';
    v_shift_end := (v_schedule.departure_date + v_schedule.arrival_time) + INTERVAL '30 minutes';

    -- Find best available driver
    SELECT d.id, d.full_name
    INTO v_driver
    FROM drivers d
    WHERE d.status = 'active'
      AND d.id NOT IN (
        -- Exclude drivers already assigned for this time
        SELECT driver_id FROM driver_shifts
        WHERE shift_date = p_date
          AND (
            (shift_start, shift_end) OVERLAPS (v_shift_start, v_shift_end)
          )
      )
      -- Check rest requirements (at least 8 hours since last shift)
      AND (
        SELECT MAX(shift_end)
        FROM driver_shifts
        WHERE driver_id = d.id
          AND shift_end > NOW() - INTERVAL '24 hours'
      ) IS NULL
      OR (
        SELECT MAX(shift_end)
        FROM driver_shifts
        WHERE driver_id = d.id
          AND shift_end > NOW() - INTERVAL '24 hours'
      ) < v_shift_start - INTERVAL '8 hours'
    ORDER BY 
      -- Prioritize drivers with fewer recent shifts
      (SELECT COUNT(*) FROM driver_shifts WHERE driver_id = d.id AND shift_date >= p_date - 7),
      RANDOM()
    LIMIT 1;

    -- Find best available bus
    SELECT b.id, b.registration_number
    INTO v_bus
    FROM buses b
    WHERE b.status = 'active'
      AND b.fuel_level >= 20
      AND b.id NOT IN (
        -- Exclude buses already assigned for this time
        SELECT bus_id FROM driver_shifts
        WHERE shift_date = p_date
          AND (
            (shift_start, shift_end) OVERLAPS (v_shift_start, v_shift_end)
          )
      )
      -- Check maintenance status
      AND NOT EXISTS (
        SELECT 1 FROM maintenance_records mr
        WHERE mr.bus_id = b.id
          AND mr.status IN ('in_progress', 'pending')
      )
    ORDER BY 
      -- Prioritize buses with higher fuel
      b.fuel_level DESC,
      -- Prioritize buses with fewer recent trips
      (SELECT COUNT(*) FROM driver_shifts WHERE bus_id = b.id AND shift_date >= p_date - 7),
      RANDOM()
    LIMIT 1;

    -- Find available conductor (if needed for the route)
    SELECT s.id, s.full_name
    INTO v_conductor
    FROM staff s
    WHERE s.position = 'conductor'
      AND s.status = 'active'
      AND s.id NOT IN (
        -- Exclude conductors already assigned
        SELECT conductor_id FROM driver_shifts
        WHERE shift_date = p_date
          AND conductor_id IS NOT NULL
          AND (
            (shift_start, shift_end) OVERLAPS (v_shift_start, v_shift_end)
          )
      )
    ORDER BY RANDOM()
    LIMIT 1;

    -- Create shift if driver and bus are available
    IF v_driver.id IS NOT NULL AND v_bus.id IS NOT NULL THEN
      INSERT INTO driver_shifts (
        driver_id,
        bus_id,
        conductor_id,
        schedule_id,
        route_id,
        shift_date,
        shift_start,
        shift_end,
        status,
        auto_generated,
        created_at,
        updated_at
      ) VALUES (
        v_driver.id,
        v_bus.id,
        v_conductor.id,
        v_schedule.schedule_id,
        v_schedule.route_id,
        p_date,
        v_shift_start,
        v_shift_end,
        'SCHEDULED',
        true,
        NOW(),
        NOW()
      );

      v_shifts_created := v_shifts_created + 1;

      -- Send notifications (only if drivers table has user_id column)
      BEGIN
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          read,
          created_at
        )
        SELECT 
          d.user_id,
          'New Shift Assigned',
          format('You have been assigned to %s → %s on %s at %s', 
            v_schedule.origin, 
            v_schedule.destination,
            to_char(p_date, 'DD Mon YYYY'),
            to_char(v_schedule.departure_time, 'HH24:MI')
          ),
          'shift_assignment',
          false,
          NOW()
        FROM drivers d
        WHERE d.id = v_driver.id
          AND d.user_id IS NOT NULL;
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignore notification errors
          NULL;
      END;

      -- Notify conductor if assigned
      IF v_conductor.id IS NOT NULL THEN
        BEGIN
          INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            read,
            created_at
          )
          SELECT 
            s.user_id,
            'New Trip Assignment',
            format('You have been assigned as conductor for %s → %s on %s', 
              v_schedule.origin, 
              v_schedule.destination,
              to_char(p_date, 'DD Mon YYYY')
            ),
            'shift_assignment',
            false,
            NOW()
          FROM staff s
          WHERE s.id = v_conductor.id
            AND s.user_id IS NOT NULL;
        EXCEPTION
          WHEN OTHERS THEN
            -- Ignore notification errors
            NULL;
        END;
      END IF;
    END IF;
  END LOOP;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'shifts_created', v_shifts_created,
    'date', p_date,
    'message', format('%s shifts successfully generated', v_shifts_created)
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_generate_shifts(DATE, UUID[]) TO authenticated;

COMMENT ON FUNCTION auto_generate_shifts IS 'Automatically generates driver shifts for a given date by assigning drivers, buses, and conductors to scheduled trips based on availability and optimization rules';
