-- =====================================================
-- FIX INCIDENTS RLS POLICY
-- Allow authenticated users to insert incidents
-- =====================================================

-- Drop existing restrictive policy that blocks regular users
DROP POLICY IF EXISTS "incidents_manage_ops" ON public.incidents;

-- Allow authenticated users to INSERT incidents where they are the reporter
CREATE POLICY "incidents_insert_authenticated"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reported_by
);

-- Allow staff to view incidents
CREATE POLICY "incidents_select_staff"
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
  RAISE NOTICE '✅ Incidents RLS policies updated!';
  RAISE NOTICE '📝 Authenticated users can now INSERT incidents';
  RAISE NOTICE '📝 Staff can SELECT incidents';
  RAISE NOTICE '📝 Ops managers can UPDATE/DELETE incidents';
END $$;
