-- =====================================================
-- FIX: ON CONFLICT Constraint Issue
-- The partial unique index might not support IN operator
-- =====================================================

-- STEP 1: Check current unique constraints on driver_shifts
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'driver_shifts'::regclass
  AND contype = 'u'  -- unique constraint
ORDER BY conname;

-- STEP 2: Check for partial unique indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'driver_shifts'
  AND indexdef LIKE '%WHERE%'
ORDER BY indexname;


-- STEP 3: The Problem
-- If you have a constraint like:
--   UNIQUE (driver_id, shift_date, route_id) WHERE status = 'active'
-- 
-- But your data has status = 'ACTIVE' (uppercase)
-- Then the constraint doesn't apply, and you get duplicate inserts!


-- STEP 4: Solution A - Drop and recreate constraint with both cases
-- ⚠️ Only run if you understand your constraint structure!

/*
-- Drop existing constraint (replace 'constraint_name' with actual name from STEP 1)
ALTER TABLE driver_shifts 
DROP CONSTRAINT IF EXISTS driver_shifts_driver_id_shift_date_route_id_key;

-- Recreate with both cases
CREATE UNIQUE INDEX driver_shifts_active_unique
ON driver_shifts (driver_id, shift_date, route_id)
WHERE status IN ('active', 'ACTIVE');
*/


-- STEP 5: Solution B - Standardize all status values to UPPERCASE
-- This is the recommended approach!

/*
-- Update all existing shifts to UPPERCASE
UPDATE driver_shifts SET status = 'ACTIVE' WHERE status = 'active';
UPDATE driver_shifts SET status = 'INACTIVE' WHERE status = 'inactive';
UPDATE driver_shifts SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE driver_shifts SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Verify
SELECT status, COUNT(*) 
FROM driver_shifts 
GROUP BY status;
*/


-- STEP 6: Solution C - Use UPPER() in the constraint
-- Most robust solution

/*
-- Drop existing constraint
ALTER TABLE driver_shifts 
DROP CONSTRAINT IF EXISTS driver_shifts_driver_id_shift_date_route_id_key;

-- Create case-insensitive constraint
CREATE UNIQUE INDEX driver_shifts_active_unique
ON driver_shifts (driver_id, shift_date, route_id)
WHERE UPPER(status) = 'ACTIVE';
*/


-- STEP 7: Test the fix
-- After applying one of the solutions above, test:
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '1 day'
);

-- Should return: assigned_count > 0, conflicts_count = 0


-- =====================================================
-- RECOMMENDED FIX (Simplest)
-- =====================================================

-- 1. Clear test data
DELETE FROM driver_shifts
WHERE shift_date >= CURRENT_DATE
  AND shift_date <= CURRENT_DATE + INTERVAL '30 days';

-- 2. Standardize existing data
UPDATE driver_shifts SET status = UPPER(status);
UPDATE drivers SET status = UPPER(status);
UPDATE buses SET status = UPPER(status);
UPDATE routes SET status = UPPER(status) WHERE status IS NOT NULL;

-- 3. Verify
SELECT 
  'driver_shifts' as table_name,
  status,
  COUNT(*) as count
FROM driver_shifts
GROUP BY status

UNION ALL

SELECT 
  'drivers',
  status,
  COUNT(*)
FROM drivers
GROUP BY status

UNION ALL

SELECT 
  'buses',
  status,
  COUNT(*)
FROM buses
GROUP BY status;

-- 4. Now try generating shifts again
-- It should work!
