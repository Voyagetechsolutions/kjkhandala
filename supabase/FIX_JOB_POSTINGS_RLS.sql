-- =====================================================
-- FIX JOB POSTINGS RLS POLICIES
-- Fixes 403 Forbidden error when creating job postings
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "job_postings_select_all" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_insert_hr" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_update_hr" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_delete_hr" ON public.job_postings;

-- Recreate with proper permissions
-- Everyone can view ACTIVE job postings (for careers page)
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

-- Fix job_postings RLS policies
-- Drop all existing insert policies
DROP POLICY IF EXISTS job_postings_insert_any_user ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_roles ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_admin ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_hr ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_all ON public.job_postings;

-- Create the correct INSERT policy (ROLE-BASED using JWT)
CREATE POLICY job_postings_insert_roles
ON public.job_postings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- Optional: Set default for posted_by to avoid NULL errors
ALTER TABLE public.job_postings
ALTER COLUMN posted_by SET DEFAULT auth.uid();
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR Managers can update their own or any job postings
CREATE POLICY "job_postings_update_hr" ON public.job_postings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR Managers can delete job postings
CREATE POLICY "job_postings_delete_hr" ON public.job_postings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_postings'
ORDER BY policyname;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Job postings RLS policies fixed!';
  RAISE NOTICE '📝 Policies created:';
  RAISE NOTICE '   - job_postings_select_all: Everyone can view ACTIVE postings';
  RAISE NOTICE '   - job_postings_insert_hr: HR can create postings';
  RAISE NOTICE '   - job_postings_update_hr: HR can update postings';
  RAISE NOTICE '   - job_postings_delete_hr: HR can delete postings';
END $$;
