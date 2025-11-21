-- =====================================================
-- FIX DRIVER_SHIFTS TABLE SCHEMA
-- Align with existing database structure
-- =====================================================

-- Drop the problematic columns
ALTER TABLE driver_shifts DROP COLUMN IF EXISTS shift_start;
ALTER TABLE driver_shifts DROP COLUMN IF EXISTS shift_end;

-- Ensure we have the correct timestamp columns
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS shift_start_time timestamp with time zone;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS shift_end_time timestamp with time zone;

-- Add missing columns for automation
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS conductor_id uuid REFERENCES staff(id);
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_shifts_start_time ON driver_shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_shift_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver ON driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_bus ON driver_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_schedule ON driver_shifts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);

-- Grant permissions
GRANT ALL ON driver_shifts TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Driver shifts table schema fixed successfully!';
END $$;
