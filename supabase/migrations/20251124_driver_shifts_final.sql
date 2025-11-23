-- ============================================
-- REDESIGNED DRIVER SHIFTS SYSTEM (FINAL)
-- Links drivers to routes (not individual trips)
-- Matches actual database schema
-- ============================================

-- Drop old objects if exist
DROP TABLE IF EXISTS driver_shifts CASCADE;
DROP VIEW IF EXISTS shift_calendar_view CASCADE;
DROP VIEW IF EXISTS route_schedules CASCADE;
DROP FUNCTION IF EXISTS get_driver_shifts_for_period CASCADE;
DROP FUNCTION IF EXISTS get_shift_calendar CASCADE;
DROP FUNCTION IF EXISTS auto_assign_driver_shifts CASCADE;

-- Create new driver_shifts table
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  days_of_week TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  shift_type TEXT DEFAULT 'single' CHECK (shift_type IN ('single', 'recurring')),
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
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

-- Prevent duplicate assignments
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
CREATE POLICY driver_shifts_select_driver_view
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = driver_shifts.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY driver_shifts_select_operations
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations', 'dispatcher')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY driver_shifts_insert_operations
  ON driver_shifts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY driver_shifts_update_operations
  ON driver_shifts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY driver_shifts_delete_operations
  ON driver_shifts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations')
      AND user_roles.is_active = true
    )
  );

-- Comprehensive view
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
  -- Route info
  r.id as route_id,
  r.origin,
  r.destination,
  r.distance_km,
  r.base_fare,
  -- Bus info
  b.id as bus_id,
  b.registration_number,
  b.seating_capacity,
  b.status as bus_status,
  -- Route frequency info
  (
    SELECT json_agg(
      json_build_object(
        'id', rf.id,
        'departure_time', rf.departure_time,
        'frequency_type', rf.frequency_type,
        'days_of_week', rf.days_of_week
      ) ORDER BY rf.departure_time
    )
    FROM route_frequencies rf
    WHERE rf.route_id = r.id
    AND rf.active = true
  ) as route_schedules
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
JOIN routes r ON ds.route_id = r.id
LEFT JOIN buses b ON ds.bus_id = b.id;

GRANT SELECT ON shift_calendar_view TO authenticated;

-- Function: Get driver shifts for a date range
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
    r.origin,
    r.destination,
    b.registration_number as bus_registration,
    ds.shift_date,
    ds.status,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'departure_time', rf.departure_time,
          'frequency_type', rf.frequency_type
        ) ORDER BY rf.departure_time
      )
      FROM route_frequencies rf
      WHERE rf.route_id = r.id
      AND rf.active = true
      AND (
        LOWER(TO_CHAR(ds.shift_date, 'FMDay')) = ANY(
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

-- Function: Get calendar view
CREATE OR REPLACE FUNCTION get_shift_calendar(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  shift_id UUID,
  calendar_date DATE,
  driver_id UUID,
  driver_name TEXT,
  route_id UUID,
  route_display TEXT,
  bus_registration TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id as shift_id,
    ds.shift_date as calendar_date,
    d.id as driver_id,
    d.full_name as driver_name,
    r.id as route_id,
    (r.origin || ' → ' || r.destination) as route_display,
    b.registration_number as bus_registration
  FROM driver_shifts ds
  JOIN drivers d ON ds.driver_id = d.id
  JOIN routes r ON ds.route_id = r.id
  LEFT JOIN buses b ON ds.bus_id = b.id
  WHERE ds.shift_date >= p_start_date
    AND ds.shift_date <= p_end_date
    AND ds.status = 'active'
  ORDER BY ds.shift_date, d.full_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-assign drivers to routes
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
  FOR v_date IN 
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE
  LOOP
    FOR v_route IN 
      SELECT * FROM routes 
      WHERE (p_route_ids IS NULL OR id = ANY(p_route_ids))
      AND (status = 'active' OR is_active = true)
    LOOP
      SELECT * INTO v_driver
      FROM drivers
      WHERE status = 'active'
      AND id NOT IN (
        SELECT driver_id FROM driver_shifts 
        WHERE shift_date = v_date AND status = 'active'
      )
      ORDER BY full_name
      LIMIT 1;

      IF FOUND THEN
        SELECT * INTO v_bus
        FROM buses
        WHERE status = 'active'
        AND id NOT IN (
          SELECT bus_id FROM driver_shifts 
          WHERE shift_date = v_date AND status = 'active' AND bus_id IS NOT NULL
        )
        ORDER BY seating_capacity DESC
        LIMIT 1;

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

        IF FOUND THEN
          v_assigned := v_assigned + 1;
        END IF;
      ELSE
        v_conflicts := v_conflicts + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT v_assigned, v_conflicts, 
    format('Assigned %s shifts, %s conflicts', v_assigned, v_conflicts);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_driver_shifts_for_period(DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_calendar(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_driver_shifts(DATE, DATE, UUID[]) TO authenticated;

-- ============================================
-- CLEANUP ROUTE FREQUENCIES
-- ============================================

-- Remove bus_id and driver_id if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='route_frequencies' AND column_name='bus_id') THEN
    ALTER TABLE route_frequencies DROP COLUMN bus_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='route_frequencies' AND column_name='driver_id') THEN
    ALTER TABLE route_frequencies DROP COLUMN driver_id;
  END IF;
END $$;

-- Ensure indexes
CREATE INDEX IF NOT EXISTS idx_route_frequencies_route_id ON route_frequencies(route_id);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_active ON route_frequencies(active);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_days ON route_frequencies USING GIN(days_of_week);

-- Route schedules view
CREATE OR REPLACE VIEW route_schedules AS
SELECT 
  rf.id as frequency_id,
  rf.route_id,
  r.origin,
  r.destination,
  r.distance_km,
  r.base_fare,
  rf.departure_time,
  rf.frequency_type,
  rf.days_of_week,
  rf.interval_days,
  rf.fare_per_seat,
  rf.active,
  (
    SELECT json_agg(
      json_build_object(
        'stop_order', rs.stop_order,
        'city_name', rs.city_name,
        'arrival_offset_minutes', rs.arrival_offset_minutes,
        'departure_offset_minutes', rs.departure_offset_minutes
      ) ORDER BY rs.stop_order
    )
    FROM route_stops rs
    WHERE rs.route_id = r.id
  ) as stops
FROM route_frequencies rf
JOIN routes r ON rf.route_id = r.id
WHERE rf.active = true
ORDER BY r.origin, r.destination, rf.departure_time;

GRANT SELECT ON route_schedules TO authenticated;

-- Comments
COMMENT ON TABLE driver_shifts IS 'Driver shift assignments linking drivers to routes';
COMMENT ON TABLE route_frequencies IS 'Defines when routes run (automated schedules). Driver and bus assignments are in driver_shifts table.';
COMMENT ON VIEW shift_calendar_view IS 'Calendar view of driver shifts with all related details';
COMMENT ON VIEW route_schedules IS 'Complete view of route schedules with stops. Use driver_shifts to see who is assigned.';
