-- =====================================================
-- DEBUG: Check drivers and buses status values
-- =====================================================

-- 1. Check all drivers and their status values
SELECT 
  id,
  full_name,
  status,
  license_number,
  phone
FROM drivers
ORDER BY full_name;

-- 2. Count drivers by status
SELECT 
  status,
  COUNT(*) as count
FROM drivers
GROUP BY status
ORDER BY count DESC;

-- 3. Check all buses and their status values
SELECT 
  id,
  name,
  number_plate,
  status,
  seating_capacity
FROM buses
ORDER BY name;

-- 4. Count buses by status
SELECT 
  status,
  COUNT(*) as count
FROM buses
GROUP BY status
ORDER BY count DESC;

-- 5. Check RLS policies on drivers
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'drivers'
ORDER BY cmd, policyname;

-- 6. Check RLS policies on buses
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'buses'
ORDER BY cmd, policyname;
