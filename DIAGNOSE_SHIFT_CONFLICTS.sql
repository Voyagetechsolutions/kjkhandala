-- =====================================================
-- DIAGNOSE SHIFT GENERATION CONFLICTS
-- Run these queries to understand why shifts aren't generating
-- =====================================================

-- 1. Check active drivers available
SELECT 
  COUNT(*) as total_active_drivers,
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') THEN 1 END) as active_status_drivers
FROM drivers;

-- 2. Check active buses available
SELECT 
  COUNT(*) as total_active_buses,
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') THEN 1 END) as active_status_buses
FROM buses;

-- 3. Check active routes
SELECT 
  COUNT(*) as total_routes,
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') OR is_active = true THEN 1 END) as active_routes
FROM routes;

-- 4. Check active route frequencies (schedules)
SELECT 
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN active = true THEN 1 END) as active_schedules
FROM route_frequencies;

-- 5. View active schedules with details
SELECT 
  rf.id,
  rf.frequency_type,
  rf.days_of_week,
  rf.departure_time,
  r.origin || ' → ' || r.destination as route,
  d.full_name as assigned_driver,
  b.registration_number as assigned_bus
FROM route_frequencies rf
JOIN routes r ON rf.route_id = r.id
LEFT JOIN drivers d ON rf.driver_id = d.id
LEFT JOIN buses b ON rf.bus_id = b.id
WHERE rf.active = true;

-- 6. Check existing shifts for target date range
-- Replace dates with your target range
SELECT 
  ds.shift_date,
  COUNT(*) as shifts_count,
  COUNT(DISTINCT ds.driver_id) as unique_drivers,
  COUNT(DISTINCT ds.bus_id) as unique_buses
FROM driver_shifts ds
WHERE ds.shift_date BETWEEN '2025-11-22' AND '2025-11-30'
  AND ds.status IN ('active', 'ACTIVE')
GROUP BY ds.shift_date
ORDER BY ds.shift_date;

-- 7. Find drivers with multiple shifts on same day (conflicts)
SELECT 
  ds.shift_date,
  d.full_name,
  COUNT(*) as shift_count,
  array_agg(r.origin || ' → ' || r.destination) as routes
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
JOIN routes r ON ds.route_id = r.id
WHERE ds.shift_date BETWEEN '2025-11-22' AND '2025-11-30'
  AND ds.status IN ('active', 'ACTIVE')
GROUP BY ds.shift_date, d.full_name
HAVING COUNT(*) > 1
ORDER BY ds.shift_date, shift_count DESC;

-- 8. Find buses with multiple assignments on same day (conflicts)
SELECT 
  ds.shift_date,
  b.registration_number,
  COUNT(*) as assignment_count,
  array_agg(r.origin || ' → ' || r.destination) as routes
FROM driver_shifts ds
JOIN buses b ON ds.bus_id = b.id
JOIN routes r ON ds.route_id = r.id
WHERE ds.shift_date BETWEEN '2025-11-22' AND '2025-11-30'
  AND ds.status IN ('active', 'ACTIVE')
  AND ds.bus_id IS NOT NULL
GROUP BY ds.shift_date, b.registration_number
HAVING COUNT(*) > 1
ORDER BY ds.shift_date, assignment_count DESC;

-- 9. Test auto-generation for a single day
-- This will show you what happens when you try to generate
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  '2025-11-22'::DATE,
  '2025-11-22'::DATE
);

-- 10. Check if there are enough drivers for all schedules
WITH schedule_demand AS (
  SELECT 
    COUNT(*) as schedules_needing_drivers
  FROM route_frequencies
  WHERE active = true
),
driver_supply AS (
  SELECT 
    COUNT(*) as available_drivers
  FROM drivers
  WHERE status IN ('active', 'ACTIVE')
)
SELECT 
  sd.schedules_needing_drivers,
  ds.available_drivers,
  CASE 
    WHEN ds.available_drivers >= sd.schedules_needing_drivers 
    THEN '✓ Enough drivers'
    ELSE '✗ Not enough drivers'
  END as assessment
FROM schedule_demand sd, driver_supply ds;

-- 11. Detailed conflict analysis for specific date
-- Replace '2025-11-22' with your target date
WITH target_date AS (
  SELECT '2025-11-22'::DATE as check_date
),
day_schedules AS (
  SELECT 
    rf.*,
    r.origin,
    r.destination,
    EXTRACT(DOW FROM (SELECT check_date FROM target_date))::INTEGER as target_dow
  FROM route_frequencies rf
  JOIN routes r ON rf.route_id = r.id
  WHERE rf.active = true
    AND (
      rf.frequency_type = 'DAILY'
      OR (rf.frequency_type = 'SPECIFIC_DAYS' 
          AND EXTRACT(DOW FROM (SELECT check_date FROM target_date))::INTEGER = ANY(rf.days_of_week))
      OR (rf.frequency_type = 'WEEKLY' 
          AND EXTRACT(DOW FROM (SELECT check_date FROM target_date))::INTEGER = ANY(rf.days_of_week))
    )
),
existing_shifts AS (
  SELECT 
    ds.*,
    d.full_name as driver_name,
    r.origin || ' → ' || r.destination as route_name
  FROM driver_shifts ds
  JOIN drivers d ON ds.driver_id = d.id
  JOIN routes r ON ds.route_id = r.id
  WHERE ds.shift_date = (SELECT check_date FROM target_date)
    AND ds.status IN ('active', 'ACTIVE')
)
SELECT 
  (SELECT check_date FROM target_date) as date_checked,
  (SELECT COUNT(*) FROM day_schedules) as schedules_for_this_day,
  (SELECT COUNT(*) FROM existing_shifts) as existing_shifts,
  (SELECT COUNT(*) FROM drivers WHERE status IN ('active', 'ACTIVE')) as available_drivers,
  (SELECT COUNT(*) FROM buses WHERE status IN ('active', 'ACTIVE')) as available_buses;

-- 12. Show which schedules would generate shifts for a specific day
-- Replace '2025-11-22' with your target date
SELECT 
  rf.id,
  r.origin || ' → ' || r.destination as route,
  rf.departure_time,
  rf.frequency_type,
  rf.days_of_week,
  EXTRACT(DOW FROM '2025-11-22'::DATE)::INTEGER as day_of_week,
  CASE 
    WHEN rf.frequency_type = 'DAILY' THEN 'YES - Daily schedule'
    WHEN rf.frequency_type = 'SPECIFIC_DAYS' 
         AND EXTRACT(DOW FROM '2025-11-22'::DATE)::INTEGER = ANY(rf.days_of_week) 
    THEN 'YES - Matches specific day'
    WHEN rf.frequency_type = 'WEEKLY' 
         AND EXTRACT(DOW FROM '2025-11-22'::DATE)::INTEGER = ANY(rf.days_of_week) 
    THEN 'YES - Matches weekly schedule'
    ELSE 'NO - Does not match'
  END as will_generate
FROM route_frequencies rf
JOIN routes r ON rf.route_id = r.id
WHERE rf.active = true
ORDER BY will_generate DESC, rf.departure_time;
