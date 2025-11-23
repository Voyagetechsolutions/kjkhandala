-- =====================================================
-- DIAGNOSTIC QUERIES FOR SHIFT AUTO-ASSIGNMENT
-- Run these in Supabase SQL Editor to diagnose issues
-- =====================================================

-- 1. Check how many active drivers exist
SELECT 
  COUNT(*) as total_drivers,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_drivers,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_drivers
FROM drivers;

-- 2. Check driver status values (to see if 'active' is the right value)
SELECT status, COUNT(*) as count
FROM drivers
GROUP BY status
ORDER BY count DESC;

-- 3. Check how many active routes exist
SELECT 
  COUNT(*) as total_routes,
  COUNT(CASE WHEN status = 'active' OR is_active = true THEN 1 END) as active_routes
FROM routes;

-- 4. Check existing shifts for a date range (adjust dates as needed)
SELECT 
  shift_date,
  COUNT(*) as total_shifts,
  COUNT(DISTINCT driver_id) as unique_drivers,
  COUNT(DISTINCT route_id) as unique_routes
FROM driver_shifts
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status = 'active'
GROUP BY shift_date
ORDER BY shift_date;

-- 5. Find drivers that are NOT assigned for today
SELECT 
  d.id,
  d.full_name,
  d.status
FROM drivers d
WHERE d.status = 'active'
  AND d.id NOT IN (
    SELECT driver_id 
    FROM driver_shifts 
    WHERE shift_date = CURRENT_DATE 
      AND status = 'active'
  )
ORDER BY d.full_name;

-- 6. Check if there are any buses available
SELECT 
  COUNT(*) as total_buses,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_buses
FROM buses;

-- 7. Test the function with a small date range
-- (Uncomment and adjust dates to test)
-- SELECT * FROM auto_assign_driver_shifts(
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '2 days',
--   NULL
-- );

-- 8. Check for any constraint conflicts
SELECT 
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'driver_shifts'
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 9. Sample some existing shifts to see the data structure
SELECT 
  ds.shift_date,
  d.full_name as driver_name,
  r.origin || ' → ' || r.destination as route,
  b.registration_number as bus,
  ds.status
FROM driver_shifts ds
JOIN drivers d ON d.id = ds.driver_id
JOIN routes r ON r.id = ds.route_id
LEFT JOIN buses b ON b.id = ds.bus_id
WHERE ds.shift_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ds.shift_date DESC
LIMIT 10;
