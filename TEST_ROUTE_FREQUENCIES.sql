-- Quick test to verify route_frequencies RLS issue
-- Run this in Supabase SQL Editor

-- 1. Check if schedules exist (bypassing RLS as admin)
SELECT 
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN active = true THEN 1 END) as active_schedules
FROM route_frequencies;

-- 2. Check what your current user can see (with RLS)
SELECT 
  rf.id,
  rf.active,
  rf.departure_time,
  rf.frequency_type,
  rf.days_of_week,
  r.origin || ' → ' || r.destination as route,
  rf.created_at
FROM route_frequencies rf
LEFT JOIN routes r ON rf.route_id = r.id
ORDER BY rf.created_at DESC;

-- 3. If you see 0 results above but count > 0, RLS is blocking you
-- Check your current policies:
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'route_frequencies';

-- 4. Check your user's role
SELECT 
  ur.role,
  u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = auth.uid();

-- 5. If RLS is still blocking, apply this fix NOW:
-- (Uncomment and run)

/*
DROP POLICY IF EXISTS "Allow admin to manage route frequencies" ON route_frequencies;

CREATE POLICY "Allow authenticated users to insert route frequencies"
  ON route_frequencies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update route frequencies"
  ON route_frequencies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete route frequencies"
  ON route_frequencies FOR DELETE TO authenticated USING (true);
*/
