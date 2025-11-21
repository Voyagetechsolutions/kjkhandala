-- =====================================================
-- DRIVER SHIFT AUTOMATION - DATABASE SETUP
-- Run this migration to set up the shift automation system
-- =====================================================

-- Ensure driver_shifts table has all required columns
ALTER TABLE driver_shifts 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_shifts_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver ON driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_bus ON driver_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_schedule ON driver_shifts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_time_range ON driver_shifts(shift_start, shift_end);

-- Add indexes to related tables
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(departure_date);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_fuel ON buses(fuel_level);

-- Create shift_generation_queue table
CREATE TABLE IF NOT EXISTS shift_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  departure_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_queue_status ON shift_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_shift_queue_date ON shift_generation_queue(departure_date);

-- Grant permissions
GRANT ALL ON TABLE shift_generation_queue TO authenticated;
GRANT ALL ON TABLE driver_shifts TO authenticated;

-- Add comments
COMMENT ON TABLE shift_generation_queue IS 'Queue for background processing of automatic shift generation';
COMMENT ON COLUMN driver_shifts.auto_generated IS 'Indicates if shift was created automatically or manually';
COMMENT ON COLUMN driver_shifts.schedule_id IS 'Links shift to the schedule/trip it serves';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Driver Shift Automation database setup completed successfully!';
END $$;
