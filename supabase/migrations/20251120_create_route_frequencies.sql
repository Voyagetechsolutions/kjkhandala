-- Create route_frequencies table for automated trip scheduling
CREATE TABLE IF NOT EXISTS route_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_time TIME NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'SPECIFIC_DAYS')),
  days_of_week INTEGER[] DEFAULT '{}', -- Array of integers 0-6 (0=Sunday, 1=Monday, etc.)
  interval_days INTEGER DEFAULT 1, -- For WEEKLY: how many days between trips
  fare_per_seat NUMERIC(10,2) NOT NULL DEFAULT 0, -- Price per seat for this schedule
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_route_frequencies_route_id ON route_frequencies(route_id);
CREATE INDEX idx_route_frequencies_active ON route_frequencies(active);

-- Add RLS policies
ALTER TABLE route_frequencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read route frequencies
CREATE POLICY "Allow authenticated users to read route frequencies"
  ON route_frequencies
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin/operations to manage route frequencies
CREATE POLICY "Allow admin to manage route frequencies"
  ON route_frequencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('SUPER_ADMIN', 'OPERATIONS_MANAGER')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_route_frequencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER route_frequencies_updated_at
  BEFORE UPDATE ON route_frequencies
  FOR EACH ROW
  EXECUTE FUNCTION update_route_frequencies_updated_at();

-- Create function to auto-generate trips based on route frequencies
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
BEGIN
  -- Get tomorrow's date
  target_date := CURRENT_DATE + INTERVAL '1 day';
  day_of_week := EXTRACT(DOW FROM target_date)::INTEGER; -- 0=Sunday, 1=Monday, etc.

  -- Loop through all active route frequencies
  FOR freq IN 
    SELECT rf.*, r.duration_hours, r.origin, r.destination
    FROM route_frequencies rf
    JOIN routes r ON rf.route_id = r.id
    WHERE rf.active = true
  LOOP
    should_create := false;

    -- Determine if we should create a trip for tomorrow
    IF freq.frequency_type = 'DAILY' THEN
      should_create := true;
    
    ELSIF freq.frequency_type = 'SPECIFIC_DAYS' THEN
      -- Check if tomorrow's day is in the days_of_week array
      should_create := day_of_week = ANY(freq.days_of_week);
    
    ELSIF freq.frequency_type = 'WEEKLY' THEN
      -- Check if it's been interval_days since last trip
      IF NOT EXISTS (
        SELECT 1 FROM trips
        WHERE route_id = freq.route_id
        AND DATE(scheduled_departure) >= target_date - (freq.interval_days || ' days')::INTERVAL
      ) THEN
        should_create := true;
      END IF;
    END IF;

    -- Create the trip if conditions are met
    IF should_create THEN
      -- Combine target date with departure time
      target_datetime := target_date + freq.departure_time;
      
      -- Calculate arrival time (add route duration)
      route_duration := (freq.duration_hours || ' hours')::INTERVAL;
      arrival_datetime := target_datetime + route_duration;

      -- Check if trip doesn't already exist for this date/time
      IF NOT EXISTS (
        SELECT 1 FROM trips
        WHERE route_id = freq.route_id
        AND scheduled_departure = target_datetime
      ) THEN
        -- Insert new trip (fare copied from schedule)
        INSERT INTO trips (
          route_id,
          bus_id,
          driver_id,
          scheduled_departure,
          scheduled_arrival,
          status,
          fare,
          total_seats,
          available_seats
        )
        SELECT
          freq.route_id,
          freq.bus_id,
          freq.driver_id,
          target_datetime,
          arrival_datetime,
          'SCHEDULED',
          freq.fare_per_seat, -- Copy fare from schedule
          COALESCE(b.capacity, 50), -- Default to 50 if no bus assigned
          COALESCE(b.capacity, 50)
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
          50, -- Default capacity when no bus assigned
          50
        WHERE freq.bus_id IS NULL
        LIMIT 1;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-update trip statuses
CREATE OR REPLACE FUNCTION update_trip_statuses()
RETURNS void AS $$
BEGIN
  -- Update to BOARDING (30 minutes before departure)
  UPDATE trips
  SET status = 'BOARDING'
  WHERE status = 'SCHEDULED'
  AND scheduled_departure <= NOW() + INTERVAL '30 minutes'
  AND scheduled_departure > NOW();

  -- Update to DEPARTED (at departure time)
  UPDATE trips
  SET status = 'DEPARTED'
  WHERE status IN ('SCHEDULED', 'BOARDING')
  AND scheduled_departure <= NOW()
  AND scheduled_arrival > NOW();

  -- Update to DELAYED (if departure passed and still not departed)
  UPDATE trips
  SET status = 'DELAYED'
  WHERE status = 'SCHEDULED'
  AND scheduled_departure < NOW() - INTERVAL '15 minutes';

  -- Update to COMPLETED (at arrival time)
  UPDATE trips
  SET status = 'COMPLETED'
  WHERE status IN ('DEPARTED', 'BOARDING')
  AND scheduled_arrival <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: To run these functions automatically, you'll need to set up cron jobs in Supabase
-- or use pg_cron extension. For now, they can be called manually or via API endpoints.

COMMENT ON TABLE route_frequencies IS 'Defines recurring trip schedules for routes';
COMMENT ON FUNCTION generate_scheduled_trips() IS 'Auto-generates trips based on route frequencies - run daily';
COMMENT ON FUNCTION update_trip_statuses() IS 'Auto-updates trip statuses based on current time - run every 5 minutes';
