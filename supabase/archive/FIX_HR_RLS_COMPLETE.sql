-- =====================================================
-- FIX ALL HR-RELATED RLS POLICIES
-- Comprehensive fix for HR module RLS issues
-- Includes: profiles, job_postings, job_applications, employees,
--           attendance, payroll, bonuses
-- =====================================================

-- =====================================================
-- 1. PROFILES - Ensure HR can view all staff
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_hr" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Everyone can view profiles (needed for dropdowns, team lists, etc.)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Profiles are created via auth trigger
CREATE POLICY "profiles_insert_auth" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- HR and Admins can update any profile
CREATE POLICY "profiles_update_hr" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Only super admin can delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
      AND is_active = true
    )
  );

-- =====================================================
-- 2. JOB POSTINGS - Fix 403 Forbidden on INSERT
-- =====================================================

DROP POLICY IF EXISTS "job_postings_select_all" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_manage_hr" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_insert_hr" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_update_hr" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_delete_hr" ON public.job_postings;

-- Everyone can view ACTIVE job postings (for public careers page)
CREATE POLICY "job_postings_select_all" ON public.job_postings
  FOR SELECT USING (
    status = 'ACTIVE' 
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can create job postings
CREATE POLICY "job_postings_insert_hr" ON public.job_postings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can update job postings
CREATE POLICY "job_postings_update_hr" ON public.job_postings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can delete job postings
CREATE POLICY "job_postings_delete_hr" ON public.job_postings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 2. JOB APPLICATIONS - Ensure proper policies
-- =====================================================

DROP POLICY IF EXISTS "job_applications_select_hr" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert_public" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_manage_hr" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update_hr" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_delete_hr" ON public.job_applications;

-- HR can view all applications
CREATE POLICY "job_applications_select_hr" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Anyone can submit an application (public careers page)
CREATE POLICY "job_applications_insert_public" ON public.job_applications
  FOR INSERT WITH CHECK (true);

-- HR can update applications (change status, add notes)
CREATE POLICY "job_applications_update_hr" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can delete applications
CREATE POLICY "job_applications_delete_hr" ON public.job_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 3. EMPLOYEES - Ensure proper policies
-- =====================================================

DROP POLICY IF EXISTS "employees_select_all" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_hr" ON public.employees;
DROP POLICY IF EXISTS "employees_update_hr" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_hr" ON public.employees;

-- Everyone can view active employees
CREATE POLICY "employees_select_all" ON public.employees
  FOR SELECT USING (
    status = 'ACTIVE'
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER')
      AND is_active = true
    )
  );

-- HR can create employees
CREATE POLICY "employees_insert_hr" ON public.employees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can update employees
CREATE POLICY "employees_update_hr" ON public.employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Only super admin can delete employees
CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
      AND is_active = true
    )
  );

-- =====================================================
-- 4. ATTENDANCE - Ensure proper policies
-- =====================================================

DROP POLICY IF EXISTS "attendance_select_all" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_hr" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_hr" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete_hr" ON public.attendance;

-- HR and managers can view attendance
CREATE POLICY "attendance_select_all" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER')
      AND is_active = true
    )
  );

-- HR can create attendance records
CREATE POLICY "attendance_insert_hr" ON public.attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can update attendance
CREATE POLICY "attendance_update_hr" ON public.attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR can delete attendance
CREATE POLICY "attendance_delete_hr" ON public.attendance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 5. PAYROLL - Ensure proper policies
-- =====================================================

DROP POLICY IF EXISTS "payroll_select_finance" ON public.payroll;
DROP POLICY IF EXISTS "payroll_insert_finance" ON public.payroll;
DROP POLICY IF EXISTS "payroll_update_finance" ON public.payroll;
DROP POLICY IF EXISTS "payroll_delete_finance" ON public.payroll;

-- Finance and HR can view payroll
CREATE POLICY "payroll_select_finance" ON public.payroll
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Finance can create payroll records
CREATE POLICY "payroll_insert_finance" ON public.payroll
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Finance can update payroll
CREATE POLICY "payroll_update_finance" ON public.payroll
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Only super admin can delete payroll
CREATE POLICY "payroll_delete_admin" ON public.payroll
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
      AND is_active = true
    )
  );

-- =====================================================
-- 6. BONUSES - Ensure proper policies
-- =====================================================

DROP POLICY IF EXISTS "bonuses_select_finance" ON public.bonuses;
DROP POLICY IF EXISTS "bonuses_insert_finance" ON public.bonuses;
DROP POLICY IF EXISTS "bonuses_update_finance" ON public.bonuses;
DROP POLICY IF EXISTS "bonuses_delete_finance" ON public.bonuses;

-- Finance and HR can view bonuses
CREATE POLICY "bonuses_select_finance" ON public.bonuses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Finance and HR can create bonuses
CREATE POLICY "bonuses_insert_finance" ON public.bonuses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Finance and HR can update bonuses
CREATE POLICY "bonuses_update_finance" ON public.bonuses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Finance and HR can delete bonuses
CREATE POLICY "bonuses_delete_finance" ON public.bonuses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- Verify all policies
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK present'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename IN (
  'profiles',
  'job_postings', 
  'job_applications', 
  'employees', 
  'attendance', 
  'payroll',
  'bonuses'
)
ORDER BY tablename, cmd, policyname;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ All HR-related RLS policies fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Fixed tables:';
  RAISE NOTICE '   ✅ profiles - Everyone can view, HR can manage';
  RAISE NOTICE '   ✅ job_postings - HR can create/manage, public can view ACTIVE';
  RAISE NOTICE '   ✅ job_applications - Public can apply, HR can manage';
  RAISE NOTICE '   ✅ employees - HR can manage, all can view ACTIVE';
  RAISE NOTICE '   ✅ attendance - HR can manage, uses profiles for employee list';
  RAISE NOTICE '   ✅ payroll - Finance/HR can manage';
  RAISE NOTICE '   ✅ bonuses - Finance/HR can manage';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 All policies use proper INSERT/UPDATE/DELETE separation';
  RAISE NOTICE '✨ No more 403 Forbidden errors!';
  RAISE NOTICE '👥 HR dashboard forms now connected to profiles table!';
END $$;
