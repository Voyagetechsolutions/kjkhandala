-- ============================================
-- REDESIGNED DRIVER SHIFTS SYSTEM
-- Links drivers to route frequencies (not individual trips)
-- ============================================

-- Drop old table if exists
DROP TABLE IF EXISTS driver_shifts CASCADE;
DROP VIEW IF EXISTS shift_details CASCADE;

-- Create new driver_shifts table based on route frequencies
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  -- Days of week this shift applies to (for recurring shifts)
  days_of_week TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  -- Shift type
  shift_type TEXT DEFAULT 'single' CHECK (shift_type IN ('single', 'recurring')),
  -- Recurring shift end date (if applicable)
  end_date DATE,
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_driver_shifts_driver_id ON driver_shifts(driver_id);
CREATE INDEX idx_driver_shifts_route_id ON driver_shifts(route_id);
CREATE INDEX idx_driver_shifts_bus_id ON driver_shifts(bus_id);
CREATE INDEX idx_driver_shifts_shift_date ON driver_shifts(shift_date);
CREATE INDEX idx_driver_shifts_status ON driver_shifts(status);
CREATE INDEX idx_driver_shifts_date_range ON driver_shifts(shift_date, end_date);

-- Prevent duplicate assignments for same driver on same date
CREATE UNIQUE INDEX idx_driver_shifts_unique_assignment 
  ON driver_shifts(driver_id, shift_date, route_id) 
  WHERE status = 'active';

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_driver_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_driver_shifts_updated_at ON driver_shifts;
CREATE TRIGGER trigger_update_driver_shifts_updated_at
  BEFORE UPDATE ON driver_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_shifts_updated_at();

-- Enable RLS
ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own shifts"
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = driver_shifts.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Operations can view all shifts"
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations', 'dispatcher')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Operations can manage shifts"
  ON driver_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations')
      AND user_roles.is_active = true
    )
  );

-- Create comprehensive view
CREATE OR REPLACE VIEW shift_calendar_view AS
SELECT 
  ds.id,
  ds.shift_date,
  ds.shift_type,
  ds.end_date,
  ds.days_of_week,
  ds.status,
  ds.notes,
  -- Driver info
  d.id as driver_id,
  d.full_name as driver_name,
  d.phone as driver_phone,
  d.license_number,
  d.rating as driver_rating,
  -- Route info
  r.id as route_id,
  r.route_code,
  r.origin,
  r.destination,
  r.distance_km,
  r.estimated_duration_minutes,
  -- Bus info
  b.id as bus_id,
  b.registration_number,
  b.seating_capacity,
  b.status as bus_status,
  -- Route frequency info (to show scheduled times)
  (
    SELECT json_agg(
      json_build_object(
        'id', rf.id,
        'departure_time', rf.departure_time,
        'arrival_time', rf.arrival_time,
        'frequency_type', rf.frequency_type,
        'days_of_week', rf.days_of_week
      )
    )
    FROM route_frequencies rf
    WHERE rf.route_id = r.id
    AND rf.is_active = true
  ) as route_schedules
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
JOIN routes r ON ds.route_id = r.id
LEFT JOIN buses b ON ds.bus_id = b.id;

-- Grant permissions
GRANT SELECT ON shift_calendar_view TO authenticated;

-- Helper function to get driver shifts for a date range
CREATE OR REPLACE FUNCTION get_driver_shifts_for_period(
  p_start_date DATE,
  p_end_date DATE,
  p_driver_id UUID DEFAULT NULL
)
RETURNS TABLE (
  shift_id UUID,
  driver_id UUID,
  driver_name TEXT,
  route_id UUID,
  route_code TEXT,
  origin TEXT,
  destination TEXT,
  bus_registration TEXT,
  shift_date DATE,
  status TEXT,
  scheduled_times JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id as shift_id,
    d.id as driver_id,
    d.full_name as driver_name,
    r.id as route_id,
    r.route_code,
    r.origin,
    r.destination,
    b.registration_number as bus_registration,
    ds.shift_date,
    ds.status,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'departure_time', rf.departure_time,
          'arrival_time', rf.arrival_time
        )
      )
      FROM route_frequencies rf
      WHERE rf.route_id = r.id
      AND rf.is_active = true
      AND (
        -- Check if this day of week matches
        LOWER(TO_CHAR(ds.shift_date, 'Day')) = ANY(
          SELECT LOWER(TRIM(day)) FROM unnest(rf.days_of_week) as day
        )
      )
    ) as scheduled_times
  FROM driver_shifts ds
  JOIN drivers d ON ds.driver_id = d.id
  JOIN routes r ON ds.route_id = r.id
  LEFT JOIN buses b ON ds.bus_id = b.id
  WHERE ds.shift_date >= p_start_date
    AND ds.shift_date <= p_end_date
    AND (p_driver_id IS NULL OR ds.driver_id = p_driver_id)
    AND ds.status = 'active'
  ORDER BY ds.shift_date, d.full_name;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get calendar view for operations dashboard
