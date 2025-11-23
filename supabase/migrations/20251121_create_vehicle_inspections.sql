-- Create vehicle_inspections table for pre-trip and post-trip inspections
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  inspection_type TEXT CHECK (inspection_type IN ('pre_trip', 'post_trip')) NOT NULL,
  status TEXT CHECK (status IN ('pass', 'pass_with_issues', 'fail')) NOT NULL,
  pass_rate NUMERIC(5,2) DEFAULT 0,
  can_drive BOOLEAN DEFAULT true,
  checklist JSONB,
  notes TEXT,
  odometer_reading INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_trip_id ON vehicle_inspections(trip_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_bus_id ON vehicle_inspections(bus_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_driver_id ON vehicle_inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_created_at ON vehicle_inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON vehicle_inspections(status);

-- Add columns to trips table for inspection tracking
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS pre_trip_inspection_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pre_trip_inspection_status TEXT,
ADD COLUMN IF NOT EXISTS post_trip_inspection_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS post_trip_inspection_status TEXT;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_vehicle_inspections_updated_at ON vehicle_inspections;
CREATE TRIGGER trigger_update_vehicle_inspections_updated_at
  BEFORE UPDATE ON vehicle_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_inspections_updated_at();

-- Enable RLS
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own inspections"
  ON vehicle_inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = vehicle_inspections.driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create inspections"
  ON vehicle_inspections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = driver_id
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all inspections"
  ON vehicle_inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations', 'maintenance')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Admin can manage all inspections"
  ON vehicle_inspections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operations', 'maintenance')
      AND user_roles.is_active = true
    )
  );

-- Add comment
COMMENT ON TABLE vehicle_inspections IS 'Stores pre-trip and post-trip vehicle inspection records';
