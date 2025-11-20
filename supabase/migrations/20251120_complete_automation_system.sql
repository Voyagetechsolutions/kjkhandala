-- =====================================================
-- COMPLETE AUTOMATION SYSTEM
-- =====================================================
-- Auto-assignment, shift management, delay detection,
-- rotation, reporting, and notifications
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Driver rotations for route-specific assignments
CREATE TABLE IF NOT EXISTS driver_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  priority SMALLINT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbound notifications queue
CREATE TABLE IF NOT EXISTS outbound_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_contact TEXT,
  channel TEXT, -- sms, email, push
  payload JSONB,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Ensure other tables exist
CREATE TABLE IF NOT EXISTS bus_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conductor_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id UUID NOT NULL REFERENCES conductors(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  total_hours NUMERIC DEFAULT 0,
  trips_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 1) AUTO-ASSIGN BUS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_bus()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_bus UUID;
BEGIN
  IF NEW.bus_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT b.id INTO selected_bus
  FROM buses b
  WHERE b.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM bus_shifts s
      WHERE s.bus_id = b.id
        AND tstzrange(s.shift_start, s.shift_end) && tstzrange(NEW.scheduled_departure, NEW.scheduled_arrival)
    )
  ORDER BY
    CASE WHEN b.seating_capacity >= COALESCE(NEW.total_seats, 0) THEN 0 ELSE 1 END,
    (
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (shift_end - shift_start))/3600), 0)
      FROM bus_shifts s2
      WHERE s2.bus_id = b.id
        AND s2.shift_start >= NOW() - INTERVAL '7 days'
    ) ASC
  LIMIT 1;

  IF selected_bus IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.bus_id := selected_bus;

  INSERT INTO bus_shifts (bus_id, trip_id, shift_start, shift_end, status)
  VALUES (selected_bus, NEW.id, NEW.scheduled_departure, NEW.scheduled_arrival, 'SCHEDULED');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_bus ON trips;
CREATE TRIGGER trg_auto_assign_bus
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION auto_assign_bus();

-- =====================================================
-- 2) AUTO-ASSIGN CONDUCTOR
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_conductor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  selected_conductor UUID;
BEGIN
  IF NEW.conductor_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.id INTO selected_conductor
  FROM conductors c
  WHERE c.active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM conductor_shifts s
      WHERE s.conductor_id = c.id
        AND tstzrange(s.shift_start, s.shift_end) && tstzrange(NEW.scheduled_departure, NEW.scheduled_arrival)
    )
  ORDER BY (
    SELECT COALESCE(COUNT(*), 0)
    FROM conductor_shifts s2
    WHERE s2.conductor_id = c.id
      AND s2.shift_start >= NOW() - INTERVAL '7 days'
  ) ASC
  LIMIT 1;

  IF selected_conductor IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.conductor_id := selected_conductor;

  INSERT INTO conductor_shifts (conductor_id, trip_id, shift_start, shift_end, status)
  VALUES (selected_conductor, NEW.id, NEW.scheduled_departure, NEW.scheduled_arrival, 'SCHEDULED');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_conductor ON trips;
CREATE TRIGGER trg_auto_assign_conductor
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION auto_assign_conductor();

-- =====================================================
-- 3) CREATE SHIFTS ON TRIP INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION create_shifts_on_trip_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    INSERT INTO driver_shifts (driver_id, trip_id, bus_id, shift_start, shift_end, status)
    SELECT NEW.driver_id, NEW.id, NEW.bus_id, NEW.scheduled_departure, NEW.scheduled_arrival, 'SCHEDULED'
    WHERE NOT EXISTS (SELECT 1 FROM driver_shifts s WHERE s.trip_id = NEW.id);
  END IF;

  IF NEW.bus_id IS NOT NULL THEN
    INSERT INTO bus_shifts (bus_id, trip_id, shift_start, shift_end, status)
    SELECT NEW.bus_id, NEW.id, NEW.scheduled_departure, NEW.scheduled_arrival, 'SCHEDULED'
    WHERE NOT EXISTS (SELECT 1 FROM bus_shifts s WHERE s.trip_id = NEW.id);
  END IF;

  IF NEW.conductor_id IS NOT NULL THEN
    INSERT INTO conductor_shifts (conductor_id, trip_id, shift_start, shift_end, status)
    SELECT NEW.conductor_id, NEW.id, NEW.scheduled_departure, NEW.scheduled_arrival, 'SCHEDULED'
    WHERE NOT EXISTS (SELECT 1 FROM conductor_shifts s WHERE s.trip_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_shifts_on_trip_insert ON trips;
CREATE TRIGGER trg_create_shifts_on_trip_insert
AFTER INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION create_shifts_on_trip_insert();

-- =====================================================
-- 4) GENERATE SHIFT REPORTS (DAILY)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_shift_reports_for_yesterday()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO shift_reports (report_date, driver_id, total_hours, trips_count)
  SELECT
    (CURRENT_DATE - 1) AS report_date,
    s.driver_id,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(s.actual_end, s.shift_end) - COALESCE(s.actual_start, s.shift_start)))/3600), 0) AS total_hours,
    COUNT(*) FILTER (WHERE s.trip_id IS NOT NULL) AS trips_count
  FROM driver_shifts s
  WHERE DATE(s.shift_start AT TIME ZONE 'UTC') = CURRENT_DATE - 1
  GROUP BY s.driver_id
  ON CONFLICT DO NOTHING;
END;
$$;

-- =====================================================
-- 5) DETECT AND MARK DELAYS
-- =====================================================

CREATE OR REPLACE FUNCTION detect_and_mark_delays()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  delay_minutes INT;
  sev TEXT;
