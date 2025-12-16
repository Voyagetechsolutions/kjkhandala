-- Developer Role Migration
-- Creates a DEVELOPER role for system owners with full platform access

-- =====================================================
-- ADD DEVELOPER TO USER_ROLES ENUM CHECK
-- =====================================================

-- First, drop the existing constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add new constraint with DEVELOPER role
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY[
  'SUPER_ADMIN'::text, 
  'ADMIN'::text, 
  'DEVELOPER'::text,  -- NEW: System owner role
  'OPERATIONS_MANAGER'::text, 
  'FINANCE_MANAGER'::text, 
  'HR_MANAGER'::text, 
  'MAINTENANCE_MANAGER'::text, 
  'TICKETING_AGENT'::text, 
  'TICKETING_SUPERVISOR'::text, 
  'DRIVER'::text, 
  'PASSENGER'::text
]));

-- =====================================================
-- CREATE PLATFORM_ADMINS TABLE
-- =====================================================
-- This table tracks users who have platform-level access

CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'DEVELOPER' CHECK (role IN ('DEVELOPER', 'PLATFORM_ADMIN', 'SUPPORT')),
    permissions JSONB DEFAULT '{
        "tenants": {"create": true, "read": true, "update": true, "delete": true},
        "users": {"create": true, "read": true, "update": true, "delete": true},
        "billing": {"create": true, "read": true, "update": true, "delete": true},
        "system": {"monitoring": true, "logs": true, "database": true, "api_keys": true},
        "config": {"settings": true, "integrations": true, "features": true, "templates": true},
        "support": {"announcements": true, "impersonate": true, "tools": true}
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Policies for platform_admins
CREATE POLICY "platform_admins_read" ON platform_admins
    FOR SELECT USING (true);

CREATE POLICY "platform_admins_write" ON platform_admins
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON platform_admins TO authenticated;
GRANT SELECT ON platform_admins TO anon;

-- =====================================================
-- UPDATE get_user_dashboard_access FUNCTION
-- =====================================================
-- Add DEVELOPER role to dashboard access function

CREATE OR REPLACE FUNCTION get_user_dashboard_access(p_user_id UUID)
RETURNS TABLE (
    primary_role TEXT,
    all_roles TEXT[],
    can_access_admin BOOLEAN,
    can_access_ticketing BOOLEAN,
    can_access_operations BOOLEAN,
    can_access_hr BOOLEAN,
    can_access_finance BOOLEAN,
    can_access_maintenance BOOLEAN,
    can_access_driver BOOLEAN,
    can_access_platform BOOLEAN  -- NEW: Platform/Developer dashboard access
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_roles TEXT[];
    v_primary_role TEXT;
    v_is_platform_admin BOOLEAN := false;
BEGIN
    -- Get all active roles for the user
    SELECT ARRAY_AGG(role ORDER BY role_level DESC)
    INTO v_roles
    FROM user_roles
    WHERE user_id = p_user_id AND is_active = true;

    -- Get primary role (highest level)
    SELECT role INTO v_primary_role
    FROM user_roles
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY role_level DESC
    LIMIT 1;

    -- Check if user is a platform admin
    SELECT EXISTS(
        SELECT 1 FROM platform_admins 
        WHERE user_id = p_user_id AND is_active = true
    ) INTO v_is_platform_admin;

    -- Return access permissions
    RETURN QUERY SELECT
        COALESCE(v_primary_role, 'PASSENGER'),
        COALESCE(v_roles, ARRAY['PASSENGER']),
        -- Admin access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER'), false),
        -- Ticketing access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR'), false),
        -- Operations access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'OPERATIONS_MANAGER'), false),
        -- HR access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'HR_MANAGER'), false),
        -- Finance access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'FINANCE_MANAGER'), false),
        -- Maintenance access
        COALESCE(v_primary_role IN ('SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'MAINTENANCE_MANAGER'), false),
        -- Driver access
        COALESCE(v_primary_role IN ('DRIVER'), false),
        -- Platform/Developer dashboard access
        v_is_platform_admin OR COALESCE(v_primary_role = 'DEVELOPER', false);
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Check if user is platform admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM platform_admins 
        WHERE user_id = p_user_id AND is_active = true
    );
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Assign platform admin role
-- =====================================================

CREATE OR REPLACE FUNCTION assign_platform_admin(
    p_email TEXT,
    p_role TEXT DEFAULT 'DEVELOPER'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_admin_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', p_email;
    END IF;

    -- Insert or update platform admin
    INSERT INTO platform_admins (user_id, email, role)
    VALUES (v_user_id, p_email, p_role)
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true,
        updated_at = now()
    RETURNING id INTO v_admin_id;

    -- Also assign DEVELOPER role in user_roles
    INSERT INTO user_roles (user_id, role, role_level, is_active)
    VALUES (v_user_id, 'DEVELOPER', 100, true)
    ON CONFLICT (user_id, role) DO UPDATE SET
        is_active = true;

    RETURN v_admin_id;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Remove platform admin role
-- =====================================================

CREATE OR REPLACE FUNCTION remove_platform_admin(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE platform_admins
    SET is_active = false, updated_at = now()
    WHERE email = p_email;

    -- Also deactivate DEVELOPER role
    UPDATE user_roles
    SET is_active = false
    WHERE user_id = (SELECT id FROM auth.users WHERE email = p_email)
    AND role = 'DEVELOPER';
END;
$$;

-- =====================================================
-- TRIGGER: Update last_login_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_platform_admin_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE platform_admins
    SET last_login_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;

-- =====================================================
-- INSERT DEFAULT PLATFORM ADMINS
-- =====================================================
-- Note: These users must exist in auth.users first
-- Run this after creating the users in Supabase Auth

-- Example: To add a platform admin, run:
-- SELECT assign_platform_admin('your-email@example.com', 'DEVELOPER');

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE TRIGGER update_platform_admins_updated_at
    BEFORE UPDATE ON platform_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE platform_admins IS 'Stores platform-level administrators who can access the developer dashboard';
COMMENT ON COLUMN platform_admins.role IS 'DEVELOPER = full access, PLATFORM_ADMIN = tenant management, SUPPORT = read-only + support tools';
COMMENT ON COLUMN platform_admins.permissions IS 'JSON object defining granular permissions for each section';
COMMENT ON FUNCTION is_platform_admin IS 'Check if a user has platform admin access';
COMMENT ON FUNCTION assign_platform_admin IS 'Assign platform admin role to a user by email';
COMMENT ON FUNCTION remove_platform_admin IS 'Remove platform admin role from a user by email';
