-- ============================================================================
-- CRITICAL FIX: Remove Infinite Recursion + Assign SUPER_ADMIN
-- Run this AFTER deploying DEPLOY_01_CORE.sql and DEPLOY_02_RLS.sql
-- ============================================================================

-- =====================================================
-- STEP 1: Fix user_roles RLS (Remove infinite recursion)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON user_roles;

-- Simple policy: users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for backend/triggers)
CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL TO service_role USING (true);

-- Users can insert their own roles (for signup trigger)
CREATE POLICY "Users can insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 2: Fix cities RLS (Allow authenticated inserts)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view cities" ON cities;
DROP POLICY IF EXISTS "Authenticated users can insert cities" ON cities;
DROP POLICY IF EXISTS "Service role can manage cities" ON cities;

CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cities" ON cities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage cities" ON cities
  FOR ALL TO service_role USING (true);

-- =====================================================
-- STEP 3: Fix profiles RLS (Allow authenticated inserts)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL TO service_role USING (true);

-- =====================================================
-- STEP 4: Assign SUPER_ADMIN Role
-- ⚠️ CHANGE THE EMAIL ADDRESS BELOW!
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'your-email@example.com';  -- ⚠️ CHANGE THIS TO YOUR EMAIL
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', v_email;
  END IF;
  
  -- Ensure profile exists and is active
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (v_user_id, v_email, 'Super Admin', TRUE)
  ON CONFLICT (id) DO UPDATE 
  SET is_active = TRUE, updated_at = NOW();
  
  -- Assign SUPER_ADMIN role
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = TRUE, 
    role_level = 100, 
    assigned_at = NOW();
  
  RAISE NOTICE '✅ SUCCESS: RLS policies fixed and SUPER_ADMIN assigned to %', v_email;
END $$;

-- =====================================================
-- STEP 5: Verify the fix
-- =====================================================

-- Check your user and role
SELECT 
  u.email,
  p.full_name,
  p.is_active as profile_active,
  ur.role,
  ur.role_level,
  ur.is_active as role_active,
  ur.assigned_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
ORDER BY ur.role_level DESC;

-- =====================================================
-- EXPECTED OUTPUT:
-- email                | full_name   | profile_active | role        | role_level | role_active | assigned_at
-- ---------------------|-------------|----------------|-------------|------------|-------------|-------------
-- your@email.com       | Super Admin | true           | SUPER_ADMIN | 100        | true        | 2025-11-14...
-- =====================================================
