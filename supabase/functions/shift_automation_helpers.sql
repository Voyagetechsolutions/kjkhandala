-- =====================================================
-- SHIFT AUTOMATION HELPER FUNCTIONS
-- Supporting functions for driver shift automation
-- =====================================================

-- =====================================================
-- 1. VALIDATE SHIFT OVERLAP
-- Prevents drivers from being assigned overlapping shifts
-- =====================================================
CREATE OR REPLACE FUNCTION validate_shift_overlap(
  p_driver_id UUID,
  p_shift_start TIMESTAMP,
  p_shift_end TIMESTAMP
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_overlap_count
  FROM driver_shifts
  WHERE driver_id = p_driver_id
    AND status NOT IN ('CANCELLED', 'COMPLETED')
    AND (p_shift_start, p_shift_end) OVERLAPS (shift_start, shift_end);
  
  RETURN v_overlap_count = 0;
END;
$$;

-- =====================================================
-- 2. CHECK DRIVER REST REQUIREMENT
-- Ensures drivers have adequate rest between shifts
-- =====================================================
CREATE OR REPLACE FUNCTION check_driver_rest_requirement(
  p_driver_id UUID,
  p_proposed_shift_start TIMESTAMP
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_shift_end TIMESTAMP;
  v_hours_since_last_shift NUMERIC;
  v_requires_rest BOOLEAN := false;
  v_rest_hours_remaining NUMERIC := 0;
BEGIN
  -- Get the end time of the driver's last shift
  SELECT MAX(shift_end)
  INTO v_last_shift_end
  FROM driver_shifts
  WHERE driver_id = p_driver_id
    AND shift_end < p_proposed_shift_start
    AND status = 'COMPLETED';
  
  IF v_last_shift_end IS NOT NULL THEN
    v_hours_since_last_shift := EXTRACT(EPOCH FROM (p_proposed_shift_start - v_last_shift_end)) / 3600;
    
    -- Require at least 8 hours rest
    IF v_hours_since_last_shift < 8 THEN
      v_requires_rest := true;
      v_rest_hours_remaining := 8 - v_hours_since_last_shift;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'requires_rest', v_requires_rest,
    'hours_since_last_shift', v_hours_since_last_shift,
    'rest_hours_remaining', v_rest_hours_remaining,
    'last_shift_end', v_last_shift_end
  );
END;
$$;

-- =====================================================
-- 3. AUTO-ASSIGN BUS
-- Finds the best available bus for a route and time
-- =====================================================
CREATE OR REPLACE FUNCTION auto_assign_bus(
  p_route_id UUID,
  p_shift_start TIMESTAMP,
  p_shift_end TIMESTAMP
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_bus_id UUID;
BEGIN
  SELECT b.id
  INTO v_bus_id
  FROM buses b
  WHERE b.status = 'active'
    AND b.fuel_level >= 20
    -- Not in maintenance
    AND NOT EXISTS (
      SELECT 1 FROM maintenance_records mr
      WHERE mr.bus_id = b.id
        AND mr.status IN ('in_progress', 'pending')
    )
    -- Not already assigned
    AND b.id NOT IN (
      SELECT bus_id FROM driver_shifts
      WHERE (p_shift_start, p_shift_end) OVERLAPS (shift_start, shift_end)
        AND status NOT IN ('CANCELLED', 'COMPLETED')
    )
  ORDER BY 
    b.fuel_level DESC,
    b.mileage ASC,
    RANDOM()
  LIMIT 1;
  
  RETURN v_bus_id;
END;
$$;

-- =====================================================
-- 4. ASSIGN DRIVER TO TRIP
-- Manually assign a driver to a specific trip
-- =====================================================
CREATE OR REPLACE FUNCTION assign_driver_to_trip(
  p_driver_id UUID,
  p_schedule_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule RECORD;
  v_bus_id UUID;
  v_conductor_id UUID;
  v_shift_start TIMESTAMP;
  v_shift_end TIMESTAMP;
  v_shift_id UUID;
  v_result JSON;
BEGIN
  -- Get schedule details
  SELECT 
    s.id,
    s.route_id,
    s.departure_date,
    s.departure_time,
    s.arrival_time
  INTO v_schedule
  FROM schedules s
  WHERE s.id = p_schedule_id;
  
  IF v_schedule.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Schedule not found');
  END IF;
  
  -- Calculate shift times
  v_shift_start := (v_schedule.departure_date + v_schedule.departure_time) - INTERVAL '1.5 hours';
  v_shift_end := (v_schedule.departure_date + v_schedule.arrival_time) + INTERVAL '30 minutes';
  
  -- Validate no overlap
  IF NOT validate_shift_overlap(p_driver_id, v_shift_start, v_shift_end) THEN
    RETURN json_build_object('success', false, 'error', 'Driver has overlapping shift');
  END IF;
  
  -- Check rest requirement
  DECLARE
    v_rest_check JSON;
  BEGIN
    v_rest_check := check_driver_rest_requirement(p_driver_id, v_shift_start);
    IF (v_rest_check->>'requires_rest')::BOOLEAN THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Driver requires rest',
        'rest_info', v_rest_check
      );
    END IF;
  END;
  
  -- Auto-assign bus
  v_bus_id := auto_assign_bus(v_schedule.route_id, v_shift_start, v_shift_end);
  
  IF v_bus_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No available bus');
  END IF;
  
  -- Find conductor
  SELECT id INTO v_conductor_id
  FROM staff
  WHERE position = 'conductor'
    AND status = 'active'
    AND id NOT IN (
      SELECT conductor_id FROM driver_shifts
      WHERE conductor_id IS NOT NULL
        AND (v_shift_start, v_shift_end) OVERLAPS (shift_start, shift_end)
        AND status NOT IN ('CANCELLED', 'COMPLETED')
    )
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Create shift
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
    p_driver_id,
    v_bus_id,
    v_conductor_id,
    p_schedule_id,
    v_schedule.route_id,
    v_schedule.departure_date,
    v_shift_start,
    v_shift_end,
    'SCHEDULED',
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_shift_id;
  
  -- Send notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    created_at
  )
  SELECT 
    d.user_id,
    'New Shift Assigned',
    format('You have been assigned to a new shift on %s', 
      to_char(v_schedule.departure_date, 'DD Mon YYYY')
    ),
    'shift_assignment',
    NOW()
  FROM drivers d
  WHERE d.id = p_driver_id;
  
  v_result := json_build_object(
    'success', true,
    'shift_id', v_shift_id,
    'bus_id', v_bus_id,
    'conductor_id', v_conductor_id
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- 5. TRIGGER: AUTO-CREATE SHIFTS ON TRIP CREATED
-- Automatically generate shifts when new schedules are created
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_auto_create_shift()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-create for schedules more than 24 hours in the future
  IF NEW.departure_date > CURRENT_DATE THEN
    -- Queue for background processing
    INSERT INTO shift_generation_queue (
      schedule_id,
      route_id,
      departure_date,
      status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.route_id,
      NEW.departure_date,
      'pending',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS auto_create_shift_on_schedule ON schedules;
CREATE TRIGGER auto_create_shift_on_schedule
  AFTER INSERT ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_create_shift();

-- =====================================================
-- 6. CREATE SHIFT GENERATION QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  departure_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_queue_status ON shift_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_shift_queue_date ON shift_generation_queue(departure_date);

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_shift_overlap(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION check_driver_rest_requirement(UUID, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_bus(UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_driver_to_trip(UUID, UUID) TO authenticated;
GRANT ALL ON TABLE shift_generation_queue TO authenticated;

COMMENT ON FUNCTION validate_shift_overlap IS 'Checks if a proposed shift overlaps with existing shifts for a driver';
COMMENT ON FUNCTION check_driver_rest_requirement IS 'Validates that a driver has adequate rest before a new shift';
COMMENT ON FUNCTION auto_assign_bus IS 'Automatically selects the best available bus for a shift';
COMMENT ON FUNCTION assign_driver_to_trip IS 'Manually assigns a driver to a specific trip with validation';
COMMENT ON TABLE shift_generation_queue IS 'Queue for background processing of automatic shift generation';
