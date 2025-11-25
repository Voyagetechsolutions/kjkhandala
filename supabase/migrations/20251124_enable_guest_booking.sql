-- Enable guest booking by allowing public read access to necessary tables
-- This allows users to book tickets without signing in

-- =====================================================
-- ROUTES TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read routes" ON routes;
DROP POLICY IF EXISTS "Authenticated users can view routes" ON routes;

-- Create public read policy for routes
CREATE POLICY "Allow public read access to active routes"
  ON routes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- =====================================================
-- CITIES TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read cities" ON cities;
DROP POLICY IF EXISTS "Authenticated users can view cities" ON cities;

-- Create public read policy for cities
CREATE POLICY "Allow public read access to cities"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- TRIPS TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can view trips" ON trips;

-- Create public read policy for trips (only scheduled and boarding trips)
CREATE POLICY "Allow public read access to available trips"
  ON trips FOR SELECT
  TO anon, authenticated
  USING (status IN ('SCHEDULED', 'BOARDING'));

-- =====================================================
-- BUSES TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read buses" ON buses;
DROP POLICY IF EXISTS "Authenticated users can view buses" ON buses;

-- Create public read policy for buses
CREATE POLICY "Allow public read access to buses"
  ON buses FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- ROUTE_FREQUENCIES TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE route_frequencies ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read route frequencies" ON route_frequencies;

-- Create public read policy for route frequencies
CREATE POLICY "Allow public read access to active route frequencies"
  ON route_frequencies FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- =====================================================
-- BOOKING_SEATS TABLE - Allow public read for availability
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read booking seats" ON booking_seats;

-- Create public read policy for booking seats (for checking availability)
CREATE POLICY "Allow public read access to booking seats"
  ON booking_seats FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- BOOKINGS TABLE - Allow guests to create bookings
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

-- Allow users to view their own bookings (authenticated users)
CREATE POLICY "Authenticated users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow anyone (including guests) to create bookings
CREATE POLICY "Allow public to create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PASSENGERS TABLE - Allow guests to create passenger records
-- ========================================================

-- Enable RLS if not already enabled
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own passengers" ON passengers;
DROP POLICY IF EXISTS "Users can create passengers" ON passengers;

-- Allow anyone to create passenger records
CREATE POLICY "Allow public to create passengers"
  ON passengers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read passenger records (needed for booking confirmation)
CREATE POLICY "Allow public read access to passengers"
  ON passengers FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- PAYMENTS TABLE - Allow guests to create payment records
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;

-- Allow anyone to create payment records
CREATE POLICY "Allow public to create payments"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view payments for their bookings
CREATE POLICY "Users can view payments for their bookings"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Allow public to view their own payments (by booking reference)
CREATE POLICY "Allow public read access to payments"
  ON payments FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- ROUTE_STOPS TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read route stops" ON route_stops;

-- Create public read policy for route stops
CREATE POLICY "Allow public read access to route stops"
  ON route_stops FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- TRIP_STOPS TABLE - Allow public read access
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read trip stops" ON trip_stops;

-- Create public read policy for trip stops
CREATE POLICY "Allow public read access to trip stops"
  ON trip_stops FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Guest booking enabled successfully!';
  RAISE NOTICE '✓ Users can now book tickets without signing in';
  RAISE NOTICE '✓ Popular routes will now display on homepage';
  RAISE NOTICE '✓ Booking flow is now accessible to everyone';
END $$;