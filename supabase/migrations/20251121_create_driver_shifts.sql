-- Create driver_shifts table for shift management
CREATE TABLE IF NOT EXISTS driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_date DATE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_shifts_shift_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_trip_id ON driver_shifts(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_id ON driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_bus_id ON driver_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);

-- Create unique constraint to prevent duplicate shifts for same trip
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_shifts_unique_trip 
  ON driver_shifts(trip_id) 
  WHERE status != 'cancelled';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_driver_shifts_updated_at ON driver_shifts;
CREATE TRIGGER trigger_update_driver_shifts_updated_at
  BEFORE UPDATE ON driver_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_shifts_updated_at();

-- Enable RLS
ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own shifts"
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = driver_shifts.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Operations can view all shifts"
  ON driver_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations', 'dispatcher')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Operations can manage shifts"
  ON driver_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations')
      AND user_roles.is_active = true
    )
  );

-- Add comment
COMMENT ON TABLE driver_shifts IS 'Stores driver shift assignments linking drivers and buses to trips';

-- Create view for shift details with all related data
CREATE OR REPLACE VIEW shift_details AS
SELECT 
  ds.id,
  ds.shift_date,
  ds.status as shift_status,
  ds.created_at,
  ds.updated_at,
  -- Trip details
  t.id as trip_id,
  t.trip_number,
  t.scheduled_departure,
  t.scheduled_arrival,
  t.status as trip_status,
  -- Route details
  r.id as route_id,
  r.origin,
  r.destination,
  r.distance_km,
  -- Driver details
  d.id as driver_id,
  d.full_name as driver_name,
  d.phone as driver_phone,
  d.license_number,
  -- Bus details
  b.id as bus_id,
  b.registration_number,
  b.seating_capacity,
  b.status as bus_status
FROM driver_shifts ds
LEFT JOIN trips t ON ds.trip_id = t.id
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN drivers d ON ds.driver_id = d.id
LEFT JOIN buses b ON ds.bus_id = b.id;

-- Grant permissions on view
GRANT SELECT ON shift_details TO authenticated;

-- Add comment on view
COMMENT ON VIEW shift_details IS 'Comprehensive view of shift assignments with all related details';
