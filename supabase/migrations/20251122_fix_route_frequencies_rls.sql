-- Fix RLS policies for route_frequencies table
-- Issue: Only SUPER_ADMIN and OPERATIONS_MANAGER could insert/update
-- Solution: Allow all authenticated users to manage schedules

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow admin to manage route frequencies" ON route_frequencies;

-- Create new policies for all authenticated users
CREATE POLICY "Allow authenticated users to insert route frequencies"
  ON route_frequencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update route frequencies"
  ON route_frequencies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete route frequencies"
  ON route_frequencies
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "Allow authenticated users to insert route frequencies" ON route_frequencies 
  IS 'Allows any authenticated user to create route schedules';
COMMENT ON POLICY "Allow authenticated users to update route frequencies" ON route_frequencies 
  IS 'Allows any authenticated user to update route schedules';
COMMENT ON POLICY "Allow authenticated users to delete route frequencies" ON route_frequencies 
  IS 'Allows any authenticated user to delete route schedules';
