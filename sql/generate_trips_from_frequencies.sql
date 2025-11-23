-- Generate Trips from Route Frequencies Function
-- This function creates trips based on route frequencies and driver shifts
-- Usage: SELECT generate_trips_from_frequencies('2025-11-23', '2025-11-30');

CREATE OR REPLACE FUNCTION generate_trips_from_frequencies(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE 
    d date;
    shift_rec record;
    trip_start timestamptz;
    trip_end timestamptz;
    unique_key text;
BEGIN

    d := start_date;
    WHILE d <= end_date LOOP

        -- Loop through all driver shifts for this date
        FOR shift_rec IN 
            SELECT 
                ds.*,
                r.distance_km,
                r.estimated_duration_hours
            FROM driver_shifts ds
            JOIN routes r ON r.id = ds.route_id
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

            -- Create unique key to prevent duplicates
            unique_key := shift_rec.route_id::text || '-' || shift_rec.driver_id::text || '-' || d || '-' || trip_start;

            -- Check if trip already exists
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
                    45, -- Default seats, can be updated from bus capacity
                    45,
                    100.00, -- Default fare, should come from route pricing
                    shift_rec.id  -- Link to the originating shift
                );

                RAISE NOTICE 'Created trip for driver % on route % at %', 
                    shift_rec.driver_id, shift_rec.route_id, trip_start;

            END IF;

        END LOOP;

        d := d + interval '1 day';
    END LOOP;

END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_trips_from_frequencies(date, date) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION generate_trips_from_frequencies(date, date) IS 'Generates trips from existing driver shifts for a given date range';
