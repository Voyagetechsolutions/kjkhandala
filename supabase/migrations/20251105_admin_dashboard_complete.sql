-- =====================================================
-- KJ KHANDALA BUS COMPANY - ADMIN DASHBOARD SCHEMA
-- Complete Database Migration for Admin Dashboard
-- Date: November 5, 2025
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Buses Table (Enhanced)
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  year_of_manufacture INTEGER,
  seating_capacity INTEGER NOT NULL DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'out-of-service')),
  gps_device_id VARCHAR(100),
  last_service_date DATE,
  next_service_date DATE,
  mileage INTEGER DEFAULT 0,
  fuel_type VARCHAR(20) DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'petrol', 'electric', 'hybrid')),
  insurance_expiry DATE,
  license_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name VARCHAR(200) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  stops JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules Table (Enhanced)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  available_seats INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'delayed')),
  actual_departure_time TIMESTAMP WITH TIME ZONE,
  actual_arrival_time TIMESTAMP WITH TIME ZONE,
  delay_minutes INTEGER DEFAULT 0,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(200) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  date_of_birth DATE,
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on-leave')),
  experience_years INTEGER,
  emergency_contact VARCHAR(200),
  emergency_phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Assignments Table
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, driver_id)
);

-- Staff Table (Enhanced)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(200) NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave', 'terminated')),
  date_of_birth DATE,
  address TEXT,
  emergency_contact VARCHAR(200),
  emergency_phone VARCHAR(20),
  bank_account VARCHAR(50),
  tax_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. BOOKING & PASSENGER TABLES
-- =====================================================

-- Bookings Table (Enhanced with check-in)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  passenger_name VARCHAR(200) NOT NULL,
  passenger_phone VARCHAR(20) NOT NULL,
  passenger_email VARCHAR(100),
  passenger_id_number VARCHAR(50),
  seat_number VARCHAR(10),
  number_of_seats INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked-in', 'no-show', 'completed')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Offices Table
CREATE TABLE IF NOT EXISTS booking_offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_name VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  manager_name VARCHAR(200),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  opening_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. MAINTENANCE TABLES
-- =====================================================

-- Maintenance Records Table (Enhanced)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL CHECK (service_type IN (
    'routine_service',
    'oil_change',
    'tire_replacement',
    'brake_service',
    'engine_repair',
    'transmission_repair',
    'electrical_repair',
    'body_work',
    'inspection',
    'emergency_repair',
    'other'
  )),
  description TEXT NOT NULL,
  service_date DATE NOT NULL,
  cost DECIMAL(10,2),
  mileage_at_service INTEGER,
  service_provider VARCHAR(200),
  parts_replaced TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  technician_name VARCHAR(200),
  completion_date DATE,
  next_service_date DATE,
  invoice_number VARCHAR(100),
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Reminders Table
CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  reminder_type VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notified_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. GPS & TRACKING TABLES
-- =====================================================

-- GPS Tracking Table
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  altitude DECIMAL(8,2),
  accuracy DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
  fuel_level DECIMAL(5,2),
  engine_status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for GPS tracking queries
CREATE INDEX IF NOT EXISTS idx_gps_tracking_bus_timestamp ON gps_tracking(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_schedule ON gps_tracking(schedule_id);

-- =====================================================
-- 5. FINANCIAL TABLES
-- =====================================================

-- Revenue Summary Table
CREATE TABLE IF NOT EXISTS revenue_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  cash_revenue DECIMAL(10,2) DEFAULT 0,
  card_revenue DECIMAL(10,2) DEFAULT 0,
  mobile_money_revenue DECIMAL(10,2) DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, route_id)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_type VARCHAR(100) NOT NULL CHECK (expense_type IN (
    'fuel',
    'maintenance',
    'salaries',
    'insurance',
    'licenses',
    'rent',
    'utilities',
    'marketing',
    'office_supplies',
    'other'
  )),
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  vendor VARCHAR(200),
  invoice_number VARCHAR(100),
  payment_method VARCHAR(50),
  approved_by VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  basic_salary DECIMAL(10,2) NOT NULL,
  allowances DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  overtime DECIMAL(10,2) DEFAULT 0,
  bonuses DECIMAL(10,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) NOT NULL,
  net_pay DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. NOTIFICATIONS & ALERTS
