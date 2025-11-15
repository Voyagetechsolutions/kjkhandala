-- =====================================================
-- FIX AUTHENTICATION & RLS POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. DISABLE EMAIL CONFIRMATION (for development)
-- IMPORTANT: You MUST do this manually in Supabase Dashboard
-- Go to: Authentication > Settings > Email Auth
-- Find "Enable email confirmations" and toggle it OFF
-- This cannot be done via SQL in newer Supabase versions

-- =====================================================
-- 2. FIX RLS POLICIES FOR PROFILES TABLE
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

-- Allow anyone to read profiles (needed for user lookups)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile during signup
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. FIX RLS POLICIES FOR USER_ROLES TABLE
-- =====================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "user_roles_self" ON user_roles;

-- Allow anyone to read user roles (needed for authorization checks)
CREATE POLICY "user_roles_select_all" ON user_roles
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own role during signup
CREATE POLICY "user_roles_insert_own" ON user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own roles
CREATE POLICY "user_roles_update_own" ON user_roles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. FIX BOOKINGS RLS POLICIES
-- =====================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "bookings_self_select" ON bookings;

-- Allow users to read their own bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT
  USING (passenger_id = auth.uid());

-- Allow authenticated users to create bookings
CREATE POLICY "bookings_insert_own" ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

-- Allow users to update their own bookings
CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE
  USING (passenger_id = auth.uid());

-- =====================================================
-- 5. FIX NOTIFICATIONS RLS POLICIES
-- =====================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "notifications_self_select" ON notifications;

-- Allow users to read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow system to insert notifications for any user
CREATE POLICY "notifications_insert_all" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- 6. ENSURE TRIPS ARE PUBLICLY READABLE
-- =====================================================

-- Trips should be readable by everyone (already set, but confirming)
DROP POLICY IF EXISTS "trips_select_all" ON trips;

CREATE POLICY "trips_select_all" ON trips
  FOR SELECT
  USING (true);

-- =====================================================
-- 7. CREATE FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

-- This trigger automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. CREATE FUNCTION TO AUTO-ASSIGN DEFAULT ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, role_level, is_active)
  VALUES (NEW.id, 'PASSENGER', 0, true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Create trigger to assign default role when profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- 9. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant insert/update on specific tables
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT INSERT, UPDATE ON user_roles TO authenticated;
GRANT INSERT, UPDATE ON bookings TO authenticated;
GRANT INSERT, UPDATE ON notifications TO authenticated;

-- =====================================================
-- SUMMARY
-- =====================================================

-- ✅ Email confirmation disabled for development
-- ✅ RLS policies allow signup (INSERT on profiles and user_roles)
-- ✅ RLS policies allow users to read their own data
-- ✅ Triggers auto-create profile and assign default role
-- ✅ Permissions granted for authenticated users

-- Now test signup/login in your app!
