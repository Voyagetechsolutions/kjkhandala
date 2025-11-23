-- =====================================================
-- QUICK FIX: Shift Generation Conflicts
-- Run these in order to resolve common issues
-- =====================================================

-- STEP 1: Check current state
-- =====================================================
SELECT 
  'Active Drivers' as resource,
  COUNT(*) as count
FROM drivers
WHERE status IN ('active', 'ACTIVE')

UNION ALL

SELECT 
  'Active Buses',
  COUNT(*)
FROM buses
WHERE status IN ('active', 'ACTIVE')

UNION ALL

SELECT 
  'Active Schedules',
  COUNT(*)
FROM route_frequencies
WHERE active = true

UNION ALL

SELECT 
  'Active Routes',
  COUNT(*)
FROM routes
WHERE status IN ('active', 'ACTIVE') OR is_active = true;

-- If any count is 0, that's your problem!


-- STEP 2: Clear test shifts (OPTIONAL - only if testing)
-- =====================================================
-- ⚠️ WARNING: Uncomment only if you want to delete existing shifts!
-- This is useful for testing but will remove real data!

/*
DELETE FROM driver_shifts
WHERE shift_date BETWEEN '2025-11-22' AND '2025-11-30'
  AND status IN ('active', 'ACTIVE');
  
-- Verify deletion
SELECT 'Shifts deleted' as status, COUNT(*) as remaining_shifts
FROM driver_shifts
WHERE shift_date BETWEEN '2025-11-22' AND '2025-11-30';
*/


-- STEP 3: Ensure you have active schedules
-- =====================================================
-- Check if schedules exist
SELECT 
  rf.id,
  r.origin || ' → ' || r.destination as route,
  rf.frequency_type,
  rf.days_of_week,
  rf.departure_time,
  rf.active
FROM route_frequencies rf
JOIN routes r ON rf.route_id = r.id
ORDER BY rf.active DESC, rf.departure_time;

-- If empty, create a test schedule (uncomment to run):
/*
INSERT INTO route_frequencies (
  route_id,
  departure_time,
  frequency_type,
  days_of_week,
  fare_per_seat,
  active
)
SELECT 
  id,
  '08:00:00',
  'SPECIFIC_DAYS',
  ARRAY[1,2,3,4,5],  -- Monday to Friday
  100.00,
  true
FROM routes
WHERE status IN ('active', 'ACTIVE') OR is_active = true
LIMIT 1;
*/


-- STEP 4: Test generation for ONE day
-- =====================================================
-- This will show you exactly what happens
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '1 day',  -- Tomorrow
  CURRENT_DATE + INTERVAL '1 day'
);

-- Expected result:
-- assigned_count > 0 (success!)
-- conflicts_count = 0 (or low number is OK)


-- STEP 5: Check what went wrong (if still failing)
-- =====================================================

-- A) Check if drivers are already assigned
SELECT 
  ds.shift_date,
  d.full_name,
  r.origin || ' → ' || r.destination as route
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
JOIN routes r ON ds.route_id = r.id
WHERE ds.shift_date = CURRENT_DATE + INTERVAL '1 day'
  AND ds.status IN ('active', 'ACTIVE');

-- B) Check available drivers
SELECT 
  id,
  full_name,
  status,
  license_expiry
FROM drivers
WHERE status IN ('active', 'ACTIVE')
ORDER BY full_name;

-- C) Check which schedules should run tomorrow
WITH tomorrow AS (
  SELECT CURRENT_DATE + INTERVAL '1 day' as check_date
)
SELECT 
  rf.id,
  r.origin || ' → ' || r.destination as route,
  rf.frequency_type,
  rf.days_of_week,
  EXTRACT(DOW FROM (SELECT check_date FROM tomorrow))::INTEGER as tomorrow_dow,
  CASE 
    WHEN rf.frequency_type = 'DAILY' THEN 'Will run'
    WHEN rf.frequency_type = 'SPECIFIC_DAYS' 
         AND EXTRACT(DOW FROM (SELECT check_date FROM tomorrow))::INTEGER = ANY(rf.days_of_week)
    THEN 'Will run'
    ELSE 'Will NOT run'
  END as status
FROM route_frequencies rf
JOIN routes r ON rf.route_id = r.id
WHERE rf.active = true;


-- STEP 6: Fix common issues
-- =====================================================

-- Fix A: Activate more drivers
/*
UPDATE drivers
SET status = 'ACTIVE'
WHERE status IN ('inactive', 'INACTIVE')
  AND license_expiry > CURRENT_DATE
LIMIT 5;
*/

-- Fix B: Activate more buses
/*
UPDATE buses
SET status = 'ACTIVE'
WHERE status IN ('inactive', 'INACTIVE')
LIMIT 5;
*/

-- Fix C: Update schedule to run all weekdays
/*
UPDATE route_frequencies
SET days_of_week = ARRAY[1,2,3,4,5]  -- Monday to Friday
WHERE frequency_type = 'SPECIFIC_DAYS'
  AND active = true;
*/


-- STEP 7: Final test - Generate for next week
-- =====================================================
/*
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '7 days'
);
*/


-- =====================================================
-- TROUBLESHOOTING TIPS
-- =====================================================

-- Tip 1: Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%auto_assign%';

-- Tip 2: Check for duplicate shifts (conflicts)
SELECT 
  driver_id,
  shift_date,
  COUNT(*) as shift_count
FROM driver_shifts
WHERE status IN ('active', 'ACTIVE')
  AND shift_date >= CURRENT_DATE
GROUP BY driver_id, shift_date
HAVING COUNT(*) > 1;

-- Tip 3: Check RLS policies (might be blocking)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('driver_shifts', 'drivers', 'buses', 'route_frequencies');
