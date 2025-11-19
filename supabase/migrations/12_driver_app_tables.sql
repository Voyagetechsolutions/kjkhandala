-- =====================================================
-- DRIVER APP DATABASE SCHEMA
-- Migration: 12_driver_app_tables.sql
-- Description: Complete database schema for driver app features
-- =====================================================

-- =====================================================
-- 1. TRIP INSPECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip')),
  
  -- Exterior checks
  tyres_condition TEXT CHECK (tyres_condition IN ('good', 'fair', 'poor')),
  lights_working BOOLEAN DEFAULT true,
  mirrors_condition TEXT CHECK (mirrors_condition IN ('good', 'damaged')),
  body_damage TEXT,
  windows_condition TEXT CHECK (windows_condition IN ('good', 'cracked', 'broken')),
  
  -- Engine & Fluids
  engine_temperature TEXT CHECK (engine_temperature IN ('normal', 'high', 'low')),
  oil_level TEXT CHECK (oil_level IN ('full', 'low', 'critical')),
  coolant_level TEXT CHECK (coolant_level IN ('full', 'low', 'critical')),
  battery_condition TEXT CHECK (battery_condition IN ('good', 'weak', 'dead')),
  
  -- Interior
  seats_condition TEXT CHECK (seats_condition IN ('good', 'damaged')),
  seat_belts_working BOOLEAN DEFAULT true,
  ac_working BOOLEAN DEFAULT true,
  floor_condition TEXT CHECK (floor_condition IN ('clean', 'dirty', 'damaged')),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  
  -- Safety
  fire_extinguisher_present BOOLEAN DEFAULT true,
  fire_extinguisher_expiry DATE,
  first_aid_kit_present BOOLEAN DEFAULT true,
  emergency_exit_working BOOLEAN DEFAULT true,
  warning_triangle_present BOOLEAN DEFAULT true,
  
  -- Overall
  overall_status TEXT CHECK (overall_status IN ('passed', 'passed_with_notes', 'failed')),
  critical_issues TEXT[],
  notes TEXT,
  defect_photos TEXT[], -- Array of photo URLs
  
  odometer_reading DECIMAL(10, 2),
  fuel_level DECIMAL(5, 2), -- Percentage
  
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trip_inspections_trip ON trip_inspections(trip_id);
CREATE INDEX idx_trip_inspections_driver ON trip_inspections(driver_id);
CREATE INDEX idx_trip_inspections_type ON trip_inspections(inspection_type);
CREATE INDEX idx_trip_inspections_status ON trip_inspections(overall_status);

-- =====================================================
-- 2. FUEL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  
  fuel_station TEXT NOT NULL,
  litres DECIMAL(10, 2) NOT NULL,
  price_per_litre DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  
  odometer_reading DECIMAL(10, 2) NOT NULL,
  
  payment_method TEXT NOT NULL CHECK (payment_method IN ('company_card', 'cash', 'account')),
  receipt_photo TEXT, -- URL to receipt image
  
  comments TEXT,
  
  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fuel_logs_trip ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_logs_driver ON fuel_logs(driver_id);
CREATE INDEX idx_fuel_logs_bus ON fuel_logs(bus_id);
CREATE INDEX idx_fuel_logs_status ON fuel_logs(status);
CREATE INDEX idx_fuel_logs_created ON fuel_logs(created_at DESC);

-- =====================================================
-- 3. INCIDENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'breakdown', 'accident', 'delay', 'medical_emergency', 
    'passenger_misconduct', 'roadblock', 'police_stop', 
    'weather_issue', 'other'
  )),
  
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  
  -- Media
  photos TEXT[], -- Array of photo URLs
  videos TEXT[], -- Array of video URLs
  
  -- Assistance
  assistance_needed BOOLEAN DEFAULT false,
  assistance_type TEXT, -- 'tow', 'mechanic', 'medical', 'police', etc.
  
  -- Resolution
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'closed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Notifications sent
  dispatch_notified BOOLEAN DEFAULT false,
  maintenance_notified BOOLEAN DEFAULT false,
  management_notified BOOLEAN DEFAULT false,
  
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_trip ON incidents(trip_id);
CREATE INDEX idx_incidents_driver ON incidents(driver_id);
CREATE INDEX idx_incidents_bus ON incidents(bus_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_reported ON incidents(reported_at DESC);

-- =====================================================
-- 4. TRIP TIMELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'depart_depot', 'arrive_pickup', 'depart_pickup', 
    'arrive_destination', 'trip_completed', 'delay', 
    'stop', 'resume', 'other'
  )),
  
  event_title TEXT NOT NULL,
  event_description TEXT,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  
  -- Timing
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delay_minutes INTEGER,
  
  -- Additional data
  notes TEXT,
  photos TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trip_timeline_trip ON trip_timeline(trip_id);
CREATE INDEX idx_trip_timeline_driver ON trip_timeline(driver_id);
CREATE INDEX idx_trip_timeline_event ON trip_timeline(event_type);
CREATE INDEX idx_trip_timeline_time ON trip_timeline(actual_time DESC);

-- =====================================================
-- 5. DRIVER MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sender/Receiver
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN (
    'general', 'trip_update', 'schedule_change', 'announcement', 
    'alert', 'maintenance', 'urgent'
  )),
  
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Related entities
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Reply
  reply_to UUID REFERENCES driver_messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_driver_messages_to ON driver_messages(to_driver_id);
CREATE INDEX idx_driver_messages_from ON driver_messages(from_user_id);
CREATE INDEX idx_driver_messages_trip ON driver_messages(trip_id);
CREATE INDEX idx_driver_messages_type ON driver_messages(message_type);
CREATE INDEX idx_driver_messages_read ON driver_messages(read);
CREATE INDEX idx_driver_messages_created ON driver_messages(created_at DESC);

