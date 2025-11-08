-- =====================================================
-- SETUP ADMIN USERS - KJ Khandala Bus Company
-- Run this AFTER creating your first user via Supabase Auth
-- =====================================================

-- =====================================================
-- 1. CREATE PROFILE FOR EXISTING USER
-- =====================================================

-- First, create a profile for your authenticated user
-- Replace 'YOUR_USER_ID' with the actual UUID from auth.users
-- You can find this in Supabase Dashboard > Authentication > Users

-- Example: Create profile for first user
INSERT INTO profiles (id, full_name, phone, department)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID from auth.users
  'Super Admin',
  '+267 1234567',
  'Management'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ASSIGN SUPER ADMIN ROLE
-- =====================================================

-- Assign super_admin role to your user
INSERT INTO user_roles (user_id, role, permissions)
VALUES (
  'YOUR_USER_ID_HERE', -- Same user ID as above
  'super_admin',
  '{
    "can_manage_users": true,
    "can_manage_buses": true,
    "can_manage_routes": true,
    "can_manage_bookings": true,
    "can_manage_staff": true,
    "can_manage_drivers": true,
    "can_manage_maintenance": true,
    "can_view_reports": true,
    "can_manage_finances": true,
    "full_access": true
  }'::jsonb
) ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- 3. ALTERNATIVE: GRANT ADMIN TO ALL EXISTING USERS
-- =====================================================

-- If you want to make ALL existing users admins (for testing):
-- UNCOMMENT THE FOLLOWING LINES:

/*
INSERT INTO profiles (id, full_name, department)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'Management'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, permissions)
SELECT 
  id,
  'super_admin',
  '{
    "full_access": true
  }'::jsonb
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- =====================================================
-- 4. CREATE ADDITIONAL ROLE TEMPLATES
-- =====================================================

-- Manager Role Template
-- INSERT INTO user_roles (user_id, role, permissions)
-- VALUES (
--   'MANAGER_USER_ID',
--   'manager',
--   '{
--     "can_manage_buses": true,
--     "can_manage_routes": true,
--     "can_manage_bookings": true,
--     "can_view_reports": true
--   }'::jsonb
-- );

-- Staff Role Template
-- INSERT INTO user_roles (user_id, role, permissions)
-- VALUES (
--   'STAFF_USER_ID',
--   'staff',
--   '{
--     "can_manage_bookings": true,
--     "can_view_schedules": true
--   }'::jsonb
-- );

-- Driver Role Template
-- INSERT INTO user_roles (user_id, role, permissions)
-- VALUES (
--   'DRIVER_USER_ID',
--   'driver',
--   '{
--     "can_view_assigned_trips": true,
--     "can_update_trip_status": true
--   }'::jsonb
-- );

-- =====================================================
-- 5. VERIFY SETUP
-- =====================================================

-- Check all users and their roles
SELECT 
  p.id,
  p.full_name,
  u.email,
  ur.role,
  ur.permissions
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
ORDER BY ur.role;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
HOW TO USE THIS FILE:

1. First, create a user in Supabase Dashboard:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Copy the user's UUID

2. Replace 'YOUR_USER_ID_HERE' in this file with the actual UUID

3. Run this SQL file in Supabase SQL Editor

4. Verify the user has admin access by running the SELECT query at the end

5. Log in with that user's credentials

ALTERNATIVE - Quick Setup for Testing:
If you just want to test, uncomment the section "GRANT ADMIN TO ALL EXISTING USERS"
This will make all current users super admins.
*/
