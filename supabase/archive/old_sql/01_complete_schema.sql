-- =====================================================
-- COMPLETE DATABASE SCHEMA
-- Production-ready with proper constraints and indexes
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
    'DRIVER',
    'PASSENGER'
  )),
  role_level int DEFAULT 0,
  is_active boolean DEFAULT true,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- 2. OPERATIONS DOMAIN
-- =====================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('SCHEDULED','BOARDING','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE bus_status AS ENUM ('ACTIVE','MAINTENANCE','OUT_OF_SERVICE','RETIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('ACTIVE','ON_LEAVE','SUSPENDED','INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Routes
CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance numeric(10,2),
  estimated_duration int, -- minutes
  base_fare numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_active ON public.routes(is_active);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON public.routes(origin, destination);

-- Buses
CREATE TABLE IF NOT EXISTS public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  model text NOT NULL,
  manufacturer text,
  year int,
  capacity int NOT NULL CHECK (capacity > 0),
  status bus_status DEFAULT 'ACTIVE',
  last_maintenance_date date,
  next_maintenance_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buses_status ON public.buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_registration ON public.buses(registration_number);

-- Drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_expiry date NOT NULL,
  phone text NOT NULL,
  email text,
  status driver_status DEFAULT 'ACTIVE',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON public.drivers(license_number);

-- Trips/Schedules
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz,
  actual_departure_time timestamptz,
  actual_arrival_time timestamptz,
  fare numeric(10,2) NOT NULL,
  available_seats int NOT NULL,
  status trip_status DEFAULT 'SCHEDULED',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (available_seats >= 0)
);

CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_route ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus ON public.trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);

-- =====================================================
-- 3. TICKETING/BOOKING DOMAIN
-- =====================================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM('PENDING','CONFIRMED','CANCELLED','CHECKED_IN','COMPLETED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM('PENDING','COMPLETED','FAILED','REFUNDED','PARTIALLY_REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM('CASH','CARD','MOBILE_MONEY','BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Bookings/Tickets
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seat_number text NOT NULL,
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  passenger_email text,
  fare numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  payment_status payment_status DEFAULT 'PENDING',
  payment_method payment_method,
  booking_date timestamptz DEFAULT now(),
  booked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);

-- =====================================================
-- 4. NOTIFICATIONS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM('INFO','SUCCESS','WARNING','ERROR','BOOKING','TRIP','SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type DEFAULT 'INFO',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- 5. AUDIT LOG
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Complete schema created successfully!';
  RAISE NOTICE '📝 Next: Run 02_rls_policies.sql';
END $$;
