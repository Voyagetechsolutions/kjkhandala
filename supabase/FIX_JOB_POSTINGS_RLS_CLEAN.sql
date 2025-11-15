-- =====================================================
-- FIX JOB POSTINGS RLS POLICIES
-- Fixes 403 Forbidden error when creating job postings
-- =====================================================

-- STEP 1: Drop all existing insert policies
DROP POLICY IF EXISTS job_postings_insert_any_user ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_roles ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_admin ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_hr ON public.job_postings;
DROP POLICY IF EXISTS job_postings_insert_all ON public.job_postings;

-- STEP 2: Create the correct INSERT policy (ROLE-BASED using JWT)
-- This allows ONLY SUPER_ADMIN, ADMIN, and HR_MANAGER to insert
CREATE POLICY job_postings_insert_roles
ON public.job_postings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- STEP 3: Set default for posted_by to avoid NULL errors
ALTER TABLE public.job_postings
ALTER COLUMN posted_by SET DEFAULT auth.uid();

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'job_postings' AND cmd = 'INSERT';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Job postings INSERT RLS policy fixed!';
  RAISE NOTICE '📝 Only SUPER_ADMIN, ADMIN, and HR_MANAGER can create job postings';
  RAISE NOTICE '⚠️  Make sure your JWT includes a "role" claim';
END $$;
