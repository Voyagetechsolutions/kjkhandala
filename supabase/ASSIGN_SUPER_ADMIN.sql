-- ============================================================================
-- ASSIGN SUPER_ADMIN ROLE TO USER
-- ============================================================================

-- STEP 1: Find your user ID
-- Run this first and copy the user ID
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: Assign SUPER_ADMIN role
-- REPLACE 'user-id-here' with the actual user ID from step 1
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES (
  'user-id-here'::uuid,  -- CHANGE THIS to your user ID
  'SUPER_ADMIN',
  100,
  TRUE
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = TRUE,
  role_level = 100,
  assigned_at = NOW();

-- STEP 3: Verify the role was assigned
-- REPLACE 'user-id-here' with your user ID
SELECT 
  ur.role,
  ur.role_level,
  ur.is_active,
  ur.assigned_at,
  p.email,
  p.full_name
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.user_id = 'user-id-here'::uuid;  -- CHANGE THIS

-- STEP 4: Test dashboard access function
-- REPLACE 'user-id-here' with your user ID
SELECT * FROM get_user_dashboard_access('user-id-here'::uuid);  -- CHANGE THIS

-- ============================================================================
-- ALTERNATIVE: Assign by email (easier)
-- ============================================================================

-- This version finds the user by email and assigns SUPER_ADMIN
-- REPLACE 'your-email@example.com' with your actual email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';  -- CHANGE THIS
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with that email';
  END IF;
  
  -- Assign SUPER_ADMIN role
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = TRUE,
    role_level = 100,
    assigned_at = NOW();
  
  RAISE NOTICE 'SUPER_ADMIN role assigned to user: %', v_user_id;
END $$;

-- Verify it worked
-- REPLACE 'your-email@example.com' with your actual email
SELECT 
  u.email,
  p.full_name,
  ur.role,
  ur.role_level,
  ur.is_active
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';  -- CHANGE THIS
