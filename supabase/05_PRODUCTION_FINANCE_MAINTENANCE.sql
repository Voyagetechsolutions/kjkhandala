-- ============================================================================
-- PRODUCTION SCHEMA PART 5: FINANCE & MAINTENANCE TABLES
-- ============================================================================

-- ============================================================================
-- FINANCE TABLES
-- ============================================================================

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  reference_number TEXT,
  vendor TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON expenses(company_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Income Records (manual income tracking)
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  income_date DATE NOT NULL,
  reference_number TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_company_date ON income_records(company_id, income_date DESC);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  fuel_station TEXT,
  liters NUMERIC(8, 2) NOT NULL,
  cost_per_liter NUMERIC(8, 2) NOT NULL,
  total_cost NUMERIC(10, 2) NOT NULL,
  odometer_reading BIGINT,
  receipt_number TEXT,
  filled_at TIMESTAMPTZ NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_bus ON fuel_logs(bus_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(filled_at DESC);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch TEXT,
  account_type TEXT,
  currency TEXT DEFAULT 'USD',
  current_balance NUMERIC(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_company ON bank_accounts(company_id);

-- ============================================================================
-- MAINTENANCE TABLES
-- ============================================================================

-- Maintenance Records (historical log)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  description TEXT,
  cost NUMERIC(10, 2),
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL,
  next_service_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_bus ON maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(performed_at DESC);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  work_order_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type maintenance_type NOT NULL,
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'scheduled',
  estimated_cost NUMERIC(10, 2),
  actual_cost NUMERIC(10, 2),
  assigned_to TEXT,
  scheduled_date DATE,
  completed_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_bus ON work_orders(bus_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);

-- Maintenance Schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  description TEXT,
  frequency_days INTEGER,
  frequency_km INTEGER,
  last_service_date DATE,
  last_service_mileage BIGINT,
  next_service_date DATE,
  next_service_mileage BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_bus ON maintenance_schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_date ON maintenance_schedules(next_service_date);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  inspector_name TEXT,
  inspection_date DATE NOT NULL,
  inspection_type TEXT,
  passed BOOLEAN,
  findings TEXT,
  recommendations TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_bus ON inspections(bus_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date DESC);

-- Repairs
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  repair_description TEXT NOT NULL,
  parts_used TEXT,
  labor_cost NUMERIC(10, 2),
  parts_cost NUMERIC(10, 2),
  total_cost NUMERIC(10, 2),
  repaired_by TEXT,
  repair_date DATE NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repairs_work_order ON repairs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_repairs_bus ON repairs(bus_id);

-- Spare Parts Inventory
CREATE TABLE IF NOT EXISTS spare_parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  part_number TEXT UNIQUE,
  part_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(10, 2),
  reorder_level INTEGER DEFAULT 10,
  supplier TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spare_parts_company ON spare_parts_inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_quantity ON spare_parts_inventory(quantity);

-- Parts Consumption
CREATE TABLE IF NOT EXISTS parts_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts_inventory(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2),
  total_cost NUMERIC(10, 2),
  consumed_by TEXT,
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parts_consumption_work_order ON parts_consumption(work_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_consumption_part ON parts_consumption(part_id);

-- Maintenance Reminders
CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  message TEXT NOT NULL,
  due_date DATE,
  due_mileage BIGINT,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_bus ON maintenance_reminders(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_due ON maintenance_reminders(due_date);
