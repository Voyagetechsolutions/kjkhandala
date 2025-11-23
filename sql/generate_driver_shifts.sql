-- Generate Driver Shifts Function (Driver Assignment + Availability Check)
-- Usage: SELECT generate_driver_shifts('2025-12-01', '2025-12-31');

CREATE OR REPLACE FUNCTION generate_driver_shifts(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE 
    d date;
    freq record;
    shift_start timestamptz;
    shift_end timestamptz;
    unique_key text;
    system_day int;
    chosen_driver uuid;
BEGIN

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
            SELECT *
            FROM route_frequencies
            WHERE active = true
        LOOP

            -- Match frequency days_of_week (empty = every day)
            IF (freq.days_of_week = '{}'::int[] OR system_day = ANY(freq.days_of_week)) THEN

                -- Build shift start/end times
                shift_start := d + freq.departure_time;
                shift_end := shift_start + interval '2 hours'; -- adjust if needed

                ----------------------------------------------------------------
                -- DRIVER ASSIGNMENT (use freq.driver_id or pick an active available driver)
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
                    ORDER BY created_at
                    LIMIT 1;
                ELSE
                    -- If freq.driver_id is set, check availability
                    IF EXISTS (
                        SELECT 1
                        FROM driver_shifts ds
                        WHERE ds.driver_id = chosen_driver
                        AND ds.shift_start_time < shift_end
                        AND ds.shift_end_time > shift_start
                    ) THEN
                        -- Driver is busy, skip this frequency for this day
                        CONTINUE;
                    END IF;
                END IF;

                -- Skip if no available driver found
                IF chosen_driver IS NULL THEN
                    CONTINUE;
                END IF;

                ----------------------------------------------------------------
                -- UNIQUE KEY = only route + bus + date (notes simplified)
                ----------------------------------------------------------------
                unique_key := freq.route_id::text || '-' || COALESCE(freq.bus_id::text, 'no_bus') || '-' || d;

                -- Skip if shift already exists
                IF EXISTS (SELECT 1 FROM driver_shifts WHERE notes = unique_key AND shift_start_time = shift_start) THEN
                    CONTINUE;
                END IF;

                ----------------------------------------------------------------
                -- Insert the shift
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
                    null,
                    freq.bus_id,
                    freq.route_id,
                    shift_start,
                    shift_end,
                    shift_start,
                    shift_end,
                    'ACTIVE',
                    true,
                    unique_key,  -- simplified notes
                    'recurring'
                );

            END IF;

        END LOOP;

        d := d + interval '1 day';
    END LOOP;

END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_driver_shifts(date, date) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION generate_driver_shifts(date, date) IS 'Automatically generates driver shifts based on route frequencies for a given date range';
