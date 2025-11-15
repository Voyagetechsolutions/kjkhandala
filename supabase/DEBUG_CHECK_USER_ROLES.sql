-- ============================================================================
-- DEBUG: Check User Roles and Profile
-- Run this to see what's in the database for your user
-- ============================================================================

-- 1. Check all users in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check profiles table
SELECT 
  id,
  email,
  full_name,
  employee_id,
  status,
  is_active,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check user_roles table
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.role_level,
  ur.is_active,
  ur.assigned_at,
  p.email,
  p.full_name
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.assigned_at DESC
LIMIT 10;

-- 4. Check specific user (replace with your email)
-- REPLACE 'your-email@example.com' with your actual email
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.status as profile_status,
  p.is_active as profile_active,
  ur.role,
  ur.role_level,
  ur.is_active as role_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';  -- CHANGE THIS

-- 5. Test the get_user_dashboard_access function
-- REPLACE 'user-id-here' with your actual user ID
SELECT * FROM get_user_dashboard_access('user-id-here'::uuid);  -- CHANGE THIS
