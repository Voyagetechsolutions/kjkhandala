-- =====================================================
-- ADD FOREIGN KEY RELATIONSHIPS FOR OPERATIONS DASHBOARD
-- =====================================================
-- This script adds foreign keys to enable nested Supabase queries
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. BUSES TABLE - Add driver assignment
-- =====================================================
-- Add driver_id to buses table (optional - for permanent assignment)
ALTER TABLE public.buses
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_buses_driver_id ON public.buses(driver_id);

COMMENT ON COLUMN public.buses.driver_id IS 'Currently assigned driver (optional permanent assignment)';

-- =====================================================
-- 2. TRIPS TABLE - Ensure all foreign keys exist
-- =====================================================
-- These should already exist, but let's ensure they're there

-- Ensure bus_id foreign key exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_bus_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips
        ADD CONSTRAINT trips_bus_id_fkey 
        FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure driver_id foreign key exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_driver_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips
        ADD CONSTRAINT trips_driver_id_fkey 
        FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure route_id foreign key exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_route_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips
        ADD CONSTRAINT trips_route_id_fkey 
        FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON public.trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_departure ON public.trips(scheduled_departure);

-- =====================================================
-- 3. DRIVERS TABLE - Add current assignment tracking
-- =====================================================
-- Add current_bus_id to track active assignment (optional)
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS current_bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL;

-- Add current_trip_id to track active trip
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS current_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_drivers_current_bus_id ON public.drivers(current_bus_id);
CREATE INDEX IF NOT EXISTS idx_drivers_current_trip_id ON public.drivers(current_trip_id);

COMMENT ON COLUMN public.drivers.current_bus_id IS 'Currently assigned bus (for active trips)';
COMMENT ON COLUMN public.drivers.current_trip_id IS 'Currently active trip';

-- =====================================================
-- 4. BOOKINGS TABLE - Ensure trip relationship
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_trip_id_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- =====================================================
-- 5. GPS_TRACKING TABLE - Link to buses
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'gps_tracking_bus_id_fkey' 
        AND table_name = 'gps_tracking'
    ) THEN
        ALTER TABLE public.gps_tracking
        ADD CONSTRAINT gps_tracking_bus_id_fkey 
        FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gps_tracking_bus_id ON public.gps_tracking(bus_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_timestamp ON public.gps_tracking(timestamp);

-- =====================================================
-- 6. MAINTENANCE_RECORDS TABLE - Link to buses
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'maintenance_records_bus_id_fkey' 
        AND table_name = 'maintenance_records'
    ) THEN
        ALTER TABLE public.maintenance_records
        ADD CONSTRAINT maintenance_records_bus_id_fkey 
        FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_records_bus_id ON public.maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_service_date ON public.maintenance_records(service_date);

-- =====================================================
-- 7. FLEET_ALERTS TABLE - Link to buses
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fleet_alerts_bus_id_fkey' 
        AND table_name = 'fleet_alerts'
    ) THEN
        ALTER TABLE public.fleet_alerts
        ADD CONSTRAINT fleet_alerts_bus_id_fkey 
        FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fleet_alerts_bus_id ON public.fleet_alerts(bus_id);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_status ON public.fleet_alerts(status);

-- =====================================================
-- 8. CREATE HELPER VIEWS FOR EASY QUERIES
-- =====================================================

-- View: Active trips with full details
CREATE OR REPLACE VIEW active_trips_full AS
SELECT 
    t.id,
    t.trip_number,
    t.status,
    t.scheduled_departure,
    t.scheduled_arrival,
    t.actual_departure,
    t.actual_arrival,
    t.total_seats,
    t.available_seats,
    t.bus_id,
    b.bus_number,
    b.registration_number,
    b.model as bus_model,
    b.seating_capacity,
    t.driver_id,
    d.full_name as driver_name,
    d.phone as driver_phone,
    d.license_number,
    t.route_id,
    r.origin,
    r.destination,
    r.distance,
    r.estimated_duration,
    (SELECT COUNT(*) FROM bookings WHERE trip_id = t.id AND payment_status = 'paid') as booked_seats,
    CASE 
        WHEN b.seating_capacity > 0 
        THEN ROUND((SELECT COUNT(*) FROM bookings WHERE trip_id = t.id AND payment_status = 'paid')::numeric / b.seating_capacity * 100, 1)
        ELSE 0 
    END as load_factor