BEGIN
  FOR rec IN
    SELECT id, scheduled_departure
    FROM trips
    WHERE status NOT IN ('DEPARTED', 'COMPLETED', 'CANCELLED', 'DELAYED')
      AND NOW() > scheduled_departure
      AND NOW() < scheduled_arrival
  LOOP
    delay_minutes := FLOOR(EXTRACT(EPOCH FROM (NOW() - rec.scheduled_departure)) / 60);

    IF delay_minutes >= 60 THEN
      sev := 'CRITICAL';
    ELSIF delay_minutes >= 30 THEN
      sev := 'MODERATE';
    ELSE
      sev := 'MINOR';
    END IF;

    UPDATE trips SET status = 'DELAYED' WHERE id = rec.id;

    INSERT INTO alerts (trip_id, severity, message)
    SELECT rec.id, sev, FORMAT('Delay detected: %s minutes', delay_minutes)
    WHERE NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.trip_id = rec.id
        AND a.severity = sev
        AND a.created_at > NOW() - INTERVAL '2 hours'
    );

    -- Queue notification for critical delays
    IF sev = 'CRITICAL' THEN
      INSERT INTO outbound_notifications (to_contact, channel, payload, status)
      VALUES (
        'operations@example.com',
        'email',
        jsonb_build_object('trip_id', rec.id, 'delay_minutes', delay_minutes),
        'PENDING'
      );
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 6) DRIVER ROTATION ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION assign_driver_by_rotation(
  p_route_id UUID,
  p_trip_id UUID,
  p_departure TIMESTAMPTZ,
  p_arrival TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  candidate UUID;
BEGIN
  SELECT dr.driver_id INTO candidate
  FROM driver_rotations dr
  WHERE dr.route_id = p_route_id
    AND dr.active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts s
      WHERE s.driver_id = dr.driver_id
        AND tstzrange(s.shift_start, s.shift_end) && tstzrange(p_departure, p_arrival)
    )
  ORDER BY dr.priority ASC, dr.created_at ASC
  LIMIT 1;

  RETURN candidate;
END;
$$;

-- =====================================================
-- 7) GET AVAILABLE DRIVERS (RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_drivers(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS TABLE (
  driver_id UUID,
  name TEXT,
  hours_last_7_days NUMERIC,
  last_shift_end TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    COALESCE((
      SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(s.actual_end, s.shift_end) - COALESCE(s.actual_start, s.shift_start)))/3600)
      FROM driver_shifts s
      WHERE s.driver_id = d.id
        AND s.shift_start >= NOW() - INTERVAL '7 days'
    ), 0) AS hours_last_7_days,
    (
      SELECT MAX(COALESCE(s.actual_end, s.shift_end))
      FROM driver_shifts s
      WHERE s.driver_id = d.id
    ) AS last_shift_end
  FROM drivers d
  WHERE d.active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM driver_shifts s2
      WHERE s2.driver_id = d.id
        AND tstzrange(s2.shift_start, s2.shift_end) && tstzrange(p_start, p_end)
    )
    AND (
      SELECT COALESCE(MAX(COALESCE(s3.actual_end, s3.shift_end)), NOW() - INTERVAL '1000 hours')
      FROM driver_shifts s3
      WHERE s3.driver_id = d.id
    ) <= p_start - INTERVAL '10 hours'
  ORDER BY hours_last_7_days ASC;
END;
$$;

-- =====================================================
-- 8) FINALIZE SHIFT ON TRIP UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION finalize_shift_on_trip_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'DEPARTED' THEN
    UPDATE driver_shifts
    SET actual_start = COALESCE(actual_start, NOW()), status = 'ACTIVE'
    WHERE trip_id = NEW.id;
    
    UPDATE bus_shifts SET status = 'ACTIVE' WHERE trip_id = NEW.id;
    UPDATE conductor_shifts SET status = 'ACTIVE' WHERE trip_id = NEW.id;
  END IF;

  IF NEW.status = 'COMPLETED' THEN
    UPDATE driver_shifts
    SET 
      actual_end = COALESCE(actual_end, NOW()),
      actual_start = COALESCE(actual_start, shift_start),
      status = 'COMPLETED',
      hours_worked = EXTRACT(EPOCH FROM (COALESCE(actual_end, NOW()) - COALESCE(actual_start, shift_start)))/3600
    WHERE trip_id = NEW.id;

    UPDATE bus_shifts SET status = 'COMPLETED' WHERE trip_id = NEW.id;
    UPDATE conductor_shifts SET status = 'COMPLETED' WHERE trip_id = NEW.id;

    UPDATE alerts SET resolved = TRUE WHERE trip_id = NEW.id AND resolved = FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_finalize_shift_on_trip_update ON trips;
CREATE TRIGGER trg_finalize_shift_on_trip_update
AFTER UPDATE ON trips
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION finalize_shift_on_trip_update();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_driver_rotations_route ON driver_rotations(route_id, active);
CREATE INDEX IF NOT EXISTS idx_bus_shifts_bus_time ON bus_shifts(bus_id, shift_start, shift_end);
CREATE INDEX IF NOT EXISTS idx_conductor_shifts_conductor_time ON conductor_shifts(conductor_id, shift_start, shift_end);
CREATE INDEX IF NOT EXISTS idx_alerts_trip ON alerts(trip_id, resolved);
CREATE INDEX IF NOT EXISTS idx_shift_reports_date ON shift_reports(report_date, driver_id);
CREATE INDEX IF NOT EXISTS idx_outbound_notifications_status ON outbound_notifications(status, created_at);

-- =====================================================
-- DONE
-- =====================================================
