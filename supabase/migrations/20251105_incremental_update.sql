-- =====================================================
-- INCREMENTAL UPDATE - Add Missing Columns & Features
-- This migration ADDS to existing tables without breaking them
-- Date: November 5, 2025
-- =====================================================

-- =====================================================
-- 1. UPDATE BUSES TABLE
-- =====================================================

-- Add missing columns to buses table
ALTER TABLE public.buses 
  ADD COLUMN IF NOT EXISTS bus_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
  ADD COLUMN IF NOT EXISTS year_of_manufacture INTEGER,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS gps_device_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_service_date DATE,
  ADD COLUMN IF NOT EXISTS next_service_date DATE,
  ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) DEFAULT 'diesel',
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- Add constraints to buses (check if they don't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'buses_status_check'
  ) THEN
    ALTER TABLE public.buses 
      ADD CONSTRAINT buses_status_check 
      CHECK (status IN ('active', 'maintenance', 'retired', 'out-of-service'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'buses_fuel_type_check'
  ) THEN
    ALTER TABLE public.buses 
      ADD CONSTRAINT buses_fuel_type_check 
      CHECK (fuel_type IN ('diesel', 'petrol', 'electric', 'hybrid'));
  END IF;
END $$;

-- Update existing buses to have bus_number from name if not set
UPDATE public.buses 
SET bus_number = name 
WHERE bus_number IS NULL;

-- Update existing buses to have registration_number from number_plate if not set
UPDATE public.buses 
SET registration_number = number_plate 
WHERE registration_number IS NULL;

-- =====================================================
-- 2. UPDATE ROUTES TABLE
-- =====================================================

-- Add missing columns to routes table
ALTER TABLE public.routes 
  ADD COLUMN IF NOT EXISTS route_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stops JSONB;

-- Add constraint to routes (check if it doesn't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'routes_status_check'
  ) THEN
    ALTER TABLE public.routes 
      ADD CONSTRAINT routes_status_check 
      CHECK (status IN ('active', 'inactive', 'suspended'));
  END IF;
END $$;

-- Update existing routes to have route_name
UPDATE public.routes 
SET route_name = origin || ' - ' || destination 
WHERE route_name IS NULL;

-- Update estimated_duration_minutes from duration_hours
UPDATE public.routes 
SET estimated_duration_minutes = CAST(duration_hours * 60 AS INTEGER)
WHERE estimated_duration_minutes IS NULL AND duration_hours IS NOT NULL;

-- =====================================================
-- 3. UPDATE SCHEDULES TABLE
-- =====================================================

-- Add missing columns to schedules table
ALTER TABLE public.schedules 
  ADD COLUMN IF NOT EXISTS arrival_time TIME,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS actual_departure_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS actual_arrival_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add constraint to schedules (check if it doesn't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'schedules_status_check'
  ) THEN
    ALTER TABLE public.schedules 
      ADD CONSTRAINT schedules_status_check 
      CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'delayed'));
  END IF;
END $$;

-- =====================================================
-- 4. UPDATE BOOKINGS TABLE
-- =====================================================

