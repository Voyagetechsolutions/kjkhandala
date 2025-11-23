-- Cleanup Script for Existing Driver Shifts
-- This script fixes issues with placeholder data and missing driver assignments

-- 1. Delete old shifts with placeholder notes (they contain "no_driver" or "no_bus")
DELETE FROM driver_shifts 
WHERE notes LIKE '%no_driver%' 
   OR notes LIKE '%no_bus%'
   OR driver_id IS NULL;

-- 2. Update any remaining shifts with simplified notes format
UPDATE driver_shifts 
SET notes = route_id::text || '-' || COALESCE(bus_id::text, 'no_bus') || '-' || shift_date
WHERE auto_generated = true
  AND notes NOT LIKE '%no_driver%'
  AND notes NOT LIKE '%no_bus%';

-- 3. Show summary of what was cleaned up
DO $$
DECLARE
    shift_count int;
    driver_assigned_count int;
BEGIN
    SELECT COUNT(*) INTO shift_count FROM driver_shifts;
    SELECT COUNT(*) INTO driver_assigned_count FROM driver_shifts WHERE driver_id IS NOT NULL;
    
    RAISE NOTICE 'Cleanup complete:';
    RAISE NOTICE 'Total shifts remaining: %', shift_count;
    RAISE NOTICE 'Shifts with drivers assigned: %', driver_assigned_count;
END $$;
