-- ============================================================================
-- PRODUCTION SCHEMA PART 2: OPERATIONS TABLES
-- Fleet, Routes, Trips, GPS Tracking
-- ============================================================================

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number_plate TEXT NOT NULL UNIQUE,
  model TEXT,
  year SMALLINT,
  seating_capacity INTEGER NOT NULL,
  bus_type bus_type DEFAULT 'standard',
  fuel_type fuel_type DEFAULT 'diesel',
  status fleet_status DEFAULT 'active',
  gps_device_id UUID,
  total_mileage BIGINT DEFAULT 0,
  last_service_date DATE,
  next_service_date DATE,
  insurance_expiry DATE,
  license_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_company_status ON buses(company_id, status);
CREATE INDEX IF NOT EXISTS idx_buses_number_plate ON buses(number_plate);

-- GPS Devices
CREATE TABLE IF NOT EXISTS gps_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_identifier TEXT UNIQUE,
  provider TEXT,
  installed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ
);

-- GPS Tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  trip_id UUID,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  speed NUMERIC(5, 2),
  heading NUMERIC(5, 2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_tracking_bus_time ON gps_tracking(bus_id, timestamp DESC);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC(7, 2),
  duration_hours NUMERIC(5, 2),
  base_fare NUMERIC(10, 2) NOT NULL,
  route_type route_type DEFAULT 'intercity',
  status route_status DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_company ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT NOT NULL,
  license_number TEXT,
  license_expiry DATE NOT NULL,
  status user_status DEFAULT 'active',
  rating NUMERIC(3, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  trip_number TEXT UNIQUE,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  status trip_status DEFAULT 'scheduled',
  total_seats INTEGER,
  available_seats INTEGER,
  base_fare NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_company_time ON trips(company_id, departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(company_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  incident_type TEXT,
  severity incident_severity DEFAULT 'medium',
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Delays
CREATE TABLE IF NOT EXISTS delays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  delay_minutes INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
