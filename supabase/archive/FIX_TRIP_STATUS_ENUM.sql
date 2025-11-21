-- =====================================================
-- FIX: Add missing trip_status enum values
-- This adds DEPARTED and BOARDING if they don't exist
-- =====================================================

-- =====================================================
-- STEP 1: Add missing enum values safely
-- =====================================================

-- Add BOARDING if it doesn't exist (after SCHEDULED)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'BOARDING' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    ALTER TYPE trip_status ADD VALUE 'BOARDING' AFTER 'SCHEDULED';
    RAISE NOTICE 'Added BOARDING to trip_status enum';
  ELSE
    RAISE NOTICE 'BOARDING already exists in trip_status enum';
  END IF;
END $$;

-- Add DEPARTED if it doesn't exist (after BOARDING)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'DEPARTED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    -- Check if BOARDING exists to add after it
    IF EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'BOARDING' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
    ) THEN
      ALTER TYPE trip_status ADD VALUE 'DEPARTED' AFTER 'BOARDING';
    ELSE
      -- If BOARDING doesn't exist, add after SCHEDULED
      ALTER TYPE trip_status ADD VALUE 'DEPARTED' AFTER 'SCHEDULED';
    END IF;
    RAISE NOTICE 'Added DEPARTED to trip_status enum';
  ELSE
    RAISE NOTICE 'DEPARTED already exists in trip_status enum';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Verify the enum values
-- =====================================================

DO $$ 
DECLARE
  enum_values TEXT;
BEGIN 
  SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) 
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status');
  
  RAISE NOTICE '✅ trip_status enum updated successfully!';
  RAISE NOTICE '📋 Current values: %', enum_values;
END $$;

-- Show all enum values in order
SELECT 
  enumlabel as status_value,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'trip_status'
)
ORDER BY enumsortorder;
