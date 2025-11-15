-- =====================================================
-- FIX INCIDENTS RLS - COMPLETE
-- 1. Create helper functions
-- 2. Fix RLS policies for incidents
-- =====================================================

-- =====================================================
-- STEP 1: Create helper functions for role checking
-- =====================================================

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = role_name
    AND is_active = true
  );
END;
$$;

-- Helper function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(role_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(role_names)
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- STEP 2: Drop existing restrictive policies
-- =====================================================

DROP POLICY IF EXISTS "incidents_manage_ops" ON public.incidents;
DROP POLICY IF EXISTS "incidents_select_staff" ON public.incidents;

-- =====================================================
-- STEP 3: Create new granular RLS policies
-- =====================================================

-- Allow authenticated users to INSERT incidents where they are the reporter
CREATE POLICY "incidents_insert_authenticated"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reported_by
);

-- Allow staff to view incidents (or if they reported it)
CREATE POLICY "incidents_select_authenticated"
ON public.incidents
FOR SELECT
TO authenticated
USING (
  has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'DRIVER', 'TICKETING_AGENT'])
  OR auth.uid() = reported_by
);

-- Allow operations managers and admins to UPDATE incidents
CREATE POLICY "incidents_update_ops"
ON public.incidents
FOR UPDATE
TO authenticated
USING (
  has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'])
)
WITH CHECK (
  has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'])
);

-- Allow operations managers and admins to DELETE incidents
CREATE POLICY "incidents_delete_ops"
ON public.incidents
FOR DELETE
TO authenticated
USING (
  has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'])
);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Helper functions created successfully!';
  RAISE NOTICE '✅ Incidents RLS policies updated!';
  RAISE NOTICE '📝 Authenticated users can now INSERT incidents';
  RAISE NOTICE '📝 Staff can SELECT incidents';
  RAISE NOTICE '📝 Ops managers can UPDATE/DELETE incidents';
END $$;

-- Show current policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'incidents'
ORDER BY cmd, policyname;
