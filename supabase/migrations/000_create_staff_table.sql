-- =====================================================
-- CREATE STAFF TABLE FIRST
-- This must run BEFORE 001_create_driver_shifts_tables.sql
-- =====================================================

-- Create staff table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  bank_account TEXT,
  tax_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);

-- Grant permissions
GRANT ALL ON TABLE staff TO authenticated;

-- Add some sample staff members (conductors and cleaners)
INSERT INTO staff (employee_id, full_name, department, position, hire_date, status, phone, email)
VALUES 
  ('EMP001', 'John Conductor', 'Operations', 'conductor', CURRENT_DATE - INTERVAL '1 year', 'active', '+267 71234567', 'john.conductor@kjkhandala.com'),
  ('EMP002', 'Mary Conductor', 'Operations', 'conductor', CURRENT_DATE - INTERVAL '6 months', 'active', '+267 71234568', 'mary.conductor@kjkhandala.com'),
  ('EMP003', 'Peter Cleaner', 'Maintenance', 'cleaner', CURRENT_DATE - INTERVAL '2 years', 'active', '+267 71234569', 'peter.cleaner@kjkhandala.com'),
  ('EMP004', 'Sarah Cleaner', 'Maintenance', 'cleaner', CURRENT_DATE - INTERVAL '1 year', 'active', '+267 71234570', 'sarah.cleaner@kjkhandala.com')
ON CONFLICT (employee_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Staff table created successfully with sample data!';
END $$;
