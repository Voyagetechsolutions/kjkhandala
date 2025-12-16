-- ============================================
-- FIX: 400 Bad Request on generate_trips_from_frequencies
-- ============================================
-- Run this in Supabase SQL Editor to create the missing function
-- This fixes the error: POST /rest/v1/rpc/generate_trips_from_frequencies 400

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS generate_trips_from_frequencies(date, date);

-- Create the function
CREATE OR REPLACE FUNCTION generate_trips_from_frequencies(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
    d date;
    shift_rec record;
    trip_start timestamptz;
    trip_end timestamptz;
    unique_key text;
BEGIN
    -- Loop through each date in the range
    d := start_date;
    WHILE d <= end_date LOOP

        -- Loop through all active driver shifts for this date
        FOR shift_rec IN 
            SELECT 
                ds.*,
                r.distance_km,
                r.estimated_duration_hours,
                rf.fare_per_seat,
                b.seat_capacity
            FROM driver_shifts ds
            JOIN routes r ON r.id = ds.route_id
            LEFT JOIN route_frequencies rf ON rf.route_id = ds.route_id AND rf.active = true
            LEFT JOIN buses b ON b.id = ds.bus_id
            WHERE ds.shift_date = d
            AND ds.status = 'ACTIVE'
            AND ds.driver_id IS NOT NULL
        LOOP

            -- Calculate trip times from shift times
            trip_start := shift_rec.shift_start_time;
            trip_end := COALESCE(
                shift_rec.shift_end_time,
                shift_rec.shift_start_time + COALESCE(
                    (shift_rec.estimated_duration_hours || ' hours')::interval,
                    interval '2 hours'
                )
            );

            -- Check if trip already exists (prevent duplicates)
            IF NOT EXISTS (
                SELECT 1 
                FROM trips 
                WHERE route_id = shift_rec.route_id
                AND driver_id = shift_rec.driver_id
                AND scheduled_departure::date = d
                AND scheduled_departure = trip_start
            ) THEN

                -- Insert the trip
                INSERT INTO trips (
                    route_id,
                    driver_id,
                    bus_id,
                    scheduled_departure,
                    scheduled_arrival,
                    status,
                    total_seats,
                    available_seats,
                    fare,
                    shift_id
                ) VALUES (
                    shift_rec.route_id,
                    shift_rec.driver_id,
                    shift_rec.bus_id,
                    trip_start,
                    trip_end,
                    'SCHEDULED',
                    COALESCE(shift_rec.seat_capacity, 45), -- Use bus capacity or default
                    COALESCE(shift_rec.seat_capacity, 45),
                    COALESCE(shift_rec.fare_per_seat, 100.00), -- Use route frequency fare or default
                    shift_rec.id  -- Link to the originating shift
                );

                RAISE NOTICE 'Created trip for driver % on route % at %', 
                    shift_rec.driver_id, shift_rec.route_id, trip_start;

            END IF;

        END LOOP;

        d := d + interval '1 day';
    END LOOP;

    RAISE NOTICE 'Trip generation complete for date range % to %', start_date, end_date;

END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION generate_trips_from_frequencies(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_trips_from_frequencies(date, date) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION generate_trips_from_frequencies(date, date) IS 'Generates trips from existing driver shifts for a given date range. Uses route frequency fares and bus capacities when available.';

-- Test the function (optional - comment out if you don't want to run immediately)
-- SELECT generate_trips_from_frequencies(CURRENT_DATE, CURRENT_DATE + 7);

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify the function exists:
-- SELECT proname, proargtypes FROM pg_proc WHERE proname = 'generate_trips_from_frequencies';

-- ============================================
-- USAGE EXAMPLE
-- ============================================
-- Generate trips for today:
-- SELECT generate_trips_from_frequencies(CURRENT_DATE, CURRENT_DATE);
--
-- Generate trips for the next week:
-- SELECT generate_trips_from_frequencies(CURRENT_DATE, CURRENT_DATE + 7);
