-- =====================================================
-- OPERATIONS TABLES - For Operations Manager Dashboard
-- Run AFTER COMPLETE_01_core_tables.sql
-- =====================================================

-- =====================================================
-- 1. TRIP TRACKING (GPS & Real-time Location)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trip_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  speed numeric(5,2), -- km/h
  heading numeric(5,2), -- degrees (0-360)
  altitude numeric(8,2), -- meters
  accuracy numeric(6,2), -- meters
  timestamp timestamptz DEFAULT now(),
  driver_id uuid REFERENCES public.drivers(id),
  bus_id uuid REFERENCES public.buses(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_trip_tracking_trip ON public.trip_tracking(trip_id);
CREATE INDEX idx_trip_tracking_timestamp ON public.trip_tracking(timestamp DESC);
CREATE INDEX idx_trip_tracking_location ON public.trip_tracking(latitude, longitude);

-- =====================================================
-- 2. INCIDENTS (Operational Issues & Reports)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE incident_type AS ENUM (
    'ACCIDENT',
    'BREAKDOWN',
    'DELAY',
    'PASSENGER_COMPLAINT',
    'TRAFFIC',
    'WEATHER',
    'MECHANICAL',
    'MEDICAL_EMERGENCY',
    'SECURITY',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('REPORTED','INVESTIGATING','RESOLVED','CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE NOT NULL, -- INC20251111-001
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  type incident_type NOT NULL,
  severity incident_severity DEFAULT 'MEDIUM',
  status incident_status DEFAULT 'REPORTED',
  title text NOT NULL,
  description text NOT NULL,
  location text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  occurred_at timestamptz NOT NULL,
  reported_by uuid REFERENCES auth.users(id),
  reported_at timestamptz DEFAULT now(),
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  photos jsonb, -- Array of photo URLs
  witnesses jsonb, -- Array of witness information
  police_report_number text,
  insurance_claim_number text,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_incidents_trip ON public.incidents(trip_id);
CREATE INDEX idx_incidents_bus ON public.incidents(bus_id);
CREATE INDEX idx_incidents_driver ON public.incidents(driver_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_incidents_occurred ON public.incidents(occurred_at DESC);
CREATE INDEX idx_incidents_number ON public.incidents(incident_number);

-- =====================================================
-- 3. TRIP STOPS (Stop Management & Logging)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE stop_type AS ENUM ('PICKUP','DROP_OFF','REST','FUEL','BORDER','CHECKPOINT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  stop_name text NOT NULL,
  stop_type stop_type NOT NULL,
  scheduled_time timestamptz,
  actual_arrival_time timestamptz,
  actual_departure_time timestamptz,
  duration_minutes int, -- Calculated: departure - arrival
  latitude numeric(10,8),
  longitude numeric(11,8),
  passengers_boarded int DEFAULT 0,
  passengers_alighted int DEFAULT 0,
  notes text,
  logged_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_trip_stops_trip ON public.trip_stops(trip_id);
CREATE INDEX idx_trip_stops_scheduled ON public.trip_stops(scheduled_time);
CREATE INDEX idx_trip_stops_type ON public.trip_stops(stop_type);

-- =====================================================
-- 4. ROUTE STOPS (Route Stop Definitions)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_name text NOT NULL,
  stop_order int NOT NULL, -- 1, 2, 3, etc.
  stop_type stop_type DEFAULT 'PICKUP',
  scheduled_duration_minutes int DEFAULT 10,
  latitude numeric(10,8),
  longitude numeric(11,8),
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, stop_order)
);

CREATE INDEX idx_route_stops_route ON public.route_stops(route_id);
CREATE INDEX idx_route_stops_order ON public.route_stops(route_id, stop_order);

-- =====================================================
-- 5. BUS ASSIGNMENTS (Driver-Bus Assignments)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('SCHEDULED','ACTIVE','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.bus_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  assignment_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status assignment_status DEFAULT 'SCHEDULED',
  starting_mileage int,
  ending_mileage int,
  distance_covered int GENERATED ALWAYS AS (ending_mileage - starting_mileage) STORED,
  fuel_level_start numeric(5,2), -- Percentage
  fuel_level_end numeric(5,2), -- Percentage
  notes text,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bus_assignments_bus ON public.bus_assignments(bus_id);
CREATE INDEX idx_bus_assignments_driver ON public.bus_assignments(driver_id);
CREATE INDEX idx_bus_assignments_trip ON public.bus_assignments(trip_id);
CREATE INDEX idx_bus_assignments_date ON public.bus_assignments(assignment_date);
CREATE INDEX idx_bus_assignments_status ON public.bus_assignments(status);

-- =====================================================
-- 6. ROUTE SCHEDULES (Recurring Trip Templates)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE schedule_frequency AS ENUM ('DAILY','WEEKLY','MONTHLY','CUSTOM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.route_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  frequency schedule_frequency DEFAULT 'DAILY',
  days_of_week int[], -- 0=Sunday, 1=Monday, etc.
  departure_time time NOT NULL,
  arrival_time time NOT NULL,
  fare numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  effective_from date NOT NULL,
  effective_until date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_route_schedules_route ON public.route_schedules(route_id);
CREATE INDEX idx_route_schedules_active ON public.route_schedules(is_active);
CREATE INDEX idx_route_schedules_effective ON public.route_schedules(effective_from, effective_until);

-- =====================================================
-- 7. OPERATIONAL ALERTS (System Alerts & Warnings)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE alert_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_category AS ENUM (
    'MAINTENANCE_DUE',
    'LICENSE_EXPIRY',
    'TRIP_DELAY',
    'BUS_BREAKDOWN',
    'DRIVER_UNAVAILABLE',
    'LOW_OCCUPANCY',
    'OVERBOOKED',
    'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.operational_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category alert_category NOT NULL,
  priority alert_priority DEFAULT 'MEDIUM',
  title text NOT NULL,
  message text NOT NULL,
  reference_type text, -- 'trip', 'bus', 'driver', etc.
  reference_id uuid,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_operational_alerts_unresolved ON public.operational_alerts(is_resolved, priority) WHERE is_resolved = false;
CREATE INDEX idx_operational_alerts_category ON public.operational_alerts(category);
CREATE INDEX idx_operational_alerts_created ON public.operational_alerts(created_at DESC);

-- =====================================================
-- 8. TRIP MANIFEST (Passenger Manifest per Trip)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trip_manifest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_name text NOT NULL,
  seat_number text NOT NULL,
  boarding_point text,
  drop_off_point text,
  is_checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES auth.users(id),
  special_notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, booking_id)
);

CREATE INDEX idx_trip_manifest_trip ON public.trip_manifest(trip_id);
CREATE INDEX idx_trip_manifest_booking ON public.trip_manifest(booking_id);
CREATE INDEX idx_trip_manifest_checked_in ON public.trip_manifest(trip_id, is_checked_in);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Operations tables created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_03_finance_tables.sql';
END $$;
