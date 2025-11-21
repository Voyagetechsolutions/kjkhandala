-- =====================================================
-- FIX AMBIGUOUS TRIP_NUMBER COLUMN REFERENCE
-- =====================================================

-- First, check if trip_number column exists in trips table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trips' AND column_name = 'trip_number';

-- If it doesn't exist, you can add it:
-- ALTER TABLE trips ADD COLUMN trip_number TEXT UNIQUE;

-- Check all triggers on trips table
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'trips';

-- If you have a trigger that references trip_number ambiguously, 
-- you may need to drop and recreate it with proper column qualification.

-- Example: If there's a trigger that causes the error, drop it:
-- DROP TRIGGER IF EXISTS trigger_name ON trips;

-- Then recreate it with proper NEW. qualification:
-- CREATE TRIGGER trigger_name
-- AFTER INSERT OR UPDATE ON trips
-- FOR EACH ROW
-- EXECUTE FUNCTION your_function_name();

-- =====================================================
-- SAFE FIX: Remove trip_number from any trigger logic
-- =====================================================

-- If your trigger is trying to reference trip_number but it doesn't exist,
-- comment out or remove those lines from the trigger function.

-- Check the function that the trigger uses:
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_definition LIKE '%trip_number%';

-- If you find a function with trip_number references, you may need to:
-- 1. Drop the trigger
-- 2. Drop the function
-- 3. Recreate without trip_number references

-- =====================================================
-- QUICK FIX: Disable all triggers temporarily
-- =====================================================

-- If you want to quickly test without triggers:
-- ALTER TABLE trips DISABLE TRIGGER ALL;

-- Then test your insert/update.
-- After testing, re-enable:
-- ALTER TABLE trips ENABLE TRIGGER ALL;

-- =====================================================
-- VERIFY TRIPS TABLE STRUCTURE
-- =====================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;
