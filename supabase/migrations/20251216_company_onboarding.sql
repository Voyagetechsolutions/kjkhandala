-- =====================================================
-- Company Onboarding Migration
-- Handles company creation, owner invitations, and role assignments
-- =====================================================

-- Function to create a company and set up initial data
CREATE OR REPLACE FUNCTION create_company_with_owner(
  p_company_name TEXT,
  p_company_code TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_owner_phone TEXT DEFAULT NULL,
  p_subscription_tier TEXT DEFAULT 'starter',
  p_primary_color TEXT DEFAULT '#1E40AF',
  p_secondary_color TEXT DEFAULT '#3B82F6',
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'South Africa'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_company_code TEXT;
  v_slug TEXT;
  v_result JSON;
BEGIN
  -- Generate company code if not provided
  IF p_company_code IS NULL OR p_company_code = '' THEN
    v_company_code := UPPER(LEFT(REPLACE(p_company_name, ' ', ''), 3)) || '-' || 
                      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  ELSE
    v_company_code := p_company_code;
  END IF;

  -- Generate slug if not provided
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := LOWER(REGEXP_REPLACE(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := TRIM(BOTH '-' FROM v_slug);
  ELSE
    v_slug := p_slug;
  END IF;

  -- Create the company
  INSERT INTO companies (
    name,
    code,
    slug,
    email,
    phone,
    address,
    city,
    country,
    primary_color,
    secondary_color,
    subscription_tier,
    subscription_status,
    subscription_started_at,
    is_active,
    is_verified
  ) VALUES (
    p_company_name,
    v_company_code,
    v_slug,
    p_owner_email,
    p_owner_phone,
    p_address,
    p_city,
    p_country,
    p_primary_color,
    p_secondary_color,
    p_subscription_tier,
    'active',
    NOW(),
    TRUE,
    FALSE
  )
  RETURNING id INTO v_company_id;

  -- Create tenant settings
  INSERT INTO tenant_settings (
    company_id,
    slug,
    primary_color,
    secondary_color,
    support_email,
    support_phone,
    is_active
  ) VALUES (
    v_company_id,
    v_slug,
    p_primary_color,
    p_secondary_color,
    p_owner_email,
    p_owner_phone,
    TRUE
  )
  ON CONFLICT (company_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    support_email = EXCLUDED.support_email,
    support_phone = EXCLUDED.support_phone;

  -- Return result
  v_result := json_build_object(
    'success', TRUE,
    'company_id', v_company_id,
    'company_code', v_company_code,
    'slug', v_slug,
    'owner_email', p_owner_email
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to complete owner setup after they authenticate
CREATE OR REPLACE FUNCTION complete_owner_setup(
  p_user_id UUID,
  p_company_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update or create profile
  INSERT INTO profiles (
    id,
    full_name,
    phone,
    company_id,
    is_active
  ) VALUES (
    p_user_id,
    p_full_name,
    p_phone,
    p_company_id,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_id = EXCLUDED.company_id,
    is_active = TRUE,
    updated_at = NOW();

  -- Create ADMIN role for the owner
  INSERT INTO user_roles (
    user_id,
    role,
    role_level,
    company_id,
    is_active
  ) VALUES (
    p_user_id,
    'ADMIN',
    90,
    p_company_id,
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Mark company as verified
  UPDATE companies
  SET 
    is_verified = TRUE,
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = p_company_id;

  -- Create employee record for the owner
  INSERT INTO employees (
    user_id,
    company_id,
    full_name,
    phone,
    position,
    department,
    hire_date,
    employment_type,
    employment_status
  ) VALUES (
    p_user_id,
    p_company_id,
    p_full_name,
    p_phone,
    'Company Owner',
    'Management',
    CURRENT_DATE,
    'full_time',
    'active'
  )
  ON CONFLICT DO NOTHING;

  v_result := json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'company_id', p_company_id
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to add a user to a company with a specific role
CREATE OR REPLACE FUNCTION add_user_to_company(
  p_user_id UUID,
  p_company_id UUID,
  p_role TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_level INTEGER;
  v_result JSON;
BEGIN
  -- Determine role level
  v_role_level := CASE p_role
    WHEN 'SUPER_ADMIN' THEN 100
    WHEN 'ADMIN' THEN 90
    WHEN 'DEVELOPER' THEN 95
    WHEN 'OPERATIONS_MANAGER' THEN 80
    WHEN 'FINANCE_MANAGER' THEN 80
    WHEN 'HR_MANAGER' THEN 80
    WHEN 'MAINTENANCE_MANAGER' THEN 80
    WHEN 'TICKETING_SUPERVISOR' THEN 70
    WHEN 'TICKETING_AGENT' THEN 60
    WHEN 'DRIVER' THEN 50
    WHEN 'PASSENGER' THEN 10
    ELSE 50
  END;

  -- Update or create profile
  INSERT INTO profiles (
    id,
    full_name,
    phone,
    company_id,
    department,
    is_active
  ) VALUES (
    p_user_id,
    p_full_name,
    p_phone,
    p_company_id,
    p_department,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_id = EXCLUDED.company_id,
    department = COALESCE(EXCLUDED.department, profiles.department),
    is_active = TRUE,
    updated_at = NOW();

  -- Create role
  INSERT INTO user_roles (
    user_id,
    role,
    role_level,
    company_id,
    is_active
  ) VALUES (
    p_user_id,
    p_role,
    v_role_level,
    p_company_id,
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Create employee record if applicable
  IF p_role NOT IN ('PASSENGER') THEN
    INSERT INTO employees (
      user_id,
      company_id,
      full_name,
      phone,
      position,
      department,
      hire_date,
      employment_type,
      employment_status
    ) VALUES (
      p_user_id,
      p_company_id,
      p_full_name,
      p_phone,
      COALESCE(p_position, p_role),
      COALESCE(p_department, 'Operations'),
      CURRENT_DATE,
      'full_time',
      'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  v_result := json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'company_id', p_company_id,
    'role', p_role
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Function to get company details with owner info
CREATE OR REPLACE FUNCTION get_company_details(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_owner RECORD;
  v_result JSON;
BEGIN
  -- Get company
  SELECT * INTO v_company
  FROM companies
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Company not found');
  END IF;

  -- Get owner (first ADMIN)
  SELECT p.*, ur.role
  INTO v_owner
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.company_id = p_company_id
    AND ur.role = 'ADMIN'
    AND ur.is_active = TRUE
  ORDER BY ur.created_at ASC
  LIMIT 1;

  v_result := json_build_object(
    'success', TRUE,
    'company', row_to_json(v_company),
    'owner', CASE WHEN v_owner IS NOT NULL THEN row_to_json(v_owner) ELSE NULL END
  );

  RETURN v_result;
END;
$$;

-- Trigger to auto-set company_id on user_roles when profile has company_id
CREATE OR REPLACE FUNCTION sync_user_role_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If company_id is not set on the role but profile has one, use profile's company_id
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trg_sync_user_role_company_id ON user_roles;
CREATE TRIGGER trg_sync_user_role_company_id
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_company_id();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_company_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION complete_owner_setup TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_company TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_details TO authenticated;

-- Add index for faster company lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);

COMMENT ON FUNCTION create_company_with_owner IS 'Creates a new company with initial settings. Called during onboarding by platform admin.';
COMMENT ON FUNCTION complete_owner_setup IS 'Completes the owner setup after they authenticate via invite link.';
COMMENT ON FUNCTION add_user_to_company IS 'Adds a new user to a company with a specific role.';
COMMENT ON FUNCTION get_company_details IS 'Gets company details including owner information.';
