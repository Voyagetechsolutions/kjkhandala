-- Fix RLS policy for trips table to allow INSERT operations
-- This is needed for materializing projected trips during booking

-- =====================================================
-- TRIPS TABLE - Add INSERT policy
-- =====================================================

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow public to insert trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to insert trips" ON trips;
DROP POLICY IF EXISTS "System can create trips" ON trips;

-- Allow authenticated users and service role to insert trips
-- This is needed when materializing projected trips during booking
CREATE POLICY "Allow trip creation for booking flow"
  ON trips FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Only allow creating trips with SCHEDULED status
    status = 'SCHEDULED'
  );

-- Also add UPDATE policy for trip status changes
DROP POLICY IF EXISTS "Allow trip updates" ON trips;

CREATE POLICY "Allow authenticated users to update trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Trips INSERT policy created successfully!';
  RAISE NOTICE '✓ Users can now create trips during booking flow';
  RAISE NOTICE '✓ Projected trips can be materialized';
END $$;