-- =====================================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'maintenance_due',
    'license_expiry',
    'insurance_expiry',
    'booking_confirmed',
    'trip_delayed',
    'trip_cancelled',
    'low_fuel',
    'emergency',
    'system_alert',
    'other'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_user_id UUID,
  target_role VARCHAR(50),
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  action_url VARCHAR(500),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 7. USER MANAGEMENT
-- =====================================================

-- Profiles Table (extends Supabase auth.users)
-- Note: Roles are managed in user_roles table, not here
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  avatar_url TEXT,
  department VARCHAR(100),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table (for fine-grained permissions)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  permissions JSONB,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Buses indexes
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_next_service ON buses(next_service_date);

-- Routes indexes
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(departure_date);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_bus ON schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_checked_in ON bookings(checked_in_at);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_bus ON maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Revenue indexes
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_summary(date);
CREATE INDEX IF NOT EXISTS idx_revenue_route ON revenue_summary(route_id);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);

-- =====================================================
-- 9. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin full access policies (using user_roles table)
CREATE POLICY "Admins have full access to buses" ON buses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins have full access to routes" ON routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins have full access to schedules" ON schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Public read access for active routes and schedules
CREATE POLICY "Public can view active routes" ON routes
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view scheduled trips" ON schedules
  FOR SELECT USING (status IN ('scheduled', 'active'));

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (passenger_email = auth.email());

-- =====================================================
-- 11. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample routes
INSERT INTO routes (route_name, origin, destination, distance_km, estimated_duration_minutes, price, status)
VALUES 
  ('Gaborone - Francistown', 'Gaborone', 'Francistown', 437, 360, 150.00, 'active'),
  ('Gaborone - Maun', 'Gaborone', 'Maun', 940, 720, 280.00, 'active'),
  ('Francistown - Kasane', 'Francistown', 'Kasane', 530, 420, 200.00, 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. VIEWS FOR DASHBOARD ANALYTICS
-- =====================================================

-- Daily Revenue View
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT 
  DATE(booking_date) as date,
  COUNT(*) as total_bookings,
  SUM(total_amount) as total_revenue,
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_revenue
FROM bookings
WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(booking_date)
ORDER BY date DESC;

-- Active Trips View
CREATE OR REPLACE VIEW active_trips_view AS
SELECT 
  s.id,
  s.departure_date,
  s.departure_time,
  s.status,
  r.origin,
  r.destination,
  b.bus_number,
  d.full_name as driver_name,
  COUNT(bk.id) as passenger_count,
  s.available_seats
FROM schedules s
LEFT JOIN routes r ON s.route_id = r.id
LEFT JOIN buses b ON s.bus_id = b.id
LEFT JOIN driver_assignments da ON s.id = da.schedule_id
LEFT JOIN drivers d ON da.driver_id = d.id
LEFT JOIN bookings bk ON s.id = bk.schedule_id AND bk.status != 'cancelled'
WHERE s.status IN ('scheduled', 'active')
  AND s.departure_date >= CURRENT_DATE
GROUP BY s.id, r.origin, r.destination, b.bus_number, d.full_name;

-- Maintenance Due View
CREATE OR REPLACE VIEW maintenance_due_view AS
SELECT 
  b.id,
  b.bus_number,
  b.next_service_date,
  b.mileage,
  b.status,
  CASE 
    WHEN b.next_service_date < CURRENT_DATE THEN 'overdue'
    WHEN b.next_service_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'scheduled'
  END as urgency
FROM buses b
WHERE b.next_service_date IS NOT NULL
  AND b.status != 'retired'
ORDER BY b.next_service_date;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'KJ Khandala Bus Company - Admin Dashboard Schema - Migrated on 2025-11-05';
