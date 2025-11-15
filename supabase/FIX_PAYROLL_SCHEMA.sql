-- =====================================================
-- FIX PAYROLL TABLE SCHEMA
-- Fixes missing columns and adds RLS policies
-- =====================================================

-- STEP 1: Verify current payroll table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payroll'
ORDER BY ordinal_position;

-- STEP 2: Remove columns that don't exist from your schema
-- The table does NOT have: bonuses, created_by
-- Ensure your frontend doesn't send these columns

-- STEP 3: Verify foreign keys are correct
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
WHERE tc.table_name = 'payroll' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- STEP 4: Fix employee_id foreign key to reference profiles (not employees)
ALTER TABLE public.payroll 
DROP CONSTRAINT IF EXISTS payroll_employee_id_fkey;

ALTER TABLE public.payroll
ADD CONSTRAINT payroll_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- STEP 5: Add created_by column if needed
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- STEP 6: Add bonuses column if needed (optional)
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS bonuses numeric DEFAULT 0;

-- STEP 7: Ensure all numeric columns have proper defaults
ALTER TABLE public.payroll
ALTER COLUMN allowances SET DEFAULT 0,
ALTER COLUMN deductions SET DEFAULT 0,
ALTER COLUMN tax SET DEFAULT 0,
ALTER COLUMN basic_salary SET DEFAULT 0,
ALTER COLUMN gross_salary SET DEFAULT 0,
ALTER COLUMN net_salary SET DEFAULT 0;

-- STEP 8: Create function to auto-calculate gross and net salary
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate gross salary
    NEW.gross_salary := COALESCE(NEW.basic_salary, 0) 
                      + COALESCE(NEW.allowances, 0) 
                      + COALESCE(NEW.bonuses, 0);
    
    -- Calculate net salary
    NEW.net_salary := NEW.gross_salary 
                    - COALESCE(NEW.deductions, 0) 
                    - COALESCE(NEW.tax, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create trigger for automatic salary calculation
DROP TRIGGER IF EXISTS calculate_payroll_totals_trigger ON public.payroll;
CREATE TRIGGER calculate_payroll_totals_trigger
    BEFORE INSERT OR UPDATE ON public.payroll
    FOR EACH ROW
    EXECUTE FUNCTION calculate_payroll_totals();

-- STEP 10: Drop all existing RLS policies
DROP POLICY IF EXISTS payroll_select_all ON public.payroll;
DROP POLICY IF EXISTS payroll_insert_hr ON public.payroll;
DROP POLICY IF EXISTS payroll_update_hr ON public.payroll;
DROP POLICY IF EXISTS payroll_delete_hr ON public.payroll;

-- STEP 11: Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- STEP 12: Create RLS policies

-- SELECT: Employees can view their own payroll, HR/Admin can view all
CREATE POLICY payroll_select_policy ON public.payroll
FOR SELECT
TO authenticated
USING (
    employee_id = auth.uid()
    OR
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')
);

-- INSERT: Only HR and Finance can create payroll records
CREATE POLICY payroll_insert_policy ON public.payroll
FOR INSERT
TO authenticated
WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')
);

-- UPDATE: Only HR and Finance can update payroll records
CREATE POLICY payroll_update_policy ON public.payroll
FOR UPDATE
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')
)
WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')
);

-- DELETE: Only Super Admin can delete payroll records
CREATE POLICY payroll_delete_policy ON public.payroll
FOR DELETE
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN')
);

-- STEP 13: Verify final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payroll'
ORDER BY ordinal_position;

-- STEP 14: Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'payroll'
ORDER BY policyname;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Payroll table schema fixed!';
  RAISE NOTICE '📝 Correct columns:';
  RAISE NOTICE '   - employee_id → references profiles(id)';
  RAISE NOTICE '   - bonuses → added (numeric, default 0)';
  RAISE NOTICE '   - created_by → added (uuid)';
  RAISE NOTICE '   - gross_salary, net_salary → calculated automatically';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '   - SELECT: Employees see own, HR/Finance see all';
  RAISE NOTICE '   - INSERT/UPDATE: HR_MANAGER, FINANCE_MANAGER only';
  RAISE NOTICE '   - DELETE: SUPER_ADMIN, ADMIN only';
END $$;