-- =====================================================
-- 6. DRIVER WALLET TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'daily_allowance', 'fuel_allowance', 'trip_earning', 
    'bonus', 'deduction', 'advance', 'refund'
  )),
  
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BWP',
  
  description TEXT NOT NULL,
  
  -- Related entities
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  fuel_log_id UUID REFERENCES fuel_logs(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  payment_method TEXT, -- 'bank_transfer', 'cash', 'mobile_money'
  payment_reference TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_driver_wallet_driver ON driver_wallet(driver_id);
CREATE INDEX idx_driver_wallet_type ON driver_wallet(transaction_type);
CREATE INDEX idx_driver_wallet_status ON driver_wallet(status);
CREATE INDEX idx_driver_wallet_trip ON driver_wallet(trip_id);
CREATE INDEX idx_driver_wallet_created ON driver_wallet(created_at DESC);

-- =====================================================
-- 7. PASSENGER CHECK-INS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS passenger_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  passenger_name TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  
  check_in_method TEXT NOT NULL CHECK (check_in_method IN ('qr_scan', 'manual', 'nfc')),
  
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_passenger_checkins_booking ON passenger_checkins(booking_id);
CREATE INDEX idx_passenger_checkins_trip ON passenger_checkins(trip_id);
CREATE INDEX idx_passenger_checkins_driver ON passenger_checkins(driver_id);
CREATE INDEX idx_passenger_checkins_time ON passenger_checkins(checked_in_at DESC);

-- =====================================================
-- 8. DRIVER PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  total_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  cancelled_trips INTEGER DEFAULT 0,
  
  on_time_trips INTEGER DEFAULT 0,
  delayed_trips INTEGER DEFAULT 0,
  
  total_distance DECIMAL(10, 2) DEFAULT 0,
  total_fuel_consumed DECIMAL(10, 2) DEFAULT 0,
  fuel_efficiency DECIMAL(10, 2), -- km per litre
  
  incidents_count INTEGER DEFAULT 0,
  critical_incidents INTEGER DEFAULT 0,
  
  average_rating DECIMAL(3, 2),
  total_ratings INTEGER DEFAULT 0,
  
  -- Scores (0-100)
  punctuality_score INTEGER,
  safety_score INTEGER,
  fuel_efficiency_score INTEGER,
  customer_satisfaction_score INTEGER,
  overall_score INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(driver_id, period_start, period_end)
);

-- Indexes
CREATE INDEX idx_driver_performance_driver ON driver_performance(driver_id);
CREATE INDEX idx_driver_performance_period ON driver_performance(period_start, period_end);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE trip_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;

-- Policies for trip_inspections
CREATE POLICY "Drivers can view their own inspections"
  ON trip_inspections FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create their own inspections"
  ON trip_inspections FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all inspections"
  ON trip_inspections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Policies for fuel_logs
CREATE POLICY "Drivers can view their own fuel logs"
  ON fuel_logs FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create fuel logs"
  ON fuel_logs FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all fuel logs"
  ON fuel_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'finance')
  ));

CREATE POLICY "Finance can update fuel logs"
  ON fuel_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'finance')
  ));

-- Policies for incidents
CREATE POLICY "Drivers can view their own incidents"
  ON incidents FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all incidents"
  ON incidents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatch')
  ));

CREATE POLICY "Admins can update incidents"
  ON incidents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatch')
  ));

-- Policies for trip_timeline
CREATE POLICY "Drivers can view their trip timeline"
  ON trip_timeline FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create timeline events"
  ON trip_timeline FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all timeline events"
  ON trip_timeline FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatch')
  ));

-- Policies for driver_messages
CREATE POLICY "Drivers can view their messages"
  ON driver_messages FOR SELECT
  USING (to_driver_id = auth.uid());

CREATE POLICY "Drivers can reply to messages"
  ON driver_messages FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Admins can send messages to drivers"
  ON driver_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatch')
  ));

-- Policies for driver_wallet
CREATE POLICY "Drivers can view their wallet"
  ON driver_wallet FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage driver wallet"
  ON driver_wallet FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'finance')
  ));

-- Policies for passenger_checkins
CREATE POLICY "Drivers can view their checkins"
  ON passenger_checkins FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create checkins"
  ON passenger_checkins FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can view all checkins"
  ON passenger_checkins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Policies for driver_performance
CREATE POLICY "Drivers can view their performance"
  ON driver_performance FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage driver performance"
  ON driver_performance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_inspections_updated_at
  BEFORE UPDATE ON trip_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_logs_updated_at
  BEFORE UPDATE ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_messages_updated_at
  BEFORE UPDATE ON driver_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_wallet_updated_at
  BEFORE UPDATE ON driver_wallet
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_performance_updated_at
  BEFORE UPDATE ON driver_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE trip_inspections IS 'Pre and post-trip vehicle inspections by drivers';
COMMENT ON TABLE fuel_logs IS 'Fuel consumption logs submitted by drivers';
COMMENT ON TABLE incidents IS 'Incidents and breakdowns reported by drivers';
COMMENT ON TABLE trip_timeline IS 'Real-time trip event updates from drivers';
COMMENT ON TABLE driver_messages IS 'In-app messaging between dispatch and drivers';
COMMENT ON TABLE driver_wallet IS 'Driver allowances, earnings, and transactions';
COMMENT ON TABLE passenger_checkins IS 'Passenger check-in records via QR scan';
COMMENT ON TABLE driver_performance IS 'Driver performance metrics and scores';
