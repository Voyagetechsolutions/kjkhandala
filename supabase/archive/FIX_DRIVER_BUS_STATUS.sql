-- =====================================================
-- FIX: Update driver and bus status to uppercase
-- This fixes the dropdown issue in trip scheduling
-- =====================================================

-- =====================================================
-- STEP 1: Update drivers status to uppercase
-- =====================================================

-- Update lowercase 'active' to uppercase 'ACTIVE'
UPDATE drivers
SET status = 'ACTIVE'
WHERE LOWER(status) = 'active' OR status IS NULL;

-- Update other status values to uppercase
UPDATE drivers
SET status = 'INACTIVE'
WHERE LOWER(status) = 'inactive';

UPDATE drivers
SET status = 'ON_LEAVE'
WHERE LOWER(status) = 'on_leave' OR LOWER(status) = 'on leave';

UPDATE drivers
SET status = 'SUSPENDED'
WHERE LOWER(status) = 'suspended';

-- =====================================================
-- STEP 2: Update buses status to uppercase
-- =====================================================

-- Update lowercase 'active' to uppercase 'ACTIVE'
UPDATE buses
SET status = 'ACTIVE'
WHERE LOWER(status) = 'active' OR status IS NULL;

-- Update other status values to uppercase
UPDATE buses
SET status = 'MAINTENANCE'
WHERE LOWER(status) = 'maintenance';

UPDATE buses
SET status = 'OUT_OF_SERVICE'
WHERE LOWER(status) = 'out_of_service' OR LOWER(status) = 'out of service';

UPDATE buses
SET status = 'RETIRED'
WHERE LOWER(status) = 'retired';

-- =====================================================
-- STEP 3: Verify the updates
-- =====================================================

DO $$ 
DECLARE
  active_drivers INT;
  active_buses INT;
BEGIN 
  SELECT COUNT(*) INTO active_drivers FROM drivers WHERE status = 'ACTIVE';
  SELECT COUNT(*) INTO active_buses FROM buses WHERE status = 'ACTIVE';
  
  RAISE NOTICE '✅ Status values updated successfully!';
  RAISE NOTICE '📊 Active drivers: %', active_drivers;
  RAISE NOTICE '📊 Active buses: %', active_buses;
END $$;

-- Show updated drivers
SELECT 
  id,
  full_name,
  status,
  license_number
FROM drivers
WHERE status = 'ACTIVE'
ORDER BY full_name
LIMIT 10;

-- Show updated buses
SELECT 
  id,
  name,
  number_plate,
  status,
  seating_capacity
FROM buses
WHERE status = 'ACTIVE'
ORDER BY name
LIMIT 10;
