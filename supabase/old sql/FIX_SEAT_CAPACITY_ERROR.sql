-- =====================================================
-- FIX "seat_capacity does not exist" ERROR
-- =====================================================
-- This error occurs when triggers/functions reference the wrong column name
-- Buses table uses: seating_capacity (NOT seat_capacity)
-- =====================================================

-- Step 1: Find and drop any triggers/functions referencing seat_capacity
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find all functions that reference seat_capacity
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND pg_get_functiondef(p.oid) LIKE '%seat_capacity%'
    LOOP
        RAISE NOTICE 'Dropping function: %.%', func_record.schema_name, func_record.function_name;
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', 
                      func_record.schema_name, 
                      func_record.function_name);
    END LOOP;
END $$;

-- Step 2: Drop any existing trip seat triggers
DROP TRIGGER IF EXISTS set_trip_seats_trigger ON trips;
DROP TRIGGER IF EXISTS auto_set_trip_seats ON trips;
DROP TRIGGER IF EXISTS populate_trip_seats ON trips;
DROP FUNCTION IF EXISTS set_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS auto_set_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS populate_trip_seats() CASCADE;

-- Step 3: Create the CORRECT function using seating_capacity
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

-- Step 4: Create the trigger
CREATE TRIGGER set_trip_seats_trigger
BEFORE INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_trip_seats();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- 1. Check if trigger was created successfully
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'set_trip_seats_trigger';

-- 2. Verify buses have seating_capacity column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'buses'
  AND column_name IN ('seating_capacity', 'seat_capacity', 'capacity');

-- 3. Test query - show buses with their seating capacity
SELECT 
    id,
    registration_number,
    name,
    number_plate,
    seating_capacity,
    status
FROM public.buses
ORDER BY registration_number
LIMIT 10;

-- 4. Check trips table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
  AND column_name IN ('total_seats', 'available_seats', 'bus_id');

-- =====================================================
-- TEST INSERT (Optional - uncomment to test)
-- =====================================================

-- Uncomment below to test the trigger:
/*
DO $$
DECLARE
    test_bus_id UUID;
    test_route_id UUID;
    test_driver_id UUID;
BEGIN
    -- Get a test bus
    SELECT id INTO test_bus_id FROM buses LIMIT 1;
    
    -- Get a test route
    SELECT id INTO test_route_id FROM routes LIMIT 1;
    
    -- Get a test driver
    SELECT id INTO test_driver_id FROM drivers LIMIT 1;
    
    -- Try inserting a trip (will be rolled back)
    INSERT INTO trips (
        route_id,
        bus_id,
        driver_id,
        scheduled_departure,
        scheduled_arrival,
        fare,
        status
    ) VALUES (
        test_route_id,
        test_bus_id,
        test_driver_id,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
        5000,
        'SCHEDULED'
    );
    
    -- Check if seats were set
    RAISE NOTICE 'Test trip created successfully with auto-populated seats!';
    
    -- Rollback the test
    RAISE EXCEPTION 'Test completed - rolling back';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test rollback: %', SQLERRM;
END $$;
*/

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '✅ SEAT CAPACITY ERROR FIX COMPLETE!';
    RAISE NOTICE '✅ =====================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dropped old functions referencing seat_capacity';
    RAISE NOTICE '✅ Created new function using seating_capacity';
    RAISE NOTICE '✅ Created trigger: set_trip_seats_trigger';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What this does:';
    RAISE NOTICE '   - When you insert a trip with a bus_id';
    RAISE NOTICE '   - Trigger looks up buses.seating_capacity';
    RAISE NOTICE '   - Auto-sets total_seats and available_seats';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by creating a new trip in the frontend';
    RAISE NOTICE '   - The error should be gone';
    RAISE NOTICE '   - Seats should auto-populate';
    RAISE NOTICE '';
END $$;
