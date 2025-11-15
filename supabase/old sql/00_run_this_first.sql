-- =====================================================
-- STEP 1: CREATE TABLES FIRST
-- Run this BEFORE fix_auth_rls.sql
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  role_level int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- =====================================================
-- OPERATIONS TABLES
-- =====================================================

-- Trip status enum
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  origin text,
  destination text,
  distance numeric,
  duration int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE,
  model text,
  capacity int,
  status text DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  license_number text UNIQUE,
  license_expiry date,
  phone text,
  email text,
  status text DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz,
  fare numeric,
  status trip_status DEFAULT 'SCHEDULED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_departure_time_idx ON trips(departure_time);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);

-- Booking and payment status enums
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM('PENDING','CONFIRMED','CANCELLED','CHECKED_IN','COMPLETED','REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM('PENDING','COMPLETED','FAILED','REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  seat_number text,
  fare numeric,
  status booking_status DEFAULT 'PENDING',
  payment_status payment_status DEFAULT 'PENDING',
  booking_date timestamptz DEFAULT now(),
  total_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_booking_date_idx ON bookings(booking_date);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  message text,
  type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ All tables created successfully!';
  RAISE NOTICE '📝 Next step: Run fix_auth_rls.sql to set up RLS policies';
END $$;
