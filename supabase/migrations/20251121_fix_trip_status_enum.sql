-- Fix trip_status enum - Database uses SCHEDULED/IN_PROGRESS, mobile app expects NOT_STARTED/EN_ROUTE
-- Solution: Add the mobile app values as aliases

DO $$ 
BEGIN
  -- Check if trip_status type exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;

  -- Add NOT_STARTED as an alias for SCHEDULED
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'NOT_STARTED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'NOT_STARTED';
  END IF;

  -- Add EN_ROUTE as an alias for IN_PROGRESS
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'EN_ROUTE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
  ) THEN
    ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'EN_ROUTE';
  END IF;
END $$;

-- Add comment explaining the enum values
COMMENT ON TYPE trip_status IS 'Trip status: SCHEDULED/NOT_STARTED (same), IN_PROGRESS/EN_ROUTE (same), COMPLETED, CANCELLED';
