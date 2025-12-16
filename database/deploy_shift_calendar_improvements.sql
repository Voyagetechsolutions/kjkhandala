-- ============================================
-- SHIFT CALENDAR SYSTEM - COMPLETE DEPLOYMENT
-- ============================================
-- Run this script in Supabase SQL Editor to deploy all shift calendar improvements
-- This includes the view, function, and necessary permissions

-- ============================================
-- PART 1: Driver Shifts View
-- ============================================
-- This view joins driver_shifts with related tables for easy querying
-- Eliminates the need for multiple frontend queries

DROP VIEW IF EXISTS driver_shifts_with_names CASCADE;

CREATE OR REPLACE VIEW driver_shifts_with_names AS
SELECT 
    ds.id,
    ds.shift_date,
    ds.shift_start_time,
    ds.shift_end_time,
    ds.start_time,
    ds.end_time,
    ds.status,
    ds.auto_generated,
    ds.notes,
    ds.shift_type,

    -- Driver information
    ds.driver_id,
    COALESCE(d.full_name, 'Unassigned') AS driver_name,
    d.phone AS driver_phone,
    d.license_number AS driver_license,

    -- Bus information
    ds.bus_id,
    b.registration_number AS bus_number,
    b.model AS bus_model,

    -- Route information
    ds.route_id,
    r.origin,
    r.destination,
    CONCAT(r.origin, ' → ', r.destination) AS route_display,

    -- Timestamps
    ds.created_at,
    ds.updated_at

FROM driver_shifts ds
LEFT JOIN drivers d ON d.id = ds.driver_id
LEFT JOIN buses b ON b.id = ds.bus_id
LEFT JOIN routes r ON r.id = ds.route_id;

-- Grant permissions
GRANT SELECT ON driver_shifts_with_names TO authenticated;
GRANT SELECT ON driver_shifts_with_names TO anon;

COMMENT ON VIEW driver_shifts_with_names IS 'Driver shifts with all related information (driver names, bus details, route info) joined for easy querying';

-- ============================================
-- PART 2: Generate Driver Shifts Function
-- ============================================
-- This function automatically creates shifts from route_frequencies
-- Features:
-- - Driver availability checking
-- - Conflict prevention
-- - Automatic driver assignment
-- - Route duration calculation

DROP FUNCTION IF EXISTS generate_driver_shifts(date, date);

CREATE OR REPLACE FUNCTION generate_driver_shifts(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
    d date;
    freq record;
    shift_start timestamptz;
    shift_end timestamptz;
    unique_key text;
    system_day int;
    chosen_driver uuid;
    route_duration_hours numeric;
BEGIN

    RAISE NOTICE 'Starting shift generation from % to %', start_date, end_date;

    d := start_date;
    WHILE d <= end_date LOOP

        --------------------------------------------------------------------
        -- Convert PostgreSQL ISO DOW (1=Mon..7=Sun) → Your system (0=Sun..6=Sat)
        --------------------------------------------------------------------
        system_day := CASE 
            WHEN extract(isodow from d) = 7 THEN 0
            ELSE extract(isodow from d)::int
        END;

        -- Loop through active route frequencies
        FOR freq IN 
            SELECT 
                rf.*,
                r.duration_hours,
                r.estimated_duration_hours
            FROM route_frequencies rf
            LEFT JOIN routes r ON r.id = rf.route_id
            WHERE rf.active = true
            ORDER BY rf.departure_time
        LOOP

            -- Match frequency days_of_week (empty = every day)
            IF (freq.days_of_week = '{}'::int[] OR freq.days_of_week IS NULL OR system_day = ANY(freq.days_of_week)) THEN

                -- Get route duration (fallback to 2 hours)
                route_duration_hours := COALESCE(
                    freq.duration_hours, 
                    freq.estimated_duration_hours,
                    2
                );

                -- Build shift start/end times
                shift_start := d + freq.departure_time;
                shift_end := shift_start + (route_duration_hours || ' hours')::interval;

                ----------------------------------------------------------------
                -- DRIVER ASSIGNMENT
                ----------------------------------------------------------------
                chosen_driver := freq.driver_id;

                IF chosen_driver IS NULL THEN
                    -- Pick the first active driver who is NOT busy at this time
                    SELECT id
                    INTO chosen_driver
                    FROM drivers d1
                    WHERE d1.status = 'active'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM driver_shifts ds
                        WHERE ds.driver_id = d1.id
                        AND ds.shift_start_time < shift_end
                        AND ds.shift_end_time > shift_start
                    )
                    ORDER BY d1.created_at
                    LIMIT 1;
                    
                    IF chosen_driver IS NOT NULL THEN
                        RAISE NOTICE 'Auto-assigned driver % for route %', chosen_driver, freq.route_id;
                    END IF;
                ELSE
                    -- If freq.driver_id is set, check availability
                    IF EXISTS (
                        SELECT 1
                        FROM driver_shifts ds
                        WHERE ds.driver_id = chosen_driver
                        AND ds.shift_start_time < shift_end
                        AND ds.shift_end_time > shift_start
                    ) THEN
                        RAISE NOTICE 'Driver % is busy, skipping shift for route % on %', chosen_driver, freq.route_id, d;
                        CONTINUE;
                    END IF;
                END IF;

                -- Skip if no available driver found
                IF chosen_driver IS NULL THEN
                    RAISE NOTICE 'No available driver for route % on %', freq.route_id, d;
                    CONTINUE;
                END IF;

                ----------------------------------------------------------------
                -- DUPLICATE CHECK
                ----------------------------------------------------------------
                unique_key := freq.route_id::text || '-' || 
                              chosen_driver::text || '-' || 
                              d || '-' || 
                              freq.departure_time;

                -- Skip if shift already exists
                IF EXISTS (
                    SELECT 1 
                    FROM driver_shifts 
                    WHERE driver_id = chosen_driver
                    AND route_id = freq.route_id
                    AND shift_date = d
                    AND shift_start_time = shift_start
                ) THEN
                    RAISE NOTICE 'Shift already exists for driver % on route % at %', chosen_driver, freq.route_id, shift_start;
                    CONTINUE;
                END IF;

                ----------------------------------------------------------------
                -- INSERT THE SHIFT
                ----------------------------------------------------------------
                INSERT INTO driver_shifts (
                    shift_date,
                    driver_id,
                    conductor_id,
                    bus_id,
                    route_id,
                    shift_start_time,
                    shift_end_time,
                    start_time,
                    end_time,
                    status,
                    auto_generated,
                    notes,
                    shift_type
                ) VALUES (
                    d,
                    chosen_driver,
                    NULL,
                    freq.bus_id,
                    freq.route_id,
                    shift_start,
                    shift_end,
                    shift_start,
                    shift_end,
                    'ACTIVE',
                    true,
                    unique_key,
                    'recurring'
                );

                RAISE NOTICE '✓ Created shift: Driver % → Route % on % at %', 
                    chosen_driver, freq.route_id, d, freq.departure_time;

            END IF;

        END LOOP;

        d := d + interval '1 day';
    END LOOP;

    RAISE NOTICE '✅ Shift generation complete for % to %', start_date, end_date;

