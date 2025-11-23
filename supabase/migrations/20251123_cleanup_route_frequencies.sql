-- ============================================
-- CLEANUP ROUTE FREQUENCIES
-- Remove bus_id and driver_id from route_frequencies
-- These should only exist in driver_shifts
-- ============================================

-- Remove columns if they exist
ALTER TABLE route_frequencies 
  DROP COLUMN IF EXISTS bus_id,
  DROP COLUMN IF EXISTS driver_id;

-- Ensure route_frequencies has correct structure
-- This table defines the SCHEDULE (when routes run)
-- NOT who drives them (that's in driver_shifts)

COMMENT ON TABLE route_frequencies IS 'Defines when routes run (automated schedules). Driver and bus assignments are in driver_shifts table.';

-- Update the is_active column to use boolean properly
ALTER TABLE route_frequencies 
  ALTER COLUMN active TYPE BOOLEAN USING (active::boolean),
  ALTER COLUMN active SET DEFAULT true;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_route_frequencies_route_id ON route_frequencies(route_id);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_active ON route_frequencies(active);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_days ON route_frequencies USING GIN(days_of_week);

-- Add helpful view for route schedules
CREATE OR REPLACE VIEW route_schedules AS
SELECT 
  rf.id as frequency_id,
  rf.route_id,
  r.route_code,
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
  -- Get route stops
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

COMMENT ON VIEW route_schedules IS 'Complete view of route schedules with stops. Use driver_shifts to see who is assigned.';
