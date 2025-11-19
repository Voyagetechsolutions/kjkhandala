-- ============================================================================
-- FEATURE ENHANCEMENTS
-- Employee-Payroll Sync, Fuel Management, and Ticketing Flow
-- ============================================================================

-- ============================================================================
-- 1. EMPLOYEE-PAYROLL SYNCHRONIZATION
-- ============================================================================

-- Add missing fields to payroll table for better employee sync
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bonuses NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime_pay NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create view for employee payroll sync
CREATE OR REPLACE VIEW employee_payroll_sync AS
SELECT 
  e.id as employee_id,
  e.employee_number,
  e.full_name,
  e.email,
  e.phone,
  e.position,
  e.department,
  e.hire_date,
  e.employment_status,
  e.salary as current_salary,
  p.id as latest_payroll_id,
  p.period_start,
  p.period_end,
  p.basic_salary,
  p.allowances,
  p.bonuses,
  p.deductions,
  p.net_salary,
  p.status as payroll_status,
  p.paid_at
FROM employees e
LEFT JOIN LATERAL (
  SELECT * FROM payroll
  WHERE employee_id = e.id
  ORDER BY period_start DESC
  LIMIT 1
) p ON true
WHERE e.employment_status = 'active'
ORDER BY e.full_name;

-- Grant access
GRANT SELECT ON employee_payroll_sync TO authenticated;

-- Function to sync employee data to payroll
CREATE OR REPLACE FUNCTION sync_employee_to_payroll()
RETURNS TRIGGER AS $$
BEGIN
  -- When employee data changes, update any draft payroll records
  UPDATE payroll
  SET 
    basic_salary = NEW.salary,
    updated_at = NOW()
  WHERE employee_id = NEW.id
    AND status = 'draft';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync employee changes to payroll
DROP TRIGGER IF EXISTS trigger_sync_employee_to_payroll ON employees;
CREATE TRIGGER trigger_sync_employee_to_payroll
  AFTER UPDATE OF salary, employment_status ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_to_payroll();

-- ============================================================================
-- 2. FUEL STATION MANAGEMENT
-- ============================================================================

-- Create fuel stations table
CREATE TABLE IF NOT EXISTS fuel_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_stations_company ON fuel_stations(company_id);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_active ON fuel_stations(is_active);

