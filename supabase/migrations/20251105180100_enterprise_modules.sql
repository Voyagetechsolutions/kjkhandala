-- ============================================
-- KJ KHANDALA ENTERPRISE SYSTEM - EXTENDED SCHEMA
-- Fleet, Driver, HR, Maintenance, GPS Tracking
-- ============================================

-- Create enums for enterprise modules
CREATE TYPE public.bus_status AS ENUM ('active', 'maintenance', 'out_of_service', 'retired');
CREATE TYPE public.driver_status AS ENUM ('active', 'on_leave', 'suspended', 'inactive');
CREATE TYPE public.maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.maintenance_type AS ENUM ('routine', 'repair', 'inspection', 'emergency');
CREATE TYPE public.staff_role AS ENUM ('driver', 'mechanic', 'cashier', 'agent', 'manager', 'admin');
CREATE TYPE public.expense_category AS ENUM ('fuel', 'maintenance', 'toll', 'salary', 'insurance', 'other');
CREATE TYPE public.trip_status AS ENUM ('scheduled', 'in_transit', 'completed', 'cancelled', 'delayed');

-- ============================================
-- FLEET MANAGEMENT
-- ============================================

-- Extended buses table with fleet management fields
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS status bus_status DEFAULT 'active';
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS next_service_date DATE;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS total_mileage DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS gps_device_id TEXT;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- Fuel records table
CREATE TABLE IF NOT EXISTS public.fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  quantity_liters DECIMAL(10,2) NOT NULL,
  cost_per_liter DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  odometer_reading DECIMAL(10,2),
  station_name TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVER MANAGEMENT
-- ============================================

-- Drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT UNIQUE NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status driver_status DEFAULT 'active',
  hire_date DATE NOT NULL,
  termination_date DATE,
  photo_url TEXT,
  total_trips INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver documents table
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'license', 'id', 'medical', 'contract', etc.
  document_url TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver assignments (which driver is assigned to which trip)
CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(schedule_id, driver_id)
);

-- Driver performance tracking
CREATE TABLE IF NOT EXISTS public.driver_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  on_time BOOLEAN,
  passenger_rating DECIMAL(3,2),
  fuel_efficiency DECIMAL(10,2),
  incidents INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE MANAGEMENT
-- ============================================

-- Maintenance records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  maintenance_type maintenance_type NOT NULL,
  status maintenance_status DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  description TEXT NOT NULL,
  cost DECIMAL(10,2),
  odometer_reading DECIMAL(10,2),
  mechanic_name TEXT,
  garage_name TEXT,
  parts_replaced TEXT[],
  next_service_date DATE,
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance reminders
CREATE TABLE IF NOT EXISTS public.maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL, -- 'service', 'inspection', 'insurance', 'license'
  due_date DATE NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR & STAFF MANAGEMENT
-- ============================================

-- Staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT UNIQUE NOT NULL,
  role staff_role NOT NULL,
  department TEXT,
  position TEXT,
  salary DECIMAL(10,2),
  hire_date DATE NOT NULL,
  termination_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'on_leave', 'terminated'
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff attendance
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'present', 'absent', 'late', 'half_day', 'leave'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Staff leave requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL, -- 'annual', 'sick', 'emergency', 'unpaid'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll records
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary DECIMAL(10,2) NOT NULL,
  allowances DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_salary DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_method TEXT, -- 'bank_transfer', 'cash', 'cheque'
  payment_reference TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIVE GPS TRACKING
-- ============================================

-- GPS tracking table (real-time location updates)
CREATE TABLE IF NOT EXISTS public.gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2), -- km/h
  heading DECIMAL(5,2), -- degrees
  altitude DECIMAL(8,2), -- meters
  accuracy DECIMAL(6,2), -- meters
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_gps_tracking_bus_time ON public.gps_tracking(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_schedule ON public.gps_tracking(schedule_id);

-- Trip tracking (overall trip status)
CREATE TABLE IF NOT EXISTS public.trip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  status trip_status DEFAULT 'scheduled',
  actual_departure_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  estimated_arrival_time TIMESTAMPTZ,
  delay_minutes INTEGER DEFAULT 0,
  distance_covered DECIMAL(10,2),
  current_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id)
);

-- ============================================
-- FINANCE & ACCOUNTING
-- ============================================

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category expense_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BWP',
  date DATE NOT NULL,
  description TEXT NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  receipt_number TEXT,
  receipt_url TEXT,
  paid_to TEXT,
  payment_method TEXT,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue summary (daily aggregation)
CREATE TABLE IF NOT EXISTS public.revenue_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BWP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKING OFFICES / AGENTS
-- ============================================

-- Booking offices table
CREATE TABLE IF NOT EXISTS public.booking_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'booking', 'payment', 'trip', 'maintenance', 'system'
  is_read BOOLEAN DEFAULT false,
  related_id UUID, -- ID of related booking, trip, etc.
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at triggers
CREATE TRIGGER set_updated_at_drivers
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_maintenance_records
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_staff
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trip_tracking
  BEFORE UPDATE ON public.trip_tracking
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_revenue_summary
  BEFORE UPDATE ON public.revenue_summary
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_booking_offices
  BEFORE UPDATE ON public.booking_offices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin-only tables policies
CREATE POLICY "Admins can manage fuel records" ON public.fuel_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage drivers" ON public.drivers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage driver documents" ON public.driver_documents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage driver assignments" ON public.driver_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view driver performance" ON public.driver_performance FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage maintenance" ON public.maintenance_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage maintenance reminders" ON public.maintenance_reminders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage attendance" ON public.staff_attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage leave requests" ON public.leave_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage payroll" ON public.payroll FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view GPS tracking" ON public.gps_tracking FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage trip tracking" ON public.trip_tracking FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view revenue summary" ON public.revenue_summary FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Booking offices - public read, admin write
CREATE POLICY "Anyone can view booking offices" ON public.booking_offices FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage booking offices" ON public.booking_offices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications - users can view their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drivers can view their own data
CREATE POLICY "Drivers can view own profile" ON public.drivers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Drivers can view own assignments" ON public.driver_assignments FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Drivers can view own performance" ON public.driver_performance FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Staff can view their own data
CREATE POLICY "Staff can view own profile" ON public.staff FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff can view own attendance" ON public.staff_attendance FOR SELECT USING (
  staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can manage own leave requests" ON public.leave_requests FOR ALL USING (
  staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_fuel_records_bus ON public.fuel_records(bus_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON public.driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_schedule ON public.driver_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_bus ON public.maintenance_records(bus_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_bus ON public.maintenance_reminders(bus_id, due_date);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_revenue_summary_date ON public.revenue_summary(date DESC);
