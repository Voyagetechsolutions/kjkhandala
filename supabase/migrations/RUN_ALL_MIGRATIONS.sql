-- =====================================================
-- MASTER MIGRATION SCRIPT
-- Run this single file to set up everything in correct order
-- =====================================================

-- =====================================================
-- STEP 1: CREATE STAFF TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  bank_account TEXT,
  tax_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);

-- Add sample staff
INSERT INTO staff (employee_id, full_name, department, position, hire_date, status, phone, email)
VALUES 
  ('EMP001', 'John Conductor', 'Operations', 'conductor', CURRENT_DATE - INTERVAL '1 year', 'active', '+267 71234567', 'john.conductor@kjkhandala.com'),
  ('EMP002', 'Mary Conductor', 'Operations', 'conductor', CURRENT_DATE - INTERVAL '6 months', 'active', '+267 71234568', 'mary.conductor@kjkhandala.com'),
  ('EMP003', 'Peter Cleaner', 'Maintenance', 'cleaner', CURRENT_DATE - INTERVAL '2 years', 'active', '+267 71234569', 'peter.cleaner@kjkhandala.com'),
  ('EMP004', 'Sarah Cleaner', 'Maintenance', 'cleaner', CURRENT_DATE - INTERVAL '1 year', 'active', '+267 71234570', 'sarah.cleaner@kjkhandala.com')
ON CONFLICT (employee_id) DO NOTHING;

-- =====================================================
-- STEP 2: CREATE DRIVER SHIFTS AND AUTOMATION TABLES
-- =====================================================

-- 1. Create driver_shifts table
CREATE TABLE IF NOT EXISTS driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  conductor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  shift_start TIMESTAMP NOT NULL,
  shift_end TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'SCHEDULED',
  auto_generated BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create conductor_assignments table
CREATE TABLE IF NOT EXISTS conductor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  conductor_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create cleaning_requests table
CREATE TABLE IF NOT EXISTS cleaning_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  request_type TEXT DEFAULT 'post_trip',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 4. Create rating_requests table
CREATE TABLE IF NOT EXISTS rating_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create trip_ratings table
CREATE TABLE IF NOT EXISTS trip_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID,
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  bus_rating INTEGER CHECK (bus_rating BETWEEN 1 AND 5),
  route_rating INTEGER CHECK (route_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create speed_violations table
CREATE TABLE IF NOT EXISTS speed_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  speed DECIMAL(5,2),
  speed_limit DECIMAL(5,2),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 7. Create route_deviations table
CREATE TABLE IF NOT EXISTS route_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  deviation_distance DECIMAL(10,2),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 8. Create trip_reports table
CREATE TABLE IF NOT EXISTS trip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  report_data JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create shift_generation_queue table
CREATE TABLE IF NOT EXISTS shift_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  departure_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- 10. Create driver_earnings table
CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE ALL INDEXES
-- =====================================================

-- driver_shifts indexes
CREATE INDEX IF NOT EXISTS idx_driver_shifts_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver ON driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_bus ON driver_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_schedule ON driver_shifts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_time_range ON driver_shifts(shift_start, shift_end);

-- conductor_assignments indexes
CREATE INDEX IF NOT EXISTS idx_conductor_assignments_conductor ON conductor_assignments(conductor_id);
CREATE INDEX IF NOT EXISTS idx_conductor_assignments_schedule ON conductor_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_conductor_assignments_date ON conductor_assignments(assignment_date);

-- cleaning_requests indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_bus ON cleaning_requests(bus_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_status ON cleaning_requests(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_assigned ON cleaning_requests(assigned_to);

-- rating_requests indexes
CREATE INDEX IF NOT EXISTS idx_rating_requests_schedule ON rating_requests(schedule_id);
CREATE INDEX IF NOT EXISTS idx_rating_requests_user ON rating_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_requests_status ON rating_requests(status);

-- trip_ratings indexes
CREATE INDEX IF NOT EXISTS idx_trip_ratings_schedule ON trip_ratings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_trip_ratings_user ON trip_ratings(user_id);

-- speed_violations indexes
CREATE INDEX IF NOT EXISTS idx_speed_violations_schedule ON speed_violations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_speed_violations_driver ON speed_violations(driver_id);
CREATE INDEX IF NOT EXISTS idx_speed_violations_timestamp ON speed_violations(timestamp);

-- route_deviations indexes
CREATE INDEX IF NOT EXISTS idx_route_deviations_schedule ON route_deviations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_route_deviations_timestamp ON route_deviations(timestamp);

-- trip_reports indexes
CREATE INDEX IF NOT EXISTS idx_trip_reports_schedule ON trip_reports(schedule_id);
CREATE INDEX IF NOT EXISTS idx_trip_reports_driver ON trip_reports(driver_id);

-- shift_generation_queue indexes
CREATE INDEX IF NOT EXISTS idx_shift_queue_status ON shift_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_shift_queue_date ON shift_generation_queue(departure_date);

-- driver_earnings indexes
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_schedule ON driver_earnings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON driver_earnings(status);

-- Add bus_id to schedules if missing (for direct bus relationship)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS bus_id UUID REFERENCES buses(id) ON DELETE SET NULL;

-- Related tables indexes
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(departure_date);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_bus ON schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_fuel ON buses(fuel_level);

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON TABLE staff TO authenticated;
GRANT ALL ON TABLE driver_shifts TO authenticated;
GRANT ALL ON TABLE conductor_assignments TO authenticated;
GRANT ALL ON TABLE cleaning_requests TO authenticated;
GRANT ALL ON TABLE rating_requests TO authenticated;
GRANT ALL ON TABLE trip_ratings TO authenticated;
GRANT ALL ON TABLE speed_violations TO authenticated;
GRANT ALL ON TABLE route_deviations TO authenticated;
GRANT ALL ON TABLE trip_reports TO authenticated;
GRANT ALL ON TABLE shift_generation_queue TO authenticated;
GRANT ALL ON TABLE driver_earnings TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ALL TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '✅ Staff table with 4 sample employees';
  RAISE NOTICE '✅ Driver shifts automation tables';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run shift_automation_helpers.sql';
  RAISE NOTICE '2. Run auto_generate_shifts.sql';
  RAISE NOTICE '3. Test with: SELECT auto_generate_shifts(CURRENT_DATE, ARRAY(SELECT id FROM routes LIMIT 3));';
END $$;