-- Add fuel_station_id to fuel_logs
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS fuel_station_id UUID REFERENCES fuel_stations(id);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for fuel station lookups
CREATE INDEX IF NOT EXISTS idx_fuel_logs_station ON fuel_logs(fuel_station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_status ON fuel_logs(status);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver ON fuel_logs(driver_id);

-- View for driver fuel logs with station details
CREATE OR REPLACE VIEW driver_fuel_logs AS
SELECT 
  fl.id,
  fl.driver_id,
  d.full_name as driver_name,
  fl.bus_id,
  b.bus_number,
  b.number_plate,
  fl.fuel_station_id,
  fs.name as fuel_station_name,
  fs.location as station_location,
  fl.liters,
  fl.cost_per_liter,
  fl.total_cost,
  fl.odometer_reading,
  fl.receipt_number,
  fl.receipt_image_url,
  fl.filled_at,
  fl.status,
  fl.rejection_reason,
  fl.approved_by,
  fl.approved_at,
  fl.created_at
FROM fuel_logs fl
LEFT JOIN drivers d ON fl.driver_id = d.id
LEFT JOIN buses b ON fl.bus_id = b.id
LEFT JOIN fuel_stations fs ON fl.fuel_station_id = fs.id
ORDER BY fl.filled_at DESC;

GRANT SELECT ON driver_fuel_logs TO authenticated;

-- ============================================================================
-- 3. TICKETING FLOW ENHANCEMENTS
-- ============================================================================

-- Add booking flow tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flow_step TEXT DEFAULT 'search' 
  CHECK (flow_step IN ('search', 'seat_selection', 'passenger_details', 'payment', 'confirmation', 'completed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flow_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flow_completed_at TIMESTAMPTZ;

-- Create booking flow history table
CREATE TABLE IF NOT EXISTS booking_flow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_flow_history_booking ON booking_flow_history(booking_id);

-- Function to track booking flow progress
CREATE OR REPLACE FUNCTION track_booking_flow()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert flow history record
  INSERT INTO booking_flow_history (booking_id, step, started_at)
  VALUES (NEW.id, NEW.flow_step, NOW());
  
  -- Update completion time for previous step
  UPDATE booking_flow_history
  SET completed_at = NOW()
  WHERE booking_id = NEW.id
    AND step != NEW.flow_step
    AND completed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_booking_flow ON bookings;
CREATE TRIGGER trigger_track_booking_flow
  AFTER UPDATE OF flow_step ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_flow();

-- ============================================================================
-- 4. DELAY MANAGEMENT ENHANCEMENTS
-- ============================================================================

-- Create trip delays table
CREATE TABLE IF NOT EXISTS trip_delays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  delay_reason TEXT NOT NULL,
  delay_minutes INTEGER NOT NULL,
  original_departure TIMESTAMPTZ NOT NULL,
  new_departure TIMESTAMPTZ NOT NULL,
  affected_passengers INTEGER DEFAULT 0,
  notification_sent BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_delays_trip ON trip_delays(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_delays_resolved ON trip_delays(resolved);

-- View for delay management overview
CREATE OR REPLACE VIEW delay_management_overview AS
SELECT 
  td.id,
  td.trip_id,
  t.trip_number,
  r.origin,
  r.destination,
  t.departure_time as scheduled_departure,
  td.original_departure,
  td.new_departure,
  td.delay_minutes,
  td.delay_reason,
  td.affected_passengers,
  td.notification_sent,
  td.resolved,
  td.resolved_at,
  b.bus_number,
  d.full_name as driver_name,
  td.created_at
FROM trip_delays td
JOIN trips t ON td.trip_id = t.id
JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
ORDER BY td.created_at DESC;

GRANT SELECT ON delay_management_overview TO authenticated;

-- Function to calculate affected passengers
CREATE OR REPLACE FUNCTION calculate_affected_passengers()
RETURNS TRIGGER AS $$
BEGIN
  -- Count confirmed bookings for this trip
  NEW.affected_passengers := (
    SELECT COUNT(*)
    FROM bookings
    WHERE trip_id = NEW.trip_id
      AND booking_status IN ('confirmed', 'checked_in')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_affected_passengers ON trip_delays;
CREATE TRIGGER trigger_calculate_affected_passengers
  BEFORE INSERT OR UPDATE ON trip_delays
  FOR EACH ROW
  EXECUTE FUNCTION calculate_affected_passengers();

-- ============================================================================
-- 5. STORAGE BUCKET FOR RECEIPTS (Run in Supabase Dashboard)
-- ============================================================================

-- Note: Create storage bucket manually in Supabase Dashboard:
-- Bucket name: fuel-receipts
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf

-- Storage policy for fuel receipts (run after creating bucket)
-- CREATE POLICY "Drivers can upload their own receipts"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'fuel-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Drivers can view their own receipts"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'fuel-receipts' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Admins can view all receipts"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'fuel-receipts' AND
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid()
--       AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
--   )
-- );

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Fuel Stations RLS
ALTER TABLE fuel_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fuel stations" ON fuel_stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
    )
  );

CREATE POLICY "Drivers can view active fuel stations" ON fuel_stations
  FOR SELECT USING (is_active = true);

-- Fuel Logs RLS (updated)
DROP POLICY IF EXISTS "Drivers can manage their fuel logs" ON fuel_logs;
CREATE POLICY "Drivers can create their fuel logs" ON fuel_logs
  FOR INSERT WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view their fuel logs" ON fuel_logs
  FOR SELECT USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all fuel logs" ON fuel_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER')
    )
  );

-- Trip Delays RLS
ALTER TABLE trip_delays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operations can manage delays" ON trip_delays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
    )
  );

CREATE POLICY "Drivers can view their trip delays" ON trip_delays
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips
      WHERE driver_id IN (
        SELECT id FROM drivers WHERE user_id = auth.uid()
      )
    )
  );

-- Booking Flow History RLS
ALTER TABLE booking_flow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their booking flow" ON booking_flow_history
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE passenger_email = auth.email()
    )
  );

CREATE POLICY "Admins can view all booking flows" ON booking_flow_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'TICKETING_AGENT')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON fuel_stations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fuel_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON trip_delays TO authenticated;
GRANT SELECT ON booking_flow_history TO authenticated;
GRANT SELECT ON employee_payroll_sync TO authenticated;
GRANT SELECT ON driver_fuel_logs TO authenticated;
GRANT SELECT ON delay_management_overview TO authenticated;
