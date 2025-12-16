-- =====================================================
-- FIX AUTH TRIGGERS THAT BLOCK USER CREATION
-- =====================================================
-- The loyalty_accounts trigger was causing 500 errors when
-- creating new users via magic link/OTP because it fails
-- if the insert encounters any issues.

-- =====================================================
-- 1. FIX LOYALTY ACCOUNT TRIGGER
-- =====================================================
-- Make the trigger more robust by wrapping in exception handler

CREATE OR REPLACE FUNCTION create_loyalty_account_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create loyalty account when user signs up
  -- Wrapped in exception handler to not block user creation
  BEGIN
    INSERT INTO loyalty_accounts (customer_id, total_points, tier)
    VALUES (NEW.id, 0, 'silver')
    ON CONFLICT (customer_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create loyalty account for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CHECK FOR OTHER PROBLEMATIC TRIGGERS ON AUTH.USERS
-- =====================================================

-- Create a safe profile creation trigger that doesn't fail
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, company_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      (NEW.raw_user_meta_data->>'company_id')::UUID
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      email = COALESCE(EXCLUDED.email, profiles.email),
      company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 3. ENSURE PROFILES TABLE HAS CORRECT STRUCTURE
-- =====================================================

-- Make sure company_id column exists and is nullable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
END $$;

-- =====================================================
-- 4. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure the functions can insert into required tables
GRANT INSERT, UPDATE ON public.profiles TO service_role;
GRANT INSERT, UPDATE ON public.loyalty_accounts TO service_role;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON FUNCTION create_loyalty_account_for_user IS 'Creates loyalty account for new users. Wrapped in exception handler to not block user creation.';
COMMENT ON FUNCTION handle_new_user IS 'Creates profile for new users with company_id from metadata. Wrapped in exception handler.';
