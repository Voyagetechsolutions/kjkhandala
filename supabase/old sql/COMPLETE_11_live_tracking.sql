-- =====================================================
-- LIVE BUS TRACKING SCHEMA
-- =====================================================

-- Create bus_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS bus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed numeric DEFAULT 0,
  heading numeric DEFAULT 0, -- Direction in degrees (0-360)
  altitude numeric DEFAULT 0,
  accuracy numeric DEFAULT 0, -- GPS accuracy in meters
  status text DEFAULT 'idle' CHECK (status IN ('idle', 'moving', 'stopped')),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_updated_at ON bus_locations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_locations_status ON bus_locations(status);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bus_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS bus_locations_updated_at ON bus_locations;

-- Create trigger only on bus_locations table
CREATE TRIGGER bus_locations_updated_at
  BEFORE UPDATE ON bus_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_bus_location_timestamp();

-- RLS Policies for bus_locations
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read bus locations" ON bus_locations;
DROP POLICY IF EXISTS "Allow operations managers to manage bus locations" ON bus_locations;

-- Allow authenticated users to read locations
CREATE POLICY "Allow authenticated users to read bus locations"
  ON bus_locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow operations managers to insert/update locations
CREATE POLICY "Allow operations managers to manage bus locations"
  ON bus_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('OPERATIONS_MANAGER', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- Create view for latest bus locations
CREATE OR REPLACE VIEW latest_bus_locations AS
SELECT DISTINCT ON (bl.bus_id)
  bl.id,
  bl.bus_id,
  bl.latitude,
  bl.longitude,
  bl.speed,
  bl.heading,
  bl.altitude,
  bl.accuracy,
  bl.status,
  bl.updated_at,
  b.registration_number,
  b.make,
  b.model,
  b.status as bus_status
FROM bus_locations bl
JOIN buses b ON bl.bus_id = b.id
ORDER BY bl.bus_id, bl.updated_at DESC;

-- Grant access to view
GRANT SELECT ON latest_bus_locations TO authenticated;

-- Create function to update bus location
CREATE OR REPLACE FUNCTION update_bus_location(
  p_bus_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_speed numeric DEFAULT 0,
  p_heading numeric DEFAULT 0,
  p_altitude numeric DEFAULT 0,
  p_accuracy numeric DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  v_location_id uuid;
  v_status text;
BEGIN
  -- Determine status based on speed
  IF p_speed > 5 THEN
    v_status := 'moving';
  ELSIF p_speed > 0 THEN
    v_status := 'idle';
  ELSE
    v_status := 'stopped';
  END IF;

  -- Insert new location record
  INSERT INTO bus_locations (
    bus_id,
    latitude,
    longitude,
    speed,
    heading,
    altitude,
    accuracy,
    status
  ) VALUES (
    p_bus_id,
    p_latitude,
    p_longitude,
    p_speed,
    p_heading,
    p_altitude,
    p_accuracy,
    v_status
  )
  RETURNING id INTO v_location_id;

  RETURN v_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_bus_location TO authenticated;

-- Create function to get buses near a location
CREATE OR REPLACE FUNCTION get_buses_near_location(
  p_latitude numeric,
  p_longitude numeric,
  p_radius_km numeric DEFAULT 10
)
RETURNS TABLE (
  bus_id uuid,
  registration_number text,
  distance_km numeric,
  latitude numeric,
  longitude numeric,
  speed numeric,
  status text,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.bus_id,
    b.registration_number,
    -- Haversine formula for distance calculation
    (
      6371 * acos(
        cos(radians(p_latitude)) *
        cos(radians(bl.latitude)) *
        cos(radians(bl.longitude) - radians(p_longitude)) +
        sin(radians(p_latitude)) *
        sin(radians(bl.latitude))
      )
    ) as distance_km,
    bl.latitude,
    bl.longitude,
    bl.speed,
    bl.status,
    bl.updated_at
  FROM latest_bus_locations bl
  JOIN buses b ON bl.bus_id = b.id
  WHERE (
    6371 * acos(
      cos(radians(p_latitude)) *
      cos(radians(bl.latitude)) *
      cos(radians(bl.longitude) - radians(p_longitude)) +
      sin(radians(p_latitude)) *
      sin(radians(bl.latitude))
    )
  ) <= p_radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_buses_near_location TO authenticated;

-- Insert sample GPS data for testing (Gaborone area)
INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading, status)
SELECT
  id,
  -24.6282 + (random() * 0.1 - 0.05), -- Gaborone latitude with random offset
  25.9231 + (random() * 0.1 - 0.05),  -- Gaborone longitude with random offset
  (random() * 100)::numeric(5,2),      -- Random speed 0-100 km/h
  (random() * 360)::numeric(5,2),      -- Random heading 0-360 degrees
  CASE
    WHEN random() > 0.7 THEN 'moving'
    WHEN random() > 0.4 THEN 'idle'
    ELSE 'stopped'
  END
FROM buses
WHERE status = 'active'
LIMIT 10;

-- Create notification trigger for location updates
CREATE OR REPLACE FUNCTION notify_location_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'bus_location_update',
    json_build_object(
      'bus_id', NEW.bus_id,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'speed', NEW.speed,
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bus_location_notify
  AFTER INSERT OR UPDATE ON bus_locations
  FOR EACH ROW
  EXECUTE FUNCTION notify_location_update();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE bus_locations IS 'Real-time GPS tracking data for buses';
COMMENT ON COLUMN bus_locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN bus_locations.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN bus_locations.speed IS 'Current speed in km/h';
COMMENT ON COLUMN bus_locations.heading IS 'Direction of travel in degrees (0-360)';
COMMENT ON COLUMN bus_locations.altitude IS 'Altitude in meters above sea level';
COMMENT ON COLUMN bus_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN bus_locations.status IS 'Current status: idle, moving, or stopped';

COMMENT ON FUNCTION update_bus_location IS 'Update or insert new GPS location for a bus';
COMMENT ON FUNCTION get_buses_near_location IS 'Find buses within a specified radius of a location';
COMMENT ON VIEW latest_bus_locations IS 'Latest GPS location for each bus';
