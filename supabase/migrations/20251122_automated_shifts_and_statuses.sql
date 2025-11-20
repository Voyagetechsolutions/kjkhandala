-- Update existing driver_shifts table to add trip_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_shifts' AND column_name = 'trip_id'
  ) THEN
    ALTER TABLE driver_shifts ADD COLUMN trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;
    CREATE INDEX idx_driver_shifts_trip_id ON driver_shifts(trip_id);
  END IF;
END $$;

-- Update status column to support new statuses
DO $$
BEGIN
  ALTER TABLE driver_shifts DROP CONSTRAINT IF EXISTS driver_shifts_status_check;
  ALTER TABLE driver_shifts ADD CONSTRAINT driver_shifts_status_check 
    CHECK (status IN ('scheduled', 'SCHEDULED', 'ON_DUTY', 'on_duty', 'DRIVING', 'driving', 'COMPLETED', 'completed', 'CANCELLED', 'cancelled'));
END $$;

-- Ensure is_generated_from_schedule column exists on trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'is_generated_from_schedule'
  ) THEN
    ALTER TABLE trips ADD COLUMN is_generated_from_schedule BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update generate_scheduled_trips to create shifts automatically
CREATE OR REPLACE FUNCTION generate_scheduled_trips()
RETURNS void AS $$
DECLARE
  freq RECORD;
  target_date DATE;
  target_datetime TIMESTAMPTZ;
  arrival_datetime TIMESTAMPTZ;
  day_of_week INTEGER;
  should_create BOOLEAN;
  route_duration INTERVAL;
  new_trip_id UUID;
  stop RECORD;
  shift_start TIMESTAMPTZ;
  shift_end TIMESTAMPTZ;