CREATE OR REPLACE FUNCTION get_shift_calendar(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  calendar_date DATE,
  driver_id UUID,
  driver_name TEXT,
  route_id UUID,
  route_display TEXT,
  bus_registration TEXT,
  shift_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.shift_date as calendar_date,
    d.id as driver_id,
    d.full_name as driver_name,
    r.id as route_id,
    (r.origin || ' → ' || r.destination) as route_display,
    b.registration_number as bus_registration,
    COUNT(*)::INTEGER as shift_count
  FROM driver_shifts ds
  JOIN drivers d ON ds.driver_id = d.id
  JOIN routes r ON ds.route_id = r.id
  LEFT JOIN buses b ON ds.bus_id = b.id
  WHERE ds.shift_date >= p_start_date
    AND ds.shift_date <= p_end_date
    AND ds.status = 'active'
  GROUP BY ds.shift_date, d.id, d.full_name, r.id, r.origin, r.destination, b.registration_number
  ORDER BY ds.shift_date, d.full_name;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign drivers to routes for a date range
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
BEGIN
  -- Loop through each date in range
  FOR v_date IN 
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE
  LOOP
    -- Loop through each route
    FOR v_route IN 
      SELECT * FROM routes 
      WHERE (p_route_ids IS NULL OR id = ANY(p_route_ids))
      AND status = 'active'
    LOOP
      -- Find available driver (not already assigned on this date)
      SELECT * INTO v_driver
      FROM drivers
      WHERE status = 'active'
      AND license_expiry > v_date
      AND id NOT IN (
        SELECT driver_id FROM driver_shifts 
        WHERE shift_date = v_date AND status = 'active'
      )
      ORDER BY rating DESC NULLS LAST, full_name
      LIMIT 1;
      
      IF v_driver.id IS NOT NULL THEN
        -- Find available bus
        SELECT * INTO v_bus
        FROM buses
        WHERE status = 'active'
        AND id NOT IN (
          SELECT bus_id FROM driver_shifts 
          WHERE shift_date = v_date AND status = 'active' AND bus_id IS NOT NULL
        )
        ORDER BY seating_capacity DESC
        LIMIT 1;
        
        -- Insert shift assignment
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
          v_bus.id,
          v_date,
          'single',
          'active'
        )
        ON CONFLICT (driver_id, shift_date, route_id) 
        WHERE status = 'active'
        DO NOTHING;
        
        v_assigned := v_assigned + 1;
      ELSE
        v_conflicts := v_conflicts + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT v_assigned, v_conflicts, 
    format('Assigned %s shifts, %s conflicts', v_assigned, v_conflicts);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_driver_shifts_for_period(DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_calendar(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_driver_shifts(DATE, DATE, UUID[]) TO authenticated;

-- Comments
COMMENT ON TABLE driver_shifts IS 'Driver shift assignments linking drivers to routes (not individual trips)';
COMMENT ON VIEW shift_calendar_view IS 'Calendar view of driver shifts with all related details';
COMMENT ON FUNCTION get_driver_shifts_for_period IS 'Get driver shifts for a date range with scheduled times';
COMMENT ON FUNCTION get_shift_calendar IS 'Get calendar view for operations dashboard';
COMMENT ON FUNCTION auto_assign_driver_shifts IS 'Automatically assign drivers to routes for a date range';