END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION generate_driver_shifts(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_driver_shifts(date, date) TO anon;

COMMENT ON FUNCTION generate_driver_shifts(date, date) IS 'Automatically generates driver shifts based on route frequencies for a given date range. Includes driver availability checking and conflict prevention.';

-- ============================================
-- VERIFICATION & TESTING
-- ============================================

-- 1. Verify view exists and works
SELECT 
    'driver_shifts_with_names view' AS test,
    COUNT(*) AS record_count,
    'OK' AS status
FROM driver_shifts_with_names;

-- 2. Verify function exists
SELECT 
    proname AS function_name,
    proargnames AS arguments,
    prosrc LIKE '%shift_start%' AS has_logic,
    'OK' AS status
FROM pg_proc 
WHERE proname = 'generate_driver_shifts';

-- 3. Check route_frequencies configuration
SELECT 
    COUNT(*) AS active_frequencies,
    COUNT(DISTINCT route_id) AS unique_routes,
    COUNT(DISTINCT driver_id) FILTER (WHERE driver_id IS NOT NULL) AS routes_with_drivers
FROM route_frequencies
WHERE active = true;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Generate shifts for today
-- SELECT generate_driver_shifts(CURRENT_DATE, CURRENT_DATE);

-- Generate shifts for the next 7 days
-- SELECT generate_driver_shifts(CURRENT_DATE, CURRENT_DATE + 7);

-- Generate shifts for the entire next month
-- SELECT generate_driver_shifts(DATE_TRUNC('month', CURRENT_DATE + interval '1 month'), 
--                               DATE_TRUNC('month', CURRENT_DATE + interval '1 month') + interval '1 month' - interval '1 day');

-- View generated shifts
-- SELECT * FROM driver_shifts_with_names 
-- WHERE shift_date >= CURRENT_DATE 
-- ORDER BY shift_date, shift_start_time;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SHIFT CALENDAR DEPLOYMENT COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Installed:';
    RAISE NOTICE '  ✓ driver_shifts_with_names view';
    RAISE NOTICE '  ✓ generate_driver_shifts() function';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Configure route frequencies with drivers and buses';
    RAISE NOTICE '  2. Run: SELECT generate_driver_shifts(CURRENT_DATE, CURRENT_DATE + 7);';
    RAISE NOTICE '  3. Check shifts in the Shift Calendar UI';
    RAISE NOTICE '';
    RAISE NOTICE 'Frontend changes deployed automatically.';
    RAISE NOTICE '========================================';
END $$;
