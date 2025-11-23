-- =====================================================
-- DIAGNOSTIC QUERIES FOR ROUTE FREQUENCIES
-- Run these in Supabase SQL Editor
-- =====================================================

-- 1. Check if any route_frequencies exist
SELECT COUNT(*) as total_schedules FROM route_frequencies;

-- 2. View all route frequencies with details
SELECT 
  rf.*,
  r.origin || ' → ' || r.destination as route_name,
  b.registration_number as bus,
  d.full_name as driver
FROM route_frequencies rf
LEFT JOIN routes r ON rf.route_id = r.id
LEFT JOIN buses b ON rf.bus_id = b.id
LEFT JOIN drivers d ON rf.driver_id = d.id
ORDER BY rf.created_at DESC;

-- 3. Check current user's role
SELECT 
  auth.uid() as current_user_id,
  ur.role
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- 4. Check RLS policies on route_frequencies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'route_frequencies';

-- 5. Test if you can insert (this will fail if RLS blocks you)
-- Uncomment to test:
-- INSERT INTO route_frequencies (route_id, departure_time, frequency_type, fare_per_seat)
-- SELECT id, '08:00:00', 'DAILY', 100.00
-- FROM routes
-- LIMIT 1;

-- 6. Check if table exists and is accessible
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'route_frequencies'
) as table_exists;
