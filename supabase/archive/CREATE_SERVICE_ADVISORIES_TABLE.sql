-- Create service_advisories table for public website
CREATE TABLE IF NOT EXISTS service_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  affected_routes TEXT,
  is_active BOOLEAN DEFAULT true,
  expected_resolution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for active advisories
CREATE INDEX IF NOT EXISTS idx_service_advisories_active ON service_advisories(is_active, created_at DESC);

-- Enable RLS
ALTER TABLE service_advisories ENABLE ROW LEVEL SECURITY;

-- Public can read active advisories
CREATE POLICY "Public can view active service advisories"
  ON service_advisories
  FOR SELECT
  USING (is_active = true);

-- Authenticated users with admin role can manage advisories
CREATE POLICY "Admins can manage service advisories"
  ON service_advisories
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin', 'operations_manager')
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_service_advisories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_advisories_updated_at
  BEFORE UPDATE ON service_advisories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_advisories_updated_at();

-- Insert sample data (optional - remove in production)
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active, expected_resolution)
VALUES 
  (
    'Road Maintenance on Gaborone-Francistown Route',
    'Due to ongoing road maintenance between Palapye and Mahalapye, expect delays of up to 30 minutes. We recommend arriving at the terminal 15 minutes earlier than usual.',
    'warning',
    'Gaborone - Francistown',
    true,
    NOW() + INTERVAL '7 days'
  ),
  (
    'New Terminal Location in Kasane',
    'Our Kasane terminal has moved to a new location at Plot 234, Main Road, next to Chobe Safari Lodge. Please update your records.',
    'info',
    'All routes to/from Kasane',
    true,
    NULL
  );

COMMENT ON TABLE service_advisories IS 'Public service advisories for website visitors about delays, changes, and important notices';