FROM trips t
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN routes r ON t.route_id = r.id
WHERE t.status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS');

COMMENT ON VIEW active_trips_full IS 'Complete view of active trips with all related data';

-- View: Buses with current assignment
CREATE OR REPLACE VIEW buses_with_assignments AS
SELECT 
    b.id,
    b.bus_number,
    b.registration_number,
    b.model,
    b.manufacturer,
    b.year_of_manufacture,
    b.seating_capacity,
    b.status,
    b.odometer,
    b.gps_device_id,
    b.driver_id,
    d.full_name as assigned_driver_name,
    d.phone as assigned_driver_phone,
    (
        SELECT json_build_object(
            'id', t.id,
            'trip_number', t.trip_number,
            'status', t.status,
            'scheduled_departure', t.scheduled_departure,
            'route', json_build_object(
                'origin', r.origin,
                'destination', r.destination
            )
        )
        FROM trips t
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE t.bus_id = b.id 
        AND t.status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS')
        ORDER BY t.scheduled_departure DESC
        LIMIT 1
    ) as current_trip,
    (
        SELECT json_build_object(
            'latitude', g.latitude,
            'longitude', g.longitude,
            'speed', g.speed,
            'timestamp', g.timestamp
        )
        FROM gps_tracking g
        WHERE g.bus_id = b.id
        ORDER BY g.timestamp DESC
        LIMIT 1
    ) as latest_gps
FROM buses b
LEFT JOIN drivers d ON b.driver_id = d.id;

COMMENT ON VIEW buses_with_assignments IS 'Buses with current trip and driver assignments';

-- View: Drivers with current assignment
CREATE OR REPLACE VIEW drivers_with_assignments AS
SELECT 
    d.id,
    d.full_name,
    d.phone,
    d.email,
    d.license_number,
    d.license_expiry_date,
    d.status,
    d.hire_date,
    d.current_bus_id,
    d.current_trip_id,
    b.bus_number as current_bus_number,
    b.registration_number as current_bus_registration,
    (
        SELECT json_build_object(
            'id', t.id,
            'trip_number', t.trip_number,
            'status', t.status,
            'scheduled_departure', t.scheduled_departure,
            'route', json_build_object(
                'origin', r.origin,
                'destination', r.destination
            ),
            'bus', json_build_object(
                'bus_number', b2.bus_number,
                'registration_number', b2.registration_number
            )
        )
        FROM trips t
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN buses b2 ON t.bus_id = b2.id
        WHERE t.driver_id = d.id 
        AND t.status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS')
        ORDER BY t.scheduled_departure DESC
        LIMIT 1
    ) as current_trip_details
FROM drivers d
LEFT JOIN buses b ON d.current_bus_id = b.id;

COMMENT ON VIEW drivers_with_assignments IS 'Drivers with current trip and bus assignments';

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================
-- Grant access to authenticated users
GRANT SELECT ON active_trips_full TO authenticated;
GRANT SELECT ON buses_with_assignments TO authenticated;
GRANT SELECT ON drivers_with_assignments TO authenticated;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the relationships are working:

-- Test 1: Buses with nested driver
-- SELECT id, bus_number, driver:drivers(full_name) FROM buses LIMIT 5;

-- Test 2: Trips with nested bus, driver, and route
-- SELECT id, trip_number, bus:buses(bus_number), driver:drivers(full_name), route:routes(origin, destination) FROM trips LIMIT 5;

-- Test 3: Drivers with current assignments
-- SELECT * FROM drivers_with_assignments LIMIT 5;

-- Test 4: Active trips full view
-- SELECT * FROM active_trips_full LIMIT 5;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All foreign key relationships are now in place
-- Nested Supabase queries will now work correctly
-- =====================================================
