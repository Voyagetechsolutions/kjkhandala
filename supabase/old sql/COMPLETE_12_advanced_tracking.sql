-- =====================================================
-- ADVANCED TRACKING FEATURES
-- Geofencing, Route History, Alerts
-- =====================================================

-- Create geofences table for zone monitoring
CREATE TABLE IF NOT EXISTS geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  center_lat numeric NOT NULL,
  center_lng numeric NOT NULL,
  radius_meters numeric NOT NULL DEFAULT 1000,
  type text DEFAULT 'circular' CHECK (type IN ('circular', 'polygon')),
  polygon_coordinates jsonb, -- For polygon geofences
  is_active boolean DEFAULT true,
  alert_on_entry boolean DEFAULT true,
  alert_on_exit boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create geofence_events table for tracking entries/exits
CREATE TABLE IF NOT EXISTS geofence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geofence_id uuid REFERENCES geofences(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('entry', 'exit')),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bus_routes table for route visualization
CREATE TABLE IF NOT EXISTS bus_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  route_coordinates jsonb NOT NULL, -- Array of {lat, lng, timestamp}
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  total_distance_km numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_geofences_active ON geofences(is_active);
CREATE INDEX idx_geofence_events_bus_id ON geofence_events(bus_id);
CREATE INDEX idx_geofence_events_created_at ON geofence_events(created_at DESC);
CREATE INDEX idx_bus_routes_bus_id ON bus_routes(bus_id);
CREATE INDEX idx_bus_routes_trip_id ON bus_routes(trip_id);
CREATE INDEX idx_bus_routes_active ON bus_routes(is_active);

-- Function to check if bus is inside geofence
CREATE OR REPLACE FUNCTION check_geofence_entry(
  p_bus_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_speed numeric DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_geofence RECORD;
  v_distance numeric;
  v_last_event text;
BEGIN
  -- Check all active geofences
  FOR v_geofence IN 
    SELECT * FROM geofences WHERE is_active = true AND type = 'circular'
  LOOP
    -- Calculate distance using Haversine formula
    v_distance := (
      6371000 * acos(
        cos(radians(p_latitude)) *
        cos(radians(v_geofence.center_lat)) *
        cos(radians(v_geofence.center_lng) - radians(p_longitude)) +
        sin(radians(p_latitude)) *
        sin(radians(v_geofence.center_lat))
      )
    );
    
    -- Get last event for this bus and geofence
    SELECT event_type INTO v_last_event
    FROM geofence_events
    WHERE bus_id = p_bus_id AND geofence_id = v_geofence.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if bus entered geofence
    IF v_distance <= v_geofence.radius_meters AND (v_last_event IS NULL OR v_last_event = 'exit') THEN
      IF v_geofence.alert_on_entry THEN
        INSERT INTO geofence_events (geofence_id, bus_id, event_type, latitude, longitude, speed)
        VALUES (v_geofence.id, p_bus_id, 'entry', p_latitude, p_longitude, p_speed);
      END IF;
    -- Check if bus exited geofence
    ELSIF v_distance > v_geofence.radius_meters AND v_last_event = 'entry' THEN
      IF v_geofence.alert_on_exit THEN
        INSERT INTO geofence_events (geofence_id, bus_id, event_type, latitude, longitude, speed)
        VALUES (v_geofence.id, p_bus_id, 'exit', p_latitude, p_longitude, p_speed);
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check geofence on location update
CREATE OR REPLACE FUNCTION trigger_check_geofence()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_geofence_entry(NEW.bus_id, NEW.latitude, NEW.longitude, NEW.speed);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bus_location_geofence_check ON bus_locations;
CREATE TRIGGER bus_location_geofence_check
  AFTER INSERT ON bus_locations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_geofence();

-- Function to get historical route for a bus
CREATE OR REPLACE FUNCTION get_bus_route_history(
  p_bus_id uuid,
  p_start_time timestamptz DEFAULT now() - interval '24 hours',
  p_end_time timestamptz DEFAULT now()
)
RETURNS TABLE (
  latitude numeric,
  longitude numeric,
  speed numeric,
  status text,
  recorded_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.latitude,
    bl.longitude,
    bl.speed,
    bl.status,
    bl.created_at as recorded_at
  FROM bus_locations bl
  WHERE bl.bus_id = p_bus_id
    AND bl.created_at >= p_start_time
    AND bl.created_at <= p_end_time
  ORDER BY bl.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active geofences
CREATE OR REPLACE FUNCTION get_active_geofences()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  center_lat numeric,
  center_lng numeric,
  radius_meters numeric,
  type text,
  polygon_coordinates jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.center_lat,
    g.center_lng,
    g.radius_meters,
    g.type,
    g.polygon_coordinates
  FROM geofences g
  WHERE g.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample geofences
INSERT INTO geofences (name, description, center_lat, center_lng, radius_meters, alert_on_entry, alert_on_exit)
VALUES
  ('Gaborone Bus Terminal', 'Main bus terminal in Gaborone', -24.6282, 25.9231, 500, true, true),
  ('Francistown Station', 'Francistown bus station', -21.1700, 27.5100, 500, true, true),
  ('Maun Terminal', 'Maun bus terminal', -19.9833, 23.4167, 500, true, true),
  ('Kasane Border', 'Kasane border crossing', -17.8167, 25.1500, 1000, true, true)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read geofences"
  ON geofences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read geofence events"
  ON geofence_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read bus routes"
  ON bus_routes FOR SELECT TO authenticated USING (true);

-- Allow operations managers to manage
CREATE POLICY "Allow operations managers to manage geofences"
  ON geofences FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('OPERATIONS_MANAGER', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_geofence_entry TO authenticated;
GRANT EXECUTE ON FUNCTION get_bus_route_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_geofences TO authenticated;

-- Comments
COMMENT ON TABLE geofences IS 'Geofence zones for bus monitoring';
COMMENT ON TABLE geofence_events IS 'Log of bus entries and exits from geofences';
COMMENT ON TABLE bus_routes IS 'Historical route data for buses';
COMMENT ON FUNCTION check_geofence_entry IS 'Check if bus entered or exited a geofence';
COMMENT ON FUNCTION get_bus_route_history IS 'Get historical route data for a bus';
COMMENT ON FUNCTION get_active_geofences IS 'Get all active geofence zones';
