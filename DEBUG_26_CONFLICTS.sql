-- =====================================================
-- DEBUG: 26 Conflicts Issue
-- Run these queries in order to find the exact problem
-- =====================================================

-- STEP 1: Check what date range you tried to generate for
-- (Replace with your actual dates)
-- For this example, let's assume you tried to generate for next week

-- STEP 2: Check if shifts already exist for those dates
SELECT 
  shift_date,
  COUNT(*) as existing_shifts,
  array_agg(DISTINCT d.full_name) as drivers_assigned,
  array_agg(DISTINCT r.origin || ' → ' || r.destination) as routes
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
JOIN routes r ON ds.route_id = r.id
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status IN ('active', 'ACTIVE')
GROUP BY shift_date
ORDER BY shift_date;

-- If this returns data, that's your problem! Shifts already exist.


-- STEP 3: Check how many schedules should generate per day
WITH date_range AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    '1 day'::interval
  )::DATE as check_date
)
SELECT 
  dr.check_date,
  EXTRACT(DOW FROM dr.check_date)::INTEGER as day_of_week,
  COUNT(rf.id) as schedules_that_should_run
FROM date_range dr
CROSS JOIN route_frequencies rf
JOIN routes r ON rf.route_id = r.id
WHERE rf.active = true
  AND (r.status IN ('active', 'ACTIVE') OR r.is_active = true)
  AND (
    rf.frequency_type = 'DAILY'
    OR (rf.frequency_type = 'SPECIFIC_DAYS' 
        AND EXTRACT(DOW FROM dr.check_date)::INTEGER = ANY(rf.days_of_week))
    OR (rf.frequency_type = 'WEEKLY' 
        AND EXTRACT(DOW FROM dr.check_date)::INTEGER = ANY(rf.days_of_week))
  )
GROUP BY dr.check_date
ORDER BY dr.check_date;

-- This shows how many shifts should be created each day
-- If total = 26, then all your attempts conflicted


-- STEP 4: Check active resources
SELECT 
  'Drivers' as resource_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') THEN 1 END) as active_count
FROM drivers

UNION ALL

SELECT 
  'Buses',
  COUNT(*),
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') THEN 1 END)
FROM buses

UNION ALL

SELECT 
  'Routes',
  COUNT(*),
  COUNT(CASE WHEN status IN ('active', 'ACTIVE') OR is_active = true THEN 1 END)
FROM routes

UNION ALL

SELECT 
  'Schedules',
  COUNT(*),
  COUNT(CASE WHEN active = true THEN 1 END)
FROM route_frequencies;


-- STEP 5: Find the exact conflict - check if driver_shifts has unique constraint
-- This is the most likely issue!
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'driver_shifts'
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Check the unique constraint details
SELECT
  tc.constraint_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'driver_shifts'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;


-- STEP 6: Check if there are "inactive" shifts blocking the dates
-- Sometimes old shifts are marked inactive but still blocking
SELECT 
  shift_date,
  status,
  COUNT(*) as shift_count,
  array_agg(DISTINCT d.full_name) as drivers
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
GROUP BY shift_date, status
ORDER BY shift_date, status;


-- STEP 7: Test generation for a SINGLE day that should be empty
-- Pick a date you know has no shifts
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '10 days',  -- Far future date
  CURRENT_DATE + INTERVAL '10 days'
);

-- If this also returns conflicts, the problem is NOT existing shifts


-- STEP 8: Check if the unique constraint is too restrictive
-- The constraint might be: (driver_id, shift_date, route_id) WHERE status = 'active'
-- But if it's just (driver_id, shift_date), that's too restrictive!

-- Check what the ON CONFLICT clause is checking
SELECT 
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'driver_shifts'::regclass
  AND contype = 'u';  -- unique constraint


-- STEP 9: Most likely fix - Clear existing shifts for test dates
-- ⚠️ WARNING: Only run this if you're testing!
/*
DELETE FROM driver_shifts
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

-- Verify deletion
SELECT 'Shifts cleared' as status, COUNT(*) as remaining
FROM driver_shifts
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
*/


-- STEP 10: Alternative - Generate for completely new dates
-- Try generating for dates 2 weeks from now
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '21 days'
);


-- =====================================================
-- DIAGNOSIS SUMMARY
-- =====================================================

-- If STEP 2 returns data:
--   → Shifts already exist, causing conflicts
--   → Solution: Clear old shifts or generate for different dates

-- If STEP 2 returns nothing but still conflicts:
--   → Check STEP 5 for overly restrictive unique constraint
--   → Check STEP 6 for inactive shifts blocking

-- If STEP 7 (far future) also has conflicts:
--   → Problem is NOT existing shifts
--   → Check unique constraint definition
--   → May need to modify the constraint

-- If STEP 3 shows 26 schedules total:
--   → All 26 attempts failed
--   → Most likely cause: existing shifts for ALL those dates
