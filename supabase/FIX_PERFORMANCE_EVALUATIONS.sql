-- =====================================================
-- FIX PERFORMANCE EVALUATIONS TABLE
-- Adds missing score columns
-- =====================================================

-- STEP 1: Verify current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'performance_evaluations'
ORDER BY ordinal_position;

-- STEP 2: Add missing score columns
ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS attendance_score numeric CHECK (attendance_score >= 0 AND attendance_score <= 5);

ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS quality_of_work_score numeric CHECK (quality_of_work_score >= 0 AND quality_of_work_score <= 5);

ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS teamwork_score numeric CHECK (teamwork_score >= 0 AND teamwork_score <= 5);

ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS communication_score numeric CHECK (communication_score >= 0 AND communication_score <= 5);

ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS leadership_score numeric CHECK (leadership_score >= 0 AND leadership_score <= 5);

ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS problem_solving_score numeric CHECK (problem_solving_score >= 0 AND problem_solving_score <= 5);

-- STEP 3: Fix foreign key to reference profiles instead of employees
ALTER TABLE public.performance_evaluations 
DROP CONSTRAINT IF EXISTS performance_evaluations_employee_id_fkey;

ALTER TABLE public.performance_evaluations
ADD CONSTRAINT performance_evaluations_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- STEP 4: Add submitted_at column if missing
ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- STEP 5: Add status column if missing
ALTER TABLE public.performance_evaluations
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- STEP 6: Create function to auto-calculate overall rating
CREATE OR REPLACE FUNCTION calculate_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate average of all score columns (excluding NULLs)
    NEW.overall_rating := (
        COALESCE(NEW.attendance_score, 0) +
        COALESCE(NEW.quality_of_work_score, 0) +
        COALESCE(NEW.teamwork_score, 0) +
        COALESCE(NEW.communication_score, 0) +
        COALESCE(NEW.leadership_score, 0) +
        COALESCE(NEW.problem_solving_score, 0)
    ) / NULLIF(
        (CASE WHEN NEW.attendance_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN NEW.quality_of_work_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN NEW.teamwork_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN NEW.communication_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN NEW.leadership_score IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN NEW.problem_solving_score IS NOT NULL THEN 1 ELSE 0 END), 0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create trigger for automatic overall rating calculation
DROP TRIGGER IF EXISTS calculate_overall_rating_trigger ON public.performance_evaluations;
CREATE TRIGGER calculate_overall_rating_trigger
    BEFORE INSERT OR UPDATE ON public.performance_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_overall_rating();

-- STEP 8: Drop old RLS policies
DROP POLICY IF EXISTS performance_evaluations_select ON public.performance_evaluations;
DROP POLICY IF EXISTS performance_evaluations_insert ON public.performance_evaluations;
DROP POLICY IF EXISTS performance_evaluations_update ON public.performance_evaluations;
DROP POLICY IF EXISTS performance_evaluations_delete ON public.performance_evaluations;

-- STEP 9: Enable RLS
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

-- STEP 10: Create RLS policies
-- SELECT: Employees can view their own, HR/Managers can view all
CREATE POLICY performance_evaluations_select_policy ON public.performance_evaluations
FOR SELECT
TO authenticated
USING (
    employee_id = auth.uid()
    OR evaluator_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- INSERT: Only HR and Managers can create evaluations
CREATE POLICY performance_evaluations_insert_policy ON public.performance_evaluations
FOR INSERT
TO authenticated
WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER')
);

-- UPDATE: Only evaluator and HR can update
CREATE POLICY performance_evaluations_update_policy ON public.performance_evaluations
FOR UPDATE
TO authenticated
USING (
    evaluator_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
)
WITH CHECK (
    evaluator_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
);

-- DELETE: Only Super Admin can delete
CREATE POLICY performance_evaluations_delete_policy ON public.performance_evaluations
FOR DELETE
TO authenticated
USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN')
);

-- STEP 11: Verify final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'performance_evaluations'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Performance evaluations table fixed!';
  RAISE NOTICE '📝 Added score columns:';
  RAISE NOTICE '   - attendance_score';
  RAISE NOTICE '   - quality_of_work_score';
  RAISE NOTICE '   - teamwork_score';
  RAISE NOTICE '   - communication_score';
  RAISE NOTICE '   - leadership_score';
  RAISE NOTICE '   - problem_solving_score';
  RAISE NOTICE '   - overall_rating → auto-calculated';
  RAISE NOTICE '🔒 RLS policies created';
END $$;
