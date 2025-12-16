-- =====================================================
-- FIX COMPANY ONBOARDING RLS POLICIES
-- =====================================================
-- This migration fixes RLS policies to allow platform admins
-- to create companies and tenant settings during onboarding

-- =====================================================
-- 1. FIX TENANT_SETTINGS RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "tenant_settings_company_write" ON tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_platform_admin" ON tenant_settings;

-- Create a more permissive policy for authenticated users with platform admin role
-- This checks both platform_admins table AND user_roles with DEVELOPER role
CREATE POLICY "tenant_settings_admin_write" ON tenant_settings
    FOR ALL TO authenticated
    USING (
        -- User belongs to the company
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR
        -- User is in platform_admins table
        EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true)
        OR
        -- User has DEVELOPER or SUPER_ADMIN role
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('DEVELOPER', 'SUPER_ADMIN') AND is_active = true)
    )
    WITH CHECK (
        -- User belongs to the company
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR
        -- User is in platform_admins table
        EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true)
        OR
        -- User has DEVELOPER or SUPER_ADMIN role
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('DEVELOPER', 'SUPER_ADMIN') AND is_active = true)
    );

-- =====================================================
-- 2. FIX COMPANIES TABLE RLS FOR PLATFORM ADMINS
-- =====================================================

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "tenant_isolation_insert" ON companies;
DROP POLICY IF EXISTS "tenant_isolation_update" ON companies;

-- Allow platform admins to create companies
CREATE POLICY "companies_platform_admin_insert" ON companies
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true)
        OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('DEVELOPER', 'SUPER_ADMIN') AND is_active = true)
    );

-- Allow platform admins to update any company
CREATE POLICY "companies_platform_admin_update" ON companies
    FOR UPDATE TO authenticated
    USING (
        id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true)
        OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('DEVELOPER', 'SUPER_ADMIN') AND is_active = true)
    );

-- =====================================================
-- 3. CREATE FUNCTION TO BYPASS RLS FOR COMPANY CREATION
-- =====================================================
-- This function creates a company with tenant settings in one transaction
-- using SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.platform_create_company(
    p_name TEXT,
    p_code TEXT,
    p_slug TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'South Africa',
    p_primary_color TEXT DEFAULT '#1E40AF',
    p_secondary_color TEXT DEFAULT '#3B82F6',
    p_logo_url TEXT DEFAULT NULL,
    p_subscription_tier TEXT DEFAULT 'starter'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_id UUID;
    v_is_admin BOOLEAN := false;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if caller is a platform admin
    IF EXISTS (SELECT 1 FROM platform_admins WHERE user_id = v_user_id AND is_active = true) THEN
        v_is_admin := true;
    END IF;
    
    -- Check if caller has DEVELOPER or SUPER_ADMIN role
    IF NOT v_is_admin AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = v_user_id 
        AND role IN ('DEVELOPER', 'SUPER_ADMIN') 
        AND is_active = true
    ) THEN
        v_is_admin := true;
    END IF;
    
    -- Check if caller is using is_platform_admin function
    IF NOT v_is_admin THEN
        SELECT public.is_platform_admin(v_user_id) INTO v_is_admin;
    END IF;

    -- If user is authenticated but not admin, auto-add them as platform admin
    -- This is a bootstrap mechanism for the first platform admin
    IF NOT v_is_admin AND v_user_id IS NOT NULL THEN
        -- Check if there are ANY platform admins yet
        IF NOT EXISTS (SELECT 1 FROM platform_admins WHERE is_active = true LIMIT 1) THEN
            -- No admins exist, make this user the first admin
            INSERT INTO platform_admins (user_id, email, role, is_active)
            SELECT v_user_id, email, 'DEVELOPER', true
            FROM auth.users WHERE id = v_user_id
            ON CONFLICT (user_id) DO UPDATE SET is_active = true, role = 'DEVELOPER';
            v_is_admin := true;
        END IF;
    END IF;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Unauthorized: Only platform admins can create companies. Please contact the system administrator to be added as a platform admin.',
            'user_id', v_user_id::text,
            'hint', 'Run: INSERT INTO platform_admins (user_id, email, role) VALUES (''' || v_user_id::text || ''', ''your-email'', ''DEVELOPER'');'
        );
    END IF;

    -- Create the company
    INSERT INTO companies (
        name, code, slug, email, phone, address, city, country,
        primary_color, secondary_color, logo_url,
        subscription_tier, subscription_status, subscription_started_at,
        is_active, is_verified
    ) VALUES (
        p_name, p_code, p_slug, p_email, p_phone, p_address, p_city, p_country,
        p_primary_color, p_secondary_color, p_logo_url,
        p_subscription_tier, 'active', NOW(),
        true, false
    )
    RETURNING id INTO v_company_id;

    -- Create tenant settings (the trigger should do this, but let's be explicit)
    INSERT INTO tenant_settings (
        company_id, slug, primary_color, secondary_color, logo_url,
        support_email, support_phone, is_active
    ) VALUES (
        v_company_id, p_slug, p_primary_color, p_secondary_color, p_logo_url,
        p_email, p_phone, true
    )
    ON CONFLICT (company_id) DO UPDATE SET
        slug = EXCLUDED.slug,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        logo_url = EXCLUDED.logo_url,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone;

    RETURN jsonb_build_object(
        'success', true,
        'company_id', v_company_id,
        'message', 'Company created successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.platform_create_company TO authenticated;

-- =====================================================
-- 4. CREATE FUNCTION TO INVITE COMPANY OWNER
-- =====================================================
-- This function sends an invite without creating a user record
-- (the user will be created when they click the magic link)

CREATE OR REPLACE FUNCTION public.platform_invite_owner(
    p_company_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_company RECORD;
BEGIN
    -- Check if caller is a platform admin or developer
    SELECT EXISTS(
        SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true
        UNION
        SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('DEVELOPER', 'SUPER_ADMIN') AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Verify company exists
    SELECT * INTO v_company FROM companies WHERE id = p_company_id;
    IF v_company IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Company not found');
    END IF;

    -- Store the pending invite info in company metadata
    -- The actual invite will be sent via the frontend using signInWithOtp
    UPDATE companies
    SET 
        owner_email = p_email,
        owner_name = p_full_name,
        owner_phone = p_phone,
        updated_at = NOW()
    WHERE id = p_company_id;

    RETURN jsonb_build_object(
        'success', true,
        'company_id', p_company_id,
        'email', p_email,
        'message', 'Owner info saved. Send invite via frontend.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_invite_owner TO authenticated;

-- =====================================================
-- 5. ADD MISSING COLUMNS TO COMPANIES TABLE IF NEEDED
-- =====================================================

DO $$
BEGIN
    -- Add owner_email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'owner_email') THEN
        ALTER TABLE companies ADD COLUMN owner_email TEXT;
    END IF;

    -- Add owner_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'owner_name') THEN
        ALTER TABLE companies ADD COLUMN owner_name TEXT;
    END IF;

    -- Add owner_phone if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'owner_phone') THEN
        ALTER TABLE companies ADD COLUMN owner_phone TEXT;
    END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.platform_create_company IS 'Creates a new company with tenant settings. Only callable by platform admins.';
COMMENT ON FUNCTION public.platform_invite_owner IS 'Stores owner info for a company. Invite is sent via frontend.';
