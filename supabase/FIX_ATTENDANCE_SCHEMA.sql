-- =====================================================
-- FIX ATTENDANCE TABLE SCHEMA
-- Fixes foreign key and column issues
-- =====================================================

-- STEP 1: Verify current attendance table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- STEP 2: Check if employee_id references the correct table
-- The FK should reference profiles.id (not employees.id)
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
WHERE tc.table_name = 'attendance' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- STEP 3: Drop old foreign key if it references wrong table
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_employee_id_fkey;

-- STEP 4: Add correct foreign key to profiles table
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- STEP 5: Add created_by column if it doesn't exist
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- STEP 6: Ensure all required columns exist with correct types
-- Check if columns exist and add if missing
DO $$ 
BEGIN
    -- Add status column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.attendance 
        ADD COLUMN status text DEFAULT 'present';
    END IF;

    -- Add work_hours column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'work_hours'
    ) THEN
        ALTER TABLE public.attendance 
        ADD COLUMN work_hours numeric;
    END IF;

    -- Add overtime_hours column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'overtime_hours'
    ) THEN
        ALTER TABLE public.attendance 
        ADD COLUMN overtime_hours numeric DEFAULT 0;
    END IF;
END $$;

-- STEP 7: Create or replace function to calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        NEW.work_hours := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
        
        -- Calculate overtime (assuming 8 hour work day)
        IF NEW.work_hours > 8 THEN
            NEW.overtime_hours := NEW.work_hours - 8;
        ELSE
            NEW.overtime_hours := 0;
        END IF;
        
        -- Set status based on check-in time (assuming 8:00 AM start)
        IF EXTRACT(HOUR FROM NEW.check_in) > 8 THEN
            NEW.status := 'late';
        ELSIF NEW.work_hours < 4 THEN
            NEW.status := 'half_day';
        ELSE
            NEW.status := 'present';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Create trigger for automatic work hours calculation
DROP TRIGGER IF EXISTS calculate_work_hours_trigger ON public.attendance;
CREATE TRIGGER calculate_work_hours_trigger
    BEFORE INSERT OR UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_work_hours();

-- STEP 9: Verify final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Attendance table schema fixed!';
  RAISE NOTICE '📝 Correct columns:';
  RAISE NOTICE '   - employee_id → references profiles(id)';
  RAISE NOTICE '   - check_in, check_out → timestamptz';
  RAISE NOTICE '   - created_by → uuid (added)';
  RAISE NOTICE '   - work_hours, overtime_hours → calculated automatically';
  RAISE NOTICE '   - status → calculated based on check-in time';
END $$;