-- Add missing columns to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS number_of_seats INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Add constraints to bookings (check if it doesn't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT bookings_payment_status_check 
      CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled'));
  END IF;
END $$;

-- Update existing bookings
UPDATE public.bookings 
SET booking_date = created_at 
WHERE booking_date IS NULL;

-- =====================================================
-- 5. UPDATE BOOKING_OFFICES TABLE
-- =====================================================

-- Add missing columns to booking_offices table
ALTER TABLE public.booking_offices 
  ADD COLUMN IF NOT EXISTS office_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manager_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Update existing booking_offices
UPDATE public.booking_offices 
SET office_name = name 
WHERE office_name IS NULL;

UPDATE public.booking_offices 
SET phone = contact_number 
WHERE phone IS NULL;

UPDATE public.booking_offices 
SET status = CASE WHEN active THEN 'active' ELSE 'inactive' END 
WHERE status IS NULL;

-- Add constraint to booking_offices (check if it doesn't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'booking_offices_status_check'
  ) THEN
    ALTER TABLE public.booking_offices 
      ADD CONSTRAINT booking_offices_status_check 
      CHECK (status IN ('active', 'inactive', 'closed'));
  END IF;
END $$;

-- =====================================================
-- 6. UPDATE PROFILES TABLE
-- =====================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 7. UPDATE USER_ROLES TABLE
-- =====================================================

-- Add missing columns to user_roles table
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS permissions JSONB,
  ADD COLUMN IF NOT EXISTS assigned_by UUID,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint to user_roles (check if it doesn't exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_unique'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_user_id_role_unique 
      UNIQUE (user_id, role);
  END IF;
END $$;

-- =====================================================
-- 8. ADD MISSING INDEXES
-- =====================================================

-- Buses indexes
CREATE INDEX IF NOT EXISTS idx_buses_status ON public.buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_next_service ON public.buses(next_service_date);
CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON public.buses(bus_number);

-- Routes indexes
CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON public.routes(origin, destination);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(departure_date);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON public.schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_bus ON public.schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON public.bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_checked_in ON public.bookings(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_bus ON public.maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_records(service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_records(status);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_department ON public.staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON public.staff(employee_id);

-- Revenue indexes
CREATE INDEX IF NOT EXISTS idx_revenue_date ON public.revenue_summary(date);
CREATE INDEX IF NOT EXISTS idx_revenue_route ON public.revenue_summary(route_id);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(expense_type);

-- GPS Tracking indexes
CREATE INDEX IF NOT EXISTS idx_gps_tracking_bus_timestamp ON public.gps_tracking(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_schedule ON public.gps_tracking(schedule_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Driver assignments indexes
CREATE INDEX IF NOT EXISTS idx_driver_assignments_schedule ON public.driver_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON public.driver_assignments(driver_id);

-- =====================================================
-- 9. UPDATE TRIGGERS FOR NEW COLUMNS
-- =====================================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that don't have them
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_buses_updated_at'
  ) THEN
    CREATE TRIGGER update_buses_updated_at 
    BEFORE UPDATE ON public.buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_routes_updated_at'
  ) THEN
    CREATE TRIGGER update_routes_updated_at 
    BEFORE UPDATE ON public.routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_schedules_updated_at'
  ) THEN
    CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_drivers_updated_at'
  ) THEN
    CREATE TRIGGER update_drivers_updated_at 
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 10. CREATE DASHBOARD VIEWS
-- =====================================================

-- Daily Revenue View
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT 
  DATE(booking_date) as date,
  COUNT(*) as total_bookings,
  SUM(total_amount) as total_revenue,
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_revenue
FROM public.bookings
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
  b.name as bus_name,
  d.full_name as driver_name,
  COUNT(bk.id) as passenger_count,
  s.available_seats
FROM public.schedules s
LEFT JOIN public.routes r ON s.route_id = r.id
LEFT JOIN public.buses b ON s.bus_id = b.id
LEFT JOIN public.driver_assignments da ON s.id = da.schedule_id AND da.status = 'assigned'
LEFT JOIN public.drivers d ON da.driver_id = d.id
LEFT JOIN public.bookings bk ON s.id = bk.schedule_id AND bk.status NOT IN ('cancelled')
WHERE s.status IN ('scheduled', 'active')
  AND s.departure_date >= CURRENT_DATE
GROUP BY s.id, r.origin, r.destination, b.bus_number, b.name, d.full_name;

-- Maintenance Due View
CREATE OR REPLACE VIEW maintenance_due_view AS
SELECT 
  b.id,
  b.bus_number,
  b.name as bus_name,
  b.next_service_date,
  b.mileage,
  b.status,
  CASE 
    WHEN b.next_service_date < CURRENT_DATE THEN 'overdue'
    WHEN b.next_service_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'scheduled'
  END as urgency
FROM public.buses b
WHERE b.next_service_date IS NOT NULL
  AND b.status != 'retired'
ORDER BY b.next_service_date;

-- =====================================================
-- 11. UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on tables if not already enabled
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist and create new ones
DROP POLICY IF EXISTS "Admins have full access to buses" ON public.buses;
DROP POLICY IF EXISTS "Admins have full access to routes" ON public.routes;
DROP POLICY IF EXISTS "Admins have full access to schedules" ON public.schedules;
DROP POLICY IF EXISTS "Public can view active routes" ON public.routes;
DROP POLICY IF EXISTS "Public can view scheduled trips" ON public.schedules;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Admin full access policies (using user_roles table)
CREATE POLICY "Admins have full access to buses" ON public.buses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins have full access to routes" ON public.routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins have full access to schedules" ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('super_admin', 'admin', 'manager')
    )
  );

-- Public read access for active routes and schedules
CREATE POLICY "Public can view active routes" ON public.routes
  FOR SELECT USING (status = 'active' OR active = true);

CREATE POLICY "Public can view scheduled trips" ON public.schedules
  FOR SELECT USING (status IN ('scheduled', 'active'));

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 12. ADD SAMPLE DATA (Optional)
-- =====================================================

-- Update existing routes with sample data if needed
UPDATE public.routes 
SET distance_km = 437, estimated_duration_minutes = 360 
WHERE origin = 'Gaborone' AND destination = 'Francistown' AND distance_km IS NULL;

UPDATE public.routes 
SET distance_km = 940, estimated_duration_minutes = 720 
WHERE origin = 'Gaborone' AND destination = 'Maun' AND distance_km IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment
COMMENT ON SCHEMA public IS 'KJ Khandala Bus Company - Incremental Update Applied on 2025-11-05';

-- Verify migration
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
