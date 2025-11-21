-- =====================================================
-- DEBUG: Check actual incidents table schema
-- =====================================================

-- 1. Check if incidents table exists and its columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incidents'
ORDER BY ordinal_position;

-- 2. Check current RLS policies on incidents
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'incidents';

-- 3. Check if has_any_role function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'has_any_role';
