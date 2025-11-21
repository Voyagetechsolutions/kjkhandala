-- ============================================
-- FIX FLEET ALERTS - Create fleet_alerts as VIEW
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing fleet_alerts if it exists as a table
DROP TABLE IF EXISTS public.fleet_alerts CASCADE;

-- Create fleet_alerts as a VIEW combining multiple sources
-- This provides a unified alert system for the Fleet Management dashboard
-- ============================================

CREATE OR REPLACE VIEW public.fleet_alerts AS
-- 1. Maintenance Alerts (from maintenance_alerts table)
SELECT 
  ma.id,
  ma.bus_id,
  'maintenance' AS type,
  ma.alert_type AS severity,
  ma.message,
  ma.status,
  ma.created_at,
  ma.resolved_at,
  b.registration_number AS bus_number,
  b.model AS bus_model
FROM public.maintenance_alerts ma
JOIN public.buses b ON b.id = ma.bus_id
WHERE ma.status = 'active'

UNION ALL

-- 2. Overdue Maintenance (from maintenance_reminders)
SELECT 
  mr.id,
  mr.bus_id,
  'overdue_maintenance' AS type,
  CASE 
    WHEN mr.priority = 'critical' THEN 'critical'
    WHEN mr.priority = 'high' THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT(mr.reminder_type, ' - Due: ', mr.due_date) AS message,
  mr.status,
  mr.created_at,
  mr.updated_at AS resolved_at,
  b.registration_number AS bus_number,
  b.model AS bus_model
FROM public.maintenance_reminders mr
JOIN public.buses b ON b.id = mr.bus_id
WHERE mr.status = 'pending' 
  AND mr.due_date < CURRENT_DATE

UNION ALL

-- 3. GPS/Location Alerts (from gps_tracking - off route detection)
SELECT 
  gt.id,
  gt.bus_id,
  'off_route' AS type,
  'high' AS severity,
  CONCAT('Bus off route - Last location: ', gt.location) AS message,
  'active' AS status,
  gt.timestamp AS created_at,
  NULL AS resolved_at,
  b.registration_number AS bus_number,
  b.model AS bus_model
FROM public.gps_tracking gt
JOIN public.buses b ON b.id = gt.bus_id
WHERE gt.timestamp > NOW() - INTERVAL '1 hour'
  AND gt.status = 'off_route'

UNION ALL

-- 4. Low Fuel Alerts (from buses table)
SELECT 
  gen_random_uuid() AS id,
  b.id AS bus_id,
  'low_fuel' AS type,
  'medium' AS severity,
  CONCAT('Low fuel level: ', COALESCE(b.fuel_level, 0), '%') AS message,
  'active' AS status,
  NOW() AS created_at,
  NULL AS resolved_at,
  b.registration_number AS bus_number,
  b.model AS bus_model
FROM public.buses b
WHERE COALESCE(b.fuel_level, 100) < 20

UNION ALL

-- 5. Inspection Due Alerts (from buses table)
SELECT 
  gen_random_uuid() AS id,
  b.id AS bus_id,
  'inspection_due' AS type,
  CASE 
    WHEN b.next_service_date < CURRENT_DATE THEN 'critical'
    WHEN b.next_service_date < CURRENT_DATE + INTERVAL '7 days' THEN 'high'
    ELSE 'medium'
  END AS severity,
  CONCAT('Service due: ', b.next_service_date) AS message,
  'active' AS status,
  NOW() AS created_at,
  NULL AS resolved_at,
  b.registration_number AS bus_number,
  b.model AS bus_model
FROM public.buses b
WHERE b.next_service_date IS NOT NULL
  AND b.next_service_date <= CURRENT_DATE + INTERVAL '14 days'
  AND b.status != 'maintenance';

-- Add comment
COMMENT ON VIEW public.fleet_alerts IS 'Unified fleet alerts from multiple sources: maintenance, GPS, fuel, inspections';

-- Grant access
GRANT SELECT ON public.fleet_alerts TO authenticated;
GRANT SELECT ON public.fleet_alerts TO service_role;


-- ============================================
-- Create bus_locations VIEW (for GPS tracking)
-- ============================================

DROP VIEW IF EXISTS public.bus_locations CASCADE;

