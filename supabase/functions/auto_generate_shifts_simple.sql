-- =====================================================
-- SIMPLE AUTO GENERATE SHIFTS FUNCTION
-- Works with existing schema (no departure_date in schedules)
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
  v_driver_id UUID;
  v_bus_id UUID;
  v_shift_id UUID;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  -- Loop through active schedules for selected routes
  FOR v_schedule IN
    SELECT 
      s.id as schedule_id,
      s.route_id,
      s.departure_time,
      s.bus_id
    FROM schedules s
    WHERE s.route_id = ANY(p_route_ids)
      AND s.is_active = true
  LOOP
    -- Calculate shift times for the specified date
    v_start_time := p_date + v_schedule.departure_time - INTERVAL '30 minutes';
    v_end_time := p_date + v_schedule.departure_time + INTERVAL '8 hours';
    
    -- Find available driver
    SELECT d.id INTO v_driver_id
    FROM drivers d
    WHERE d.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM driver_shifts ds
        WHERE ds.driver_id = d.id
          AND ds.shift_date = p_date
          AND ds.status NOT IN ('CANCELLED', 'cancelled')
      )
    LIMIT 1;
    
    -- Use bus from schedule or find available one
    v_bus_id := v_schedule.bus_id;
    
    IF v_bus_id IS NULL THEN
      SELECT b.id INTO v_bus_id
      FROM buses b
      WHERE b.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM driver_shifts ds
          WHERE ds.bus_id = b.id
            AND ds.shift_date = p_date
            AND ds.status NOT IN ('CANCELLED', 'cancelled')
        )
      LIMIT 1;
    END IF;
    
    -- Only create shift if we have both driver and bus
    IF v_driver_id IS NOT NULL AND v_bus_id IS NOT NULL THEN
      INSERT INTO driver_shifts (
        driver_id,
        bus_id,
        route_id,
        schedule_id,
        shift_date,
        start_time,
        end_time,
        shift_type,
        status,
        hours
      ) VALUES (
        v_driver_id,
        v_bus_id,
        v_schedule.route_id,
        v_schedule.schedule_id,
        p_date,
        v_start_time,
        v_end_time,
        'regular',
        'SCHEDULED',
        8
      )
      RETURNING id INTO v_shift_id;
      
      v_shifts_created := v_shifts_created + 1;
      
      -- Send notification to driver
      BEGIN
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type
        )
        SELECT 
          d.user_id,
          'New Shift Assigned',
          'You have been assigned a shift on ' || p_date::TEXT,
          'shift_assignment'
        FROM drivers d
        WHERE d.id = v_driver_id
          AND d.user_id IS NOT NULL;
      EXCEPTION WHEN OTHERS THEN
        -- Ignore notification errors
        NULL;
      END;
    END IF;
  END LOOP;
  
  -- Return result
  RETURN json_build_object(
    'success', true,
    'shifts_created', v_shifts_created,
    'date', p_date,
    'message', v_shifts_created || ' shifts successfully generated'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'shifts_created', 0,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_generate_shifts(DATE, UUID[]) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Simple auto_generate_shifts function created successfully!';
END $$;
