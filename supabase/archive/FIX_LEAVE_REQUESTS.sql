-- =====================================================
-- FIX LEAVE REQUESTS TABLE
-- Fixes foreign key constraint
-- =====================================================

-- STEP 1: Verify current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- STEP 2: Check current foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'leave_requests' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- STEP 3: Drop old foreign key that references employees table
ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;

-- STEP 4: Add correct foreign key to profiles table
ALTER TABLE public.leave_requests
ADD CONSTRAINT leave_requests_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- STEP 5: Ensure days_requested column exists
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS days_requested integer;

-- STEP 6: Create function to auto-calculate days_requested
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate days between start_date and end_date (inclusive)
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        NEW.days_requested := (NEW.end_date - NEW.start_date) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create trigger for automatic days calculation
DROP TRIGGER IF EXISTS calculate_leave_days_trigger ON public.leave_requests;
CREATE TRIGGER calculate_leave_days_trigger
    BEFORE INSERT OR UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_days();

-- STEP 8: Add approved_by and rejected_reason columns if missing
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS rejected_reason text;

ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- STEP 9: Drop old RLS policies
DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete ON public.leave_requests;

-- STEP 10: Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- STEP 11: Create RLS policies
-- SELECT: Employees can view their own, HR can view all
CREATE POLICY leave_requests_select_policy ON public.leave_requests
FOR SELECT
TO authenticated
USING (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER')
);

-- INSERT: Employees can create their own leave requests
CREATE POLICY leave_requests_insert_policy ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- UPDATE: Employee can update own pending requests, HR can update all
CREATE POLICY leave_requests_update_policy ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
    (employee_id = auth.uid() AND status = 'pending')
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER')
)
WITH CHECK (
    (employee_id = auth.uid() AND status = 'pending')
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER')
);

-- DELETE: Only employee (own pending) and HR can delete
CREATE POLICY leave_requests_delete_policy ON public.leave_requests
FOR DELETE
TO authenticated
USING (
    (employee_id = auth.uid() AND status = 'pending')
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- STEP 12: Verify final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- STEP 13: Verify foreign keys
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'leave_requests' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Leave requests table fixed!';
  RAISE NOTICE '📝 Changes:';
  RAISE NOTICE '   - employee_id → references profiles(id)';
  RAISE NOTICE '   - days_requested → auto-calculated from dates';
  RAISE NOTICE '   - approved_by, rejected_reason, approved_at → added';
  RAISE NOTICE '🔒 RLS policies created';
  RAISE NOTICE '⚠️  Make sure employee_id exists in profiles table!';
END $$;
