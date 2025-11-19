-- ============================================================================
-- PRODUCTION SCHEMA PART 0: ENUM TYPES
-- All enum type definitions for the application
-- Run this FIRST before any other schema files
-- ============================================================================

-- Drop existing types if needed (use with caution in production)
-- DROP TYPE IF EXISTS fleet_status CASCADE;
-- DROP TYPE IF EXISTS bus_type CASCADE;
-- DROP TYPE IF EXISTS fuel_type CASCADE;
-- DROP TYPE IF EXISTS route_type CASCADE;
-- DROP TYPE IF EXISTS route_status CASCADE;
-- DROP TYPE IF EXISTS trip_status CASCADE;
-- DROP TYPE IF EXISTS booking_status CASCADE;
-- DROP TYPE IF EXISTS payment_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS driver_status CASCADE;
-- DROP TYPE IF EXISTS maintenance_type CASCADE;
-- DROP TYPE IF EXISTS maintenance_status CASCADE;
-- DROP TYPE IF EXISTS maintenance_priority CASCADE;
-- DROP TYPE IF EXISTS expense_category CASCADE;
-- DROP TYPE IF EXISTS employment_status CASCADE;
-- DROP TYPE IF EXISTS employment_type CASCADE;
-- DROP TYPE IF EXISTS leave_type CASCADE;
-- DROP TYPE IF EXISTS leave_status CASCADE;
-- DROP TYPE IF EXISTS attendance_status CASCADE;
-- DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================================================
-- FLEET & OPERATIONS ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE fleet_status AS ENUM ('active', 'in_maintenance', 'out_of_service', 'retired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE bus_type AS ENUM ('standard', 'luxury', 'sleeper', 'semi_luxury', 'express');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fuel_type AS ENUM ('diesel', 'petrol', 'electric', 'hybrid', 'cng');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE route_type AS ENUM ('intercity', 'intracity', 'express', 'local');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE route_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('scheduled', 'boarding', 'departed', 'active', 'in_progress', 'completed', 'cancelled', 'delayed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('active', 'on_leave', 'suspended', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- TICKETING & PAYMENTS ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'checked_in', 'boarded', 'completed', 'refunded', 'no_show');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'reserved', 'settled', 'paid', 'completed', 'failed', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mobile_money', 'bank_transfer', 'online');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- MAINTENANCE ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE maintenance_type AS ENUM ('routine', 'preventive', 'corrective', 'emergency', 'inspection', 'repair', 'overhaul');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- FINANCE ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('fuel', 'maintenance', 'salaries', 'insurance', 'licenses', 'utilities', 'rent', 'marketing', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- HR ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'suspended', 'terminated', 'resigned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'intern');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'study');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'on_leave', 'half_day');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- SYSTEM ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'booking', 'trip', 'system', 'maintenance', 'hr');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- GRANT USAGE TO ROLES
-- ============================================================================

-- Grant usage on all enum types to authenticated users
GRANT USAGE ON TYPE fleet_status TO authenticated, anon;
GRANT USAGE ON TYPE bus_type TO authenticated, anon;
GRANT USAGE ON TYPE fuel_type TO authenticated, anon;
GRANT USAGE ON TYPE route_type TO authenticated, anon;
GRANT USAGE ON TYPE route_status TO authenticated, anon;
GRANT USAGE ON TYPE trip_status TO authenticated, anon;
GRANT USAGE ON TYPE driver_status TO authenticated, anon;
GRANT USAGE ON TYPE booking_status TO authenticated, anon;
GRANT USAGE ON TYPE payment_status TO authenticated, anon;
GRANT USAGE ON TYPE payment_method TO authenticated, anon;
GRANT USAGE ON TYPE maintenance_type TO authenticated, anon;
GRANT USAGE ON TYPE maintenance_status TO authenticated, anon;
GRANT USAGE ON TYPE maintenance_priority TO authenticated, anon;
GRANT USAGE ON TYPE expense_category TO authenticated, anon;
GRANT USAGE ON TYPE employment_status TO authenticated, anon;
GRANT USAGE ON TYPE employment_type TO authenticated, anon;
GRANT USAGE ON TYPE leave_type TO authenticated, anon;
GRANT USAGE ON TYPE leave_status TO authenticated, anon;
GRANT USAGE ON TYPE attendance_status TO authenticated, anon;
GRANT USAGE ON TYPE notification_type TO authenticated, anon;
