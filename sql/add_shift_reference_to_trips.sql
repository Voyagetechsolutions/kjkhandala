-- Add shift_id reference to trips table to link trips back to their originating shifts
-- This ensures My Trips screen can show trips generated from My Shifts screen

-- First, check if column exists, add it if it doesn't
DO $$
BEGIN
    -- Check if shift_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='trips' AND column_name='shift_id'
    ) THEN
        -- Add shift_id column to link trips to driver_shifts
        ALTER TABLE trips ADD COLUMN shift_id UUID REFERENCES driver_shifts(id) ON DELETE SET NULL;
        
        -- Add an index for better performance
        CREATE INDEX IF NOT EXISTS idx_trips_shift_id ON trips(shift_id);
        
        RAISE NOTICE 'Added shift_id column to trips table with foreign key reference to driver_shifts';
    ELSE
        RAISE NOTICE 'shift_id column already exists in trips table';
    END IF;
END
$$;

-- Update the generate_trips_from_frequencies function to include shift_id
CREATE OR REPLACE FUNCTION generate_trips_from_frequencies(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE 
    d date;
    shift_rec record;
    trip_start timestamptz;
    trip_end timestamptz;
BEGIN
    d := start_date;
    
    WHILE d <= end_date LOOP
        -- Get all driver shifts for this date
        FOR shift_rec IN 
            SELECT ds.*, r.estimated_duration_minutes
            FROM driver_shifts ds
            JOIN routes r ON r.id = ds.route_id
            WHERE ds.shift_date = d
            AND ds.status = 'ACTIVE'
        LOOP
            -- Calculate trip start and end times based on shift
            trip_start := (d || ' ' || COALESCE(shift_rec.shift_start_time, '06:00:00'))::timestamptz;
            trip_end := trip_start + (COALESCE(shift_rec.estimated_duration_minutes, 60) || ' minutes')::interval;

            -- Check if trip already exists
            IF NOT EXISTS (
                SELECT 1 
                FROM trips 
                WHERE shift_id = shift_rec.id
                AND scheduled_departure::date = d
            ) THEN

                -- Insert the trip with shift_id reference
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

                RAISE NOTICE 'Created trip for driver % on route % from shift % at %', 
                    shift_rec.driver_id, shift_rec.route_id, shift_rec.id, trip_start;

            END IF;

        END LOOP;

        d := d + interval '1 day';
    END LOOP;
    
    RAISE NOTICE 'Trip generation completed for dates % to %', start_date, end_date;
END;
$$;
