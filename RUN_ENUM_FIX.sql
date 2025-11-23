-- Quick fix for trip_status enum mismatch
-- Run this in your Supabase SQL Editor

-- Add NOT_STARTED and EN_ROUTE to the trip_status enum
DO $$ 
BEGIN
  -- Add NOT_STARTED
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'NOT_STARTED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    ALTER TYPE trip_status ADD VALUE 'NOT_STARTED';
  END IF;

  -- Add EN_ROUTE
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'EN_ROUTE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    ALTER TYPE trip_status ADD VALUE 'EN_ROUTE';
  END IF;
END $$;

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
ORDER BY enumsortorder;
