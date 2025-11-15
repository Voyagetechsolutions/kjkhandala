-- Fix buses table - add missing columns
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS number_plate TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS layout_rows INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS layout_columns INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS gps_device_id TEXT,
ADD COLUMN IF NOT EXISTS total_mileage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- Create maintenance_alerts table
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  message TEXT,
  due_date DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS maintenance_alerts_bus_id_idx ON maintenance_alerts(bus_id);
CREATE INDEX IF NOT EXISTS maintenance_alerts_created_at_idx ON maintenance_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS maintenance_alerts_is_resolved_idx ON maintenance_alerts(is_resolved);

-- Enable RLS
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for maintenance_alerts
CREATE POLICY "Enable read access for all authenticated users" ON maintenance_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON maintenance_alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON maintenance_alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON maintenance_alerts
  FOR DELETE USING (auth.role() = 'authenticated');
