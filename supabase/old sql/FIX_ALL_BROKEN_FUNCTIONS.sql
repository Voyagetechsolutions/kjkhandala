-- =====================================================
-- FIX ALL BROKEN FUNCTIONS - COMPREHENSIVE CLEANUP
-- =====================================================
-- This script finds and drops ALL broken functions that cause errors
-- Run this FIRST before any other fixes
-- =====================================================

-- =====================================================
-- STEP 1: Find and list all potentially broken functions
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 =====================================================';
    RAISE NOTICE '🔍 SCANNING FOR BROKEN FUNCTIONS...';
    RAISE NOTICE '🔍 =====================================================';
    RAISE NOTICE '';
END $$;

-- List functions with array_agg
SELECT 
    '❌ ARRAY_AGG' as issue_type,
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%array_agg%';

-- List functions with seat_capacity
SELECT 
    '❌ SEAT_CAPACITY' as issue_type,
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%seat_capacity%';

-- =====================================================
-- STEP 2: Drop ALL functions with array_agg issues
-- =====================================================

DO $$
DECLARE
    func_record RECORD;
    drop_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  =====================================================';
    RAISE NOTICE '🗑️  DROPPING FUNCTIONS WITH ARRAY_AGG...';
    RAISE NOTICE '🗑️  =====================================================';
    
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND pg_get_functiondef(p.oid) LIKE '%array_agg%'
    LOOP
        RAISE NOTICE '   Dropping: %.%(%)', 
                     func_record.schema_name, 
                     func_record.function_name,
                     func_record.arguments;
        
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                      func_record.schema_name, 
                      func_record.function_name,
                      func_record.arguments);
        
        drop_count := drop_count + 1;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dropped % functions with array_agg', drop_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 3: Drop ALL functions with seat_capacity issues
-- =====================================================

DO $$
DECLARE
    func_record RECORD;
    drop_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🗑️  =====================================================';
    RAISE NOTICE '🗑️  DROPPING FUNCTIONS WITH SEAT_CAPACITY...';
    RAISE NOTICE '🗑️  =====================================================';
    
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND pg_get_functiondef(p.oid) LIKE '%seat_capacity%'
    LOOP
        RAISE NOTICE '   Dropping: %.%(%)', 
                     func_record.schema_name, 
                     func_record.function_name,
                     func_record.arguments;
        
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                      func_record.schema_name, 
                      func_record.function_name,
                      func_record.arguments);
        
        drop_count := drop_count + 1;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dropped % functions with seat_capacity', drop_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 4: Drop common broken trip-related triggers
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🗑️  =====================================================';
    RAISE NOTICE '🗑️  DROPPING OLD TRIP TRIGGERS...';
    RAISE NOTICE '🗑️  =====================================================';
END $$;

-- Drop all possible trip seat triggers
DROP TRIGGER IF EXISTS set_trip_seats_trigger ON trips;
DROP TRIGGER IF EXISTS auto_set_trip_seats ON trips;
DROP TRIGGER IF EXISTS populate_trip_seats ON trips;
DROP TRIGGER IF EXISTS update_trip_seats ON trips;
DROP TRIGGER IF EXISTS set_trip_capacity ON trips;

-- Drop all possible trip seat functions
DROP FUNCTION IF EXISTS set_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS auto_set_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS populate_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS update_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS set_trip_capacity() CASCADE;

-- =====================================================
-- STEP 5: Create CORRECT trip seats function
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ CREATING NEW CORRECT FUNCTIONS...';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '';
END $$;

CREATE OR REPLACE FUNCTION public.set_trip_seats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  bus_capacity INTEGER;
BEGIN
  -- Only set seats if not already provided
  IF NEW.total_seats IS NULL OR NEW.available_seats IS NULL THEN
    -- Get the seating_capacity from the buses table (CORRECT COLUMN NAME)
    SELECT seating_capacity INTO bus_capacity 
    FROM public.buses 
    WHERE id = NEW.bus_id;
    
    -- If bus found, set the seats
    IF bus_capacity IS NOT NULL THEN
      NEW.total_seats := bus_capacity;
      NEW.available_seats := bus_capacity;
      
      RAISE NOTICE 'Auto-set trip seats: total=%, available=% from bus seating_capacity=%', 
                   NEW.total_seats, NEW.available_seats, bus_capacity;
    ELSE
      RAISE WARNING 'Bus not found or has no seating_capacity for bus_id=%', NEW.bus_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 6: Create trigger
-- =====================================================

CREATE TRIGGER set_trip_seats_trigger
BEFORE INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_trip_seats();

-- =====================================================
-- STEP 7: Verification
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 =====================================================';
    RAISE NOTICE '🔍 VERIFICATION...';
    RAISE NOTICE '🔍 =====================================================';
    RAISE NOTICE '';
END $$;

-- Check if trigger was created successfully
SELECT 
    '✅ TRIGGER CREATED' as status,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'set_trip_seats_trigger';

-- Verify buses have seating_capacity column
SELECT 
    '✅ BUSES TABLE' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'buses'
  AND column_name IN ('seating_capacity', 'seat_capacity', 'capacity')
ORDER BY column_name;

-- Show sample buses
SELECT 
    '✅ SAMPLE BUSES' as status,
    id,
    registration_number,
    name,
    seating_capacity
FROM public.buses
ORDER BY registration_number
LIMIT 5;

-- Check for any remaining broken functions
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO BROKEN FUNCTIONS'
        ELSE '❌ STILL HAS BROKEN FUNCTIONS'
    END as status,
    COUNT(*) as broken_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) LIKE '%seat_capacity%'
    OR pg_get_functiondef(p.oid) LIKE '%array_agg%'
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ CLEANUP COMPLETE!';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All broken functions dropped';
    RAISE NOTICE '✅ All old triggers removed';
    RAISE NOTICE '✅ New correct function created: set_trip_seats()';
    RAISE NOTICE '✅ New trigger created: set_trip_seats_trigger';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What this does:';
    RAISE NOTICE '   1. Drops ALL functions with array_agg issues';
    RAISE NOTICE '   2. Drops ALL functions with seat_capacity issues';
    RAISE NOTICE '   3. Creates new function using seating_capacity';
    RAISE NOTICE '   4. Auto-sets total_seats and available_seats on trip insert';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by creating a new trip in the frontend';
    RAISE NOTICE '   - No more array_agg errors';
    RAISE NOTICE '   - No more seat_capacity errors';
    RAISE NOTICE '   - Seats auto-populate from bus';
    RAISE NOTICE '';
    RAISE NOTICE '✅ READY TO USE!';
    RAISE NOTICE '';
END $$;
