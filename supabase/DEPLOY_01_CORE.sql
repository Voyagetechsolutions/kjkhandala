-- =====================================================
-- CORE TABLES - Foundation for All Dashboards
-- Run this FIRST before any other schema files
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER MANAGEMENT (Used by: ADMIN, SUPER_ADMIN)
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  employee_id text UNIQUE, -- For staff members
  department text, -- HR, Operations, Finance, etc.
  position text, -- Job title
  hire_date date,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- User roles table (supports multiple roles per user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'SUPER_ADMIN',
    'ADMIN',
    'OPERATIONS_MANAGER',
    'FINANCE_MANAGER',
    'HR_MANAGER',
    'MAINTENANCE_MANAGER',
    'TICKETING_AGENT',
    'TICKETING_SUPERVISOR',
    'DRIVER',
    'PASSENGER'
  )),
  role_level int DEFAULT 0,
  is_active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_active ON public.user_roles(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- 2. ROUTES (Used by: OPERATIONS_MANAGER, TICKETING_AGENT, PASSENGER)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code text UNIQUE NOT NULL, -- e.g., GBE-FRN-001
  name text NOT NULL, -- e.g., "Gaborone - Francistown Express"
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric(10,2),
  estimated_duration_minutes int,
  base_fare numeric(10,2) NOT NULL,
  stops jsonb, -- Array of intermediate stops with times
  is_active boolean DEFAULT true,
  is_international boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_routes_active ON public.routes(is_active);
CREATE INDEX idx_routes_origin_dest ON public.routes(origin, destination);
CREATE INDEX idx_routes_code ON public.routes(route_code);

-- =====================================================
-- 3. BUSES (Used by: OPERATIONS_MANAGER, MAINTENANCE_MANAGER)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE bus_status AS ENUM ('ACTIVE','MAINTENANCE','OUT_OF_SERVICE','RETIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  fleet_number text UNIQUE, -- Internal fleet ID
  model text NOT NULL,
  manufacturer text,
  year int,
  capacity int NOT NULL CHECK (capacity > 0),
  seat_layout jsonb, -- Seat configuration
  status bus_status DEFAULT 'ACTIVE',
  current_mileage int DEFAULT 0,
  last_maintenance_date date,
  next_maintenance_date date,
  next_maintenance_km int,
  insurance_expiry date,
  road_tax_expiry date,
  fitness_certificate_expiry date,
  gps_device_id text,
  features jsonb, -- AC, WiFi, USB, etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_buses_status ON public.buses(status);
CREATE INDEX idx_buses_registration ON public.buses(registration_number);
CREATE INDEX idx_buses_fleet_number ON public.buses(fleet_number);
CREATE INDEX idx_buses_next_maintenance ON public.buses(next_maintenance_date) WHERE status = 'ACTIVE';

-- =====================================================
-- 4. DRIVERS (Used by: OPERATIONS_MANAGER, HR_MANAGER, DRIVER)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('ACTIVE','ON_LEAVE','SUSPENDED','INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id text UNIQUE, -- Links to profiles.employee_id (not a FK)
  first_name text NOT NULL,
  last_name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_type text, -- Class B, C, etc.
  license_expiry date NOT NULL,
  phone text NOT NULL,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  address text,
  status driver_status DEFAULT 'ACTIVE',
  rating numeric(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  total_trips int DEFAULT 0,
  total_distance_km numeric(10,2) DEFAULT 0,
  hire_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_license ON public.drivers(license_number);
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_drivers_employee_id ON public.drivers(employee_id);

-- =====================================================
-- 5. TRIPS/SCHEDULES (Used by: OPERATIONS_MANAGER, TICKETING_AGENT, DRIVER, PASSENGER)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('SCHEDULED','BOARDING','DEPARTED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number text UNIQUE NOT NULL, -- Auto-generated: TRP20251111-001
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  scheduled_departure timestamptz NOT NULL,
  scheduled_arrival timestamptz NOT NULL,
  actual_departure timestamptz,
  actual_arrival timestamptz,
  fare numeric(10,2) NOT NULL,
  total_seats int NOT NULL,
  available_seats int NOT NULL,
  status trip_status DEFAULT 'SCHEDULED',
  boarding_point text,
  drop_off_point text,
  delay_reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (available_seats >= 0),
  CHECK (available_seats <= total_seats)
);

CREATE INDEX idx_trips_departure ON public.trips(scheduled_departure);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_route ON public.trips(route_id);
CREATE INDEX idx_trips_bus ON public.trips(bus_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);
CREATE INDEX idx_trips_number ON public.trips(trip_number);
CREATE INDEX idx_trips_date_status ON public.trips(scheduled_departure, status);

-- =====================================================
-- 6. BOOKINGS/TICKETS (Used by: TICKETING_AGENT, FINANCE_MANAGER, PASSENGER)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM('PENDING','CONFIRMED','CANCELLED','CHECKED_IN','COMPLETED','REFUNDED','NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM('PENDING','COMPLETED','FAILED','REFUNDED','PARTIALLY_REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM('CASH','CARD','MOBILE_MONEY','BANK_TRANSFER','ONLINE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL, -- BK20251111-1234
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  passenger_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  seat_number text NOT NULL,
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  passenger_email text,
  passenger_id_number text, -- National ID or Passport
  fare numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  payment_status payment_status DEFAULT 'PENDING',
  payment_method payment_method,
  payment_reference text,
  booking_date timestamptz DEFAULT now(),
  check_in_time timestamptz,
  booked_by uuid REFERENCES auth.users(id), -- Ticketing agent
  is_online_booking boolean DEFAULT false,
  special_requests text,
  luggage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, seat_number)
);

CREATE INDEX idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX idx_bookings_passenger ON public.bookings(passenger_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_booked_by ON public.bookings(booked_by);

-- =====================================================
-- 7. PAYMENTS (Used by: FINANCE_MANAGER, TICKETING_AGENT)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference text UNIQUE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'PENDING',
  transaction_id text, -- External payment gateway ID
  payment_date timestamptz DEFAULT now(),
  processed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_reference ON public.payments(payment_reference);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_payments_method ON public.payments(payment_method);

-- =====================================================
-- 8. NOTIFICATIONS (Used by: ALL USERS)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM('INFO','SUCCESS','WARNING','ERROR','BOOKING','TRIP','SYSTEM','MAINTENANCE','HR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type DEFAULT 'INFO',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- =====================================================
-- 9. AUDIT LOGS (Used by: SUPER_ADMIN, ADMIN)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Core tables created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_02_operations_tables.sql';
END $$;
