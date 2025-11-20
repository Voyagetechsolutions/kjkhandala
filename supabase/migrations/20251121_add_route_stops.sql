-- Create route_stops table for via routes support
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  city_name TEXT NOT NULL,
  arrival_offset_minutes INTEGER NOT NULL DEFAULT 0, -- Minutes from route start
  departure_offset_minutes INTEGER NOT NULL DEFAULT 0, -- Minutes from route start
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, stop_order)
);

-- Create indexes
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_route_stops_order ON route_stops(route_id, stop_order);

-- Add RLS policies
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read route stops"
  ON route_stops FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage route stops"
  ON route_stops FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Add is_generated_from_schedule flag to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_generated_from_schedule BOOLEAN DEFAULT false;

-- Create trip_stops table to store stop details for each trip
CREATE TABLE IF NOT EXISTS trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  city_name TEXT NOT NULL,
  scheduled_arrival TIMESTAMPTZ NOT NULL,
  scheduled_departure TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  available_seats INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, stop_order)
);

-- Create indexes
CREATE INDEX idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_order ON trip_stops(trip_id, stop_order);

-- Add RLS policies
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read trip stops"
  ON trip_stops FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage trip stops"
  ON trip_stops FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Update generate_scheduled_trips function to include stops
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
        -- Insert new trip with generated flag
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
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
