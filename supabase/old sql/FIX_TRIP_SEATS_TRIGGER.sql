-- =====================================================
-- FIX TRIP SEATS AUTO-POPULATION TRIGGER
-- =====================================================

-- This trigger automatically sets total_seats and available_seats
-- when a trip is created, based on the selected bus's seating_capacity

-- Step 1: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_trip_seats_trigger ON trips;
DROP FUNCTION IF EXISTS set_trip_seats() CASCADE;

-- Step 2: Create the function with correct column name
CREATE OR REPLACE FUNCTION set_trip_seats()
RETURNS TRIGGER AS $$
DECLARE
  bus_capacity INTEGER;
BEGIN
  -- Only set seats if not already provided
  IF NEW.total_seats IS NULL OR NEW.available_seats IS NULL THEN
    -- Get the seating_capacity from the buses table
    SELECT seating_capacity INTO bus_capacity 
    FROM buses 
    WHERE id = NEW.bus_id;
    
    -- If bus found, set the seats
    IF bus_capacity IS NOT NULL THEN
      NEW.total_seats := bus_capacity;
      NEW.available_seats := bus_capacity;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
CREATE TRIGGER set_trip_seats_trigger
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION set_trip_seats();

-- =====================================================
-- VERIFY THE TRIGGER
-- =====================================================

-- Check if trigger was created
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'set_trip_seats_trigger';

-- Test query to verify buses have seating_capacity
SELECT id, name, number_plate, seating_capacity
FROM buses
LIMIT 5;

-- =====================================================
-- DONE!
-- =====================================================
-- Now when you insert a trip:
-- 1. Frontend sends bus_id
-- 2. Trigger looks up seating_capacity from buses table
-- 3. Trigger sets total_seats and available_seats automatically
-- 4. No more "bus capacity not found" errors!
-- =====================================================
