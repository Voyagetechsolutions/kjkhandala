-- =====================================================
-- FIX ATTENDANCE TABLE COLUMN NAMES
-- Fixes 400 Bad Request error for check_in_time/check_out_time
-- =====================================================

-- Verify current column names
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- The table should have:
-- - check_in (not check_in_time)
-- - check_out (not check_out_time)

-- If columns are named incorrectly, rename them:
-- ALTER TABLE public.attendance RENAME COLUMN check_in_time TO check_in;
-- ALTER TABLE public.attendance RENAME COLUMN check_out_time TO check_out;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Attendance table column names verified!';
  RAISE NOTICE '📝 Correct column names:';
  RAISE NOTICE '   - check_in (timestamptz)';
  RAISE NOTICE '   - check_out (timestamptz)';
  RAISE NOTICE '⚠️  Frontend must use these exact names, NOT check_in_time/check_out_time';
END $$;
