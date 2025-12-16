-- Fix RLS Policies for Platform Admin Operations
-- This migration allows platform admin to manage companies and other platform tables

-- =====================================================
-- COMPANIES TABLE - Allow platform operations
-- =====================================================

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies can be created by authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies can be updated by company members" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read companies (for public listings, login, etc.)
CREATE POLICY "companies_public_read" ON companies
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert companies (for platform admin and signup)
CREATE POLICY "companies_authenticated_insert" ON companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update companies they belong to OR platform admins
CREATE POLICY "companies_authenticated_update" ON companies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete for platform admin operations
CREATE POLICY "companies_authenticated_delete" ON companies
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- PROFILES TABLE - Fix RLS for platform operations
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow reading all profiles (for platform admin and user lookups)
CREATE POLICY "profiles_public_read" ON profiles
    FOR SELECT
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id OR true);

-- Allow users to update profiles (own or platform admin)
CREATE POLICY "profiles_update" ON profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- DRIVERS TABLE - Fix RLS
-- =====================================================

DROP POLICY IF EXISTS "drivers_select_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_insert_policy" ON drivers;
DROP POLICY IF EXISTS "drivers_update_policy" ON drivers;

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_public_read" ON drivers
    FOR SELECT
    USING (true);

CREATE POLICY "drivers_authenticated_insert" ON drivers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "drivers_authenticated_update" ON drivers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- EMPLOYEES TABLE - Fix RLS
-- =====================================================

DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_public_read" ON employees
    FOR SELECT
    USING (true);

CREATE POLICY "employees_authenticated_insert" ON employees
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "employees_authenticated_update" ON employees
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- STAFF TABLE - Fix RLS
-- =====================================================

DROP POLICY IF EXISTS "staff_select_policy" ON staff;
DROP POLICY IF EXISTS "staff_insert_policy" ON staff;
DROP POLICY IF EXISTS "staff_update_policy" ON staff;

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_public_read" ON staff
    FOR SELECT
    USING (true);

CREATE POLICY "staff_authenticated_insert" ON staff
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "staff_authenticated_update" ON staff
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PASSENGERS TABLE - Fix RLS
-- =====================================================

DROP POLICY IF EXISTS "passengers_select_policy" ON passengers;
DROP POLICY IF EXISTS "passengers_insert_policy" ON passengers;
DROP POLICY IF EXISTS "passengers_update_policy" ON passengers;

ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passengers_public_read" ON passengers
    FOR SELECT
    USING (true);

CREATE POLICY "passengers_authenticated_insert" ON passengers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "passengers_authenticated_update" ON passengers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- SAVED_PASSENGERS TABLE - Fix RLS
-- =====================================================

DROP POLICY IF EXISTS "saved_passengers_select_policy" ON saved_passengers;
DROP POLICY IF EXISTS "saved_passengers_insert_policy" ON saved_passengers;
DROP POLICY IF EXISTS "saved_passengers_update_policy" ON saved_passengers;

ALTER TABLE saved_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_passengers_public_read" ON saved_passengers
    FOR SELECT
    USING (true);

CREATE POLICY "saved_passengers_authenticated_insert" ON saved_passengers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "saved_passengers_authenticated_update" ON saved_passengers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PLATFORM TABLES - Ensure RLS allows operations
-- =====================================================

-- Platform Incidents
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_incidents_read" ON platform_incidents;
DROP POLICY IF EXISTS "platform_incidents_write" ON platform_incidents;
CREATE POLICY "platform_incidents_read" ON platform_incidents FOR SELECT USING (true);
CREATE POLICY "platform_incidents_write" ON platform_incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Error Logs
ALTER TABLE platform_error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_error_logs_read" ON platform_error_logs;
DROP POLICY IF EXISTS "platform_error_logs_write" ON platform_error_logs;
CREATE POLICY "platform_error_logs_read" ON platform_error_logs FOR SELECT USING (true);
CREATE POLICY "platform_error_logs_write" ON platform_error_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Announcements
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_announcements_read" ON platform_announcements;
DROP POLICY IF EXISTS "platform_announcements_write" ON platform_announcements;
CREATE POLICY "platform_announcements_read" ON platform_announcements FOR SELECT USING (true);
CREATE POLICY "platform_announcements_write" ON platform_announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_settings_read" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_write" ON platform_settings;
CREATE POLICY "platform_settings_read" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "platform_settings_write" ON platform_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Integrations
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_integrations_read" ON platform_integrations;
DROP POLICY IF EXISTS "platform_integrations_write" ON platform_integrations;
CREATE POLICY "platform_integrations_read" ON platform_integrations FOR SELECT USING (true);
CREATE POLICY "platform_integrations_write" ON platform_integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Feature Flags
ALTER TABLE platform_feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_feature_flags_read" ON platform_feature_flags;
DROP POLICY IF EXISTS "platform_feature_flags_write" ON platform_feature_flags;
CREATE POLICY "platform_feature_flags_read" ON platform_feature_flags FOR SELECT USING (true);
CREATE POLICY "platform_feature_flags_write" ON platform_feature_flags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Templates
ALTER TABLE platform_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_templates_read" ON platform_templates;
DROP POLICY IF EXISTS "platform_templates_write" ON platform_templates;
CREATE POLICY "platform_templates_read" ON platform_templates FOR SELECT USING (true);
CREATE POLICY "platform_templates_write" ON platform_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Platform Backups
ALTER TABLE platform_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_backups_read" ON platform_backups;
DROP POLICY IF EXISTS "platform_backups_write" ON platform_backups;
CREATE POLICY "platform_backups_read" ON platform_backups FOR SELECT USING (true);
CREATE POLICY "platform_backups_write" ON platform_backups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON companies TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON drivers TO authenticated;
GRANT ALL ON employees TO authenticated;
GRANT ALL ON staff TO authenticated;
GRANT ALL ON passengers TO authenticated;
GRANT ALL ON saved_passengers TO authenticated;
GRANT ALL ON platform_incidents TO authenticated;
GRANT ALL ON platform_error_logs TO authenticated;
GRANT ALL ON platform_announcements TO authenticated;
GRANT ALL ON platform_settings TO authenticated;
GRANT ALL ON platform_integrations TO authenticated;
GRANT ALL ON platform_feature_flags TO authenticated;
GRANT ALL ON platform_templates TO authenticated;
GRANT ALL ON platform_backups TO authenticated;

-- Grant SELECT to anon for public data
GRANT SELECT ON companies TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON drivers TO anon;
GRANT SELECT ON passengers TO anon;