BEGIN
  target_date := CURRENT_DATE + INTERVAL '1 day';
  day_of_week := EXTRACT(DOW FROM target_date)::INTEGER;

  FOR freq IN 
    SELECT rf.*, r.duration_hours, r.origin, r.destination
    FROM route_frequencies rf
    JOIN routes r ON rf.route_id = r.id
    WHERE rf.active = true
  LOOP
    should_create := false;

    IF freq.frequency_type = 'DAILY' THEN
      should_create := true;
    ELSIF freq.frequency_type = 'SPECIFIC_DAYS' THEN
      should_create := day_of_week = ANY(freq.days_of_week);
    ELSIF freq.frequency_type = 'WEEKLY' THEN
      IF NOT EXISTS (
        SELECT 1 FROM trips
        WHERE route_id = freq.route_id
        AND DATE(scheduled_departure) >= target_date - (freq.interval_days || ' days')::INTERVAL
      ) THEN
        should_create := true;
      END IF;
    END IF;

    IF should_create THEN
      target_datetime := target_date + freq.departure_time;
      route_duration := (freq.duration_hours || ' hours')::INTERVAL;
      arrival_datetime := target_datetime + route_duration;

      IF NOT EXISTS (
        SELECT 1 FROM trips
        WHERE route_id = freq.route_id
        AND scheduled_departure = target_datetime
      ) THEN
        -- Insert new trip
        INSERT INTO trips (
          route_id,
          bus_id,
          driver_id,
          scheduled_departure,
          scheduled_arrival,
          status,
          fare,
          total_seats,
          available_seats,
          is_generated_from_schedule
        )
        SELECT
          freq.route_id,
          freq.bus_id,
          freq.driver_id,
          target_datetime,
          arrival_datetime,
          'SCHEDULED',
          freq.fare_per_seat,
          COALESCE(b.capacity, 50),
          COALESCE(b.capacity, 50),
          true
        FROM buses b
        WHERE b.id = freq.bus_id
        UNION ALL
        SELECT
          freq.route_id,
          freq.bus_id,
          freq.driver_id,
          target_datetime,
          arrival_datetime,
          'SCHEDULED',
          freq.fare_per_seat,
          50,
          50,
          true
        WHERE freq.bus_id IS NULL
        LIMIT 1
        RETURNING id INTO new_trip_id;

        -- Copy route stops to trip stops
        FOR stop IN 
          SELECT * FROM route_stops 
          WHERE route_id = freq.route_id 
          ORDER BY stop_order
        LOOP
          INSERT INTO trip_stops (
            trip_id,
            stop_order,
            city_name,
            scheduled_arrival,
            scheduled_departure,
            available_seats
          )
          SELECT
            new_trip_id,
            stop.stop_order,
            stop.city_name,
            target_datetime + (stop.arrival_offset_minutes || ' minutes')::INTERVAL,
            target_datetime + (stop.departure_offset_minutes || ' minutes')::INTERVAL,
            COALESCE((SELECT capacity FROM buses WHERE id = freq.bus_id), 50);
        END LOOP;

        -- Create driver shift if driver is assigned
        IF freq.driver_id IS NOT NULL THEN
          shift_start := target_datetime - INTERVAL '30 minutes';
          shift_end := arrival_datetime + INTERVAL '20 minutes';
          
          INSERT INTO driver_shifts (
            driver_id,
            trip_id,
            bus_id,
            route_id,
            shift_date,
            start_time,
            end_time,
            status
          ) VALUES (
            freq.driver_id,
            new_trip_id,
            freq.bus_id,
            freq.route_id,
            target_date,
            shift_start,
            shift_end,
            'scheduled'
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-update trip statuses
CREATE OR REPLACE FUNCTION update_trip_statuses()
RETURNS void AS $$
DECLARE
  trip RECORD;
  current_time TIMESTAMPTZ;
BEGIN
  current_time := NOW();

  FOR trip IN 
    SELECT * FROM trips 
    WHERE status NOT IN ('COMPLETED', 'CANCELLED')
    AND is_generated_from_schedule = true
  LOOP
    -- BOARDING: 30 minutes before departure
    IF current_time >= (trip.scheduled_departure - INTERVAL '30 minutes') 
       AND current_time < trip.scheduled_departure 
       AND trip.status = 'SCHEDULED' THEN
      UPDATE trips SET status = 'BOARDING' WHERE id = trip.id;
    
    -- DEPARTED: At departure time
    ELSIF current_time >= trip.scheduled_departure 
          AND current_time < trip.scheduled_arrival 
          AND trip.status IN ('SCHEDULED', 'BOARDING') THEN
      UPDATE trips SET status = 'DEPARTED' WHERE id = trip.id;
    
    -- DELAYED: 1 hour past departure without departing
    ELSIF current_time > (trip.scheduled_departure + INTERVAL '1 hour') 
          AND trip.status IN ('SCHEDULED', 'BOARDING') THEN
      UPDATE trips SET status = 'DELAYED' WHERE id = trip.id;
    
    -- COMPLETED: At arrival time
    ELSIF current_time >= trip.scheduled_arrival 
          AND trip.status = 'DEPARTED' THEN
      UPDATE trips SET status = 'COMPLETED' WHERE id = trip.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-update driver shift statuses
CREATE OR REPLACE FUNCTION update_driver_shift_statuses()
RETURNS void AS $$
DECLARE
  shift RECORD;
  current_time TIMESTAMPTZ;
BEGIN
  current_time := NOW();

  FOR shift IN 
    SELECT ds.*, t.scheduled_departure, t.scheduled_arrival
    FROM driver_shifts ds
    JOIN trips t ON ds.trip_id = t.id
    WHERE ds.status NOT IN ('completed', 'COMPLETED', 'cancelled', 'CANCELLED')
    AND ds.trip_id IS NOT NULL
  LOOP
    -- ON_DUTY: At shift start time
    IF current_time >= shift.start_time 
       AND current_time < shift.scheduled_departure 
       AND LOWER(shift.status) = 'scheduled' THEN
      UPDATE driver_shifts SET status = 'on_duty' WHERE id = shift.id;
    
    -- DRIVING: Between departure and arrival
    ELSIF current_time >= shift.scheduled_departure 
          AND current_time < shift.scheduled_arrival 
          AND LOWER(shift.status) IN ('scheduled', 'on_duty') THEN
      UPDATE driver_shifts SET status = 'driving' WHERE id = shift.id;
    
    -- COMPLETED: After shift end
    ELSIF current_time >= shift.end_time 
          AND LOWER(shift.status) IN ('scheduled', 'on_duty', 'driving') THEN
      UPDATE driver_shifts SET status = 'completed' WHERE id = shift.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