CREATE OR REPLACE VIEW public.bus_locations AS
SELECT DISTINCT ON (gt.bus_id)
  gt.id,
  gt.bus_id,
  gt.location AS current_location,
  gt.latitude,
  gt.longitude,
  gt.speed,
  gt.heading,
  gt.timestamp AS last_updated,
  gt.status,
  b.registration_number AS bus_number,
  b.model AS bus_model,
  t.id AS current_trip_id,
  r.route_name,
  r.origin_city,
  r.destination_city
FROM public.gps_tracking gt
JOIN public.buses b ON b.id = gt.bus_id
LEFT JOIN public.trips t ON t.bus_id = gt.bus_id 
  AND t.status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS')
LEFT JOIN public.routes r ON r.id = t.route_id
ORDER BY gt.bus_id, gt.timestamp DESC;

-- Add comment
COMMENT ON VIEW public.bus_locations IS 'Latest GPS location for each bus with current trip info';

-- Grant access
GRANT SELECT ON public.bus_locations TO authenticated;
GRANT SELECT ON public.bus_locations TO service_role;


-- ============================================
-- Create fleet_status_summary VIEW
-- ============================================

DROP VIEW IF EXISTS public.fleet_status_summary CASCADE;

CREATE OR REPLACE VIEW public.fleet_status_summary AS
SELECT 
  b.id AS bus_id,
  b.registration_number AS bus_number,
  b.model,
  b.status,
  b.seating_capacity,
  b.fuel_level,
  b.odometer,
  b.next_service_date,
  
  -- Current trip info
  t.id AS current_trip_id,
  t.status AS trip_status,
  r.route_name,
  r.origin_city,
  r.destination_city,
  t.departure_time,
  
  -- Driver info
  d.full_name AS driver_name,
  d.phone AS driver_phone,
  
  -- GPS location
  bl.current_location,
  bl.latitude,
  bl.longitude,
  bl.last_updated AS location_updated,
  
  -- Maintenance status
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM maintenance_alerts ma 
      WHERE ma.bus_id = b.id AND ma.status = 'active'
    ) THEN 'has_alerts'
    WHEN b.next_service_date < CURRENT_DATE THEN 'service_overdue'
    WHEN b.next_service_date < CURRENT_DATE + INTERVAL '7 days' THEN 'service_due_soon'
    ELSE 'ok'
  END AS maintenance_status,
  
  -- Alert count
  (
    SELECT COUNT(*) FROM fleet_alerts fa 
    WHERE fa.bus_id = b.id AND fa.status = 'active'
  ) AS active_alerts_count

FROM public.buses b
LEFT JOIN public.trips t ON t.bus_id = b.id 
  AND t.status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS')
LEFT JOIN public.routes r ON r.id = t.route_id
LEFT JOIN public.drivers d ON d.id = t.driver_id
LEFT JOIN public.bus_locations bl ON bl.bus_id = b.id
ORDER BY b.registration_number;

-- Add comment
COMMENT ON VIEW public.fleet_status_summary IS 'Complete fleet status with trips, drivers, GPS, and maintenance';

-- Grant access
GRANT SELECT ON public.fleet_status_summary TO authenticated;
GRANT SELECT ON public.fleet_status_summary TO service_role;


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test fleet_alerts view
SELECT 
  type,
  severity,
  COUNT(*) as alert_count
FROM public.fleet_alerts
GROUP BY type, severity
ORDER BY type, severity;

-- Test bus_locations view
SELECT * FROM public.bus_locations LIMIT 5;

-- Test fleet_status_summary view
SELECT 
  bus_number,
  status,
  maintenance_status,
  active_alerts_count,
  route_name
FROM public.fleet_status_summary
LIMIT 10;

-- Count alerts by type
SELECT 
  type,
  COUNT(*) as count
FROM public.fleet_alerts
GROUP BY type
ORDER BY count DESC;


-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Fleet alerts system fixed successfully!';
  RAISE NOTICE '✅ fleet_alerts view created (combines maintenance, GPS, fuel, inspections)';
  RAISE NOTICE '✅ bus_locations view created (latest GPS for each bus)';
  RAISE NOTICE '✅ fleet_status_summary view created (complete fleet overview)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Fleet Management dashboard will now show:';
  RAISE NOTICE '   - Total buses from buses table';
  RAISE NOTICE '   - Active buses from current trips';
  RAISE NOTICE '   - Under maintenance from maintenance_alerts';
  RAISE NOTICE '   - Off-route from GPS tracking';
  RAISE NOTICE '   - All alerts from unified fleet_alerts view';
END $$;
