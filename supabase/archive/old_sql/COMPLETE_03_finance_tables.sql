-- =====================================================
-- FINANCE TABLES - For Finance Manager Dashboard
-- Run AFTER COMPLETE_02_operations_tables.sql
-- =====================================================

-- =====================================================
-- 1. EXPENSES (Operating Expenses)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'FUEL',
    'MAINTENANCE',
    'SALARIES',
    'INSURANCE',
    'LICENSES',
    'RENT',
    'UTILITIES',
    'MARKETING',
    'OFFICE_SUPPLIES',
    'PROFESSIONAL_FEES',
    'TAXES',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('PENDING','APPROVED','PAID','REJECTED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number text UNIQUE NOT NULL, -- EXP20251111-001
  date date NOT NULL DEFAULT CURRENT_DATE,
  category expense_category NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  vendor text,
  invoice_number text,
  invoice_url text,
  payment_method payment_method,
  payment_reference text,
  status expense_status DEFAULT 'PENDING',
  bus_id uuid REFERENCES public.buses(id), -- If related to specific bus
  trip_id uuid REFERENCES public.trips(id), -- If related to specific trip
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_number ON public.expenses(expense_number);
CREATE INDEX idx_expenses_bus ON public.expenses(bus_id);
CREATE INDEX idx_expenses_requested_by ON public.expenses(requested_by);

-- =====================================================
-- 2. INVOICES (Invoice Management)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('DRAFT','SENT','PAID','OVERDUE','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL, -- INV20251111-001
  date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_address text,
  description text,
  items jsonb NOT NULL, -- Array of line items: [{description, quantity, rate, amount}]
  subtotal numeric(10,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  amount_paid numeric(10,2) DEFAULT 0,
  balance numeric(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status invoice_status DEFAULT 'DRAFT',
  payment_terms text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_date ON public.invoices(date DESC);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_overdue ON public.invoices(due_date, status) 
  WHERE status != 'PAID' AND status != 'CANCELLED';

-- =====================================================
-- 3. REFUNDS (Refund Processing)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('PENDING','APPROVED','REJECTED','PROCESSED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE refund_reason AS ENUM (
    'TRIP_CANCELLED',
    'PASSENGER_REQUEST',
    'MEDICAL_EMERGENCY',
    'DUPLICATE_BOOKING',
    'SERVICE_ISSUE',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number text UNIQUE NOT NULL, -- REF20251111-001
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  booking_reference text NOT NULL,
  passenger_id uuid REFERENCES public.profiles(id),
  passenger_name text NOT NULL,
  passenger_email text,
  passenger_phone text,
  trip_id uuid REFERENCES public.trips(id),
  route_name text,
  travel_date date,
  original_amount numeric(10,2) NOT NULL,
  refund_amount numeric(10,2) NOT NULL,
  penalty_amount numeric(10,2) DEFAULT 0,
  processing_fee numeric(10,2) DEFAULT 0,
  net_refund numeric(10,2) GENERATED ALWAYS AS (refund_amount - penalty_amount - processing_fee) STORED,
  reason refund_reason NOT NULL,
  reason_details text,
  status refund_status DEFAULT 'PENDING',
  refund_method payment_method,
  requested_at timestamptz DEFAULT now(),
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_refunds_booking ON public.refunds(booking_id);
CREATE INDEX idx_refunds_passenger ON public.refunds(passenger_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_number ON public.refunds(refund_number);
CREATE INDEX idx_refunds_requested ON public.refunds(requested_at DESC);

-- =====================================================
-- 4. ACCOUNTS (Bank Accounts)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('CHECKING','SAVINGS','CREDIT_CARD','CASH','MOBILE_MONEY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_type account_type NOT NULL,
  bank_name text,
  account_number text UNIQUE,
  currency text DEFAULT 'BWP',
  current_balance numeric(12,2) DEFAULT 0,
  opening_balance numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  last_reconciled_date date,
  last_reconciled_balance numeric(12,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_accounts_active ON public.accounts(is_active);
CREATE INDEX idx_accounts_type ON public.accounts(account_type);

-- =====================================================
-- 5. COLLECTIONS (Cash Collections)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE collection_source AS ENUM ('TICKET_SALES','PARCEL','CHARTER','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE collection_status AS ENUM ('PENDING','VERIFIED','DEPOSITED','RECONCILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_number text UNIQUE NOT NULL, -- COL20251111-001
  date date NOT NULL DEFAULT CURRENT_DATE,
  source collection_source NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  cash_amount numeric(10,2) DEFAULT 0,
  card_amount numeric(10,2) DEFAULT 0,
  mobile_money_amount numeric(10,2) DEFAULT 0,
  collected_by uuid NOT NULL REFERENCES auth.users(id),
  location text, -- Terminal/office location
  trip_id uuid REFERENCES public.trips(id),
  status collection_status DEFAULT 'PENDING',
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  deposited_to uuid REFERENCES public.accounts(id),
  deposited_at timestamptz,
  deposit_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_collections_date ON public.collections(date DESC);
CREATE INDEX idx_collections_collected_by ON public.collections(collected_by);
CREATE INDEX idx_collections_status ON public.collections(status);
CREATE INDEX idx_collections_number ON public.collections(collection_number);
CREATE INDEX idx_collections_trip ON public.collections(trip_id);

-- =====================================================
-- 6. RECONCILIATION (Daily Reconciliation)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  -- Revenue
  bookings_revenue numeric(12,2) DEFAULT 0,
  bookings_count int DEFAULT 0,
  online_bookings_revenue numeric(12,2) DEFAULT 0,
  terminal_bookings_revenue numeric(12,2) DEFAULT 0,
  -- Collections
  collections_total numeric(12,2) DEFAULT 0,
  collections_count int DEFAULT 0,
  cash_collected numeric(12,2) DEFAULT 0,
  card_collected numeric(12,2) DEFAULT 0,
  mobile_money_collected numeric(12,2) DEFAULT 0,
  -- Expenses
  expenses_total numeric(12,2) DEFAULT 0,
  expenses_count int DEFAULT 0,
  -- Refunds
  refunds_total numeric(12,2) DEFAULT 0,
  refunds_count int DEFAULT 0,
  -- Calculations
  net_revenue numeric(12,2) GENERATED ALWAYS AS (bookings_revenue - refunds_total) STORED,
  net_cash numeric(12,2) GENERATED ALWAYS AS (collections_total - expenses_total) STORED,
  variance numeric(12,2) GENERATED ALWAYS AS (collections_total - bookings_revenue) STORED,
  -- Reconciliation
  is_reconciled boolean DEFAULT false,
  reconciled_by uuid REFERENCES auth.users(id),
  reconciled_at timestamptz,
  reconciliation_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reconciliation_date ON public.reconciliation(date DESC);
CREATE INDEX idx_reconciliation_status ON public.reconciliation(is_reconciled);

-- =====================================================
-- 7. FUEL LOGS (Fuel Expenses)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE fuel_status AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_log_number text UNIQUE NOT NULL, -- FUEL20251111-001
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL DEFAULT CURRENT_TIME,
  driver_id uuid NOT NULL REFERENCES public.drivers(id),
  bus_id uuid NOT NULL REFERENCES public.buses(id),
  trip_id uuid REFERENCES public.trips(id),
  station_name text NOT NULL,
  station_location text,
  odometer_reading int NOT NULL,
  liters numeric(8,2) NOT NULL CHECK (liters > 0),
  price_per_liter numeric(8,2) NOT NULL CHECK (price_per_liter > 0),
  total_cost numeric(10,2) GENERATED ALWAYS AS (liters * price_per_liter) STORED,
  payment_method payment_method,
  receipt_number text,
  receipt_url text,
  fuel_type text DEFAULT 'Diesel', -- Diesel, Petrol, etc.
  tank_filled boolean DEFAULT false,
  status fuel_status DEFAULT 'PENDING',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fuel_logs_date ON public.fuel_logs(date DESC);
CREATE INDEX idx_fuel_logs_driver ON public.fuel_logs(driver_id);
CREATE INDEX idx_fuel_logs_bus ON public.fuel_logs(bus_id);
CREATE INDEX idx_fuel_logs_trip ON public.fuel_logs(trip_id);
CREATE INDEX idx_fuel_logs_status ON public.fuel_logs(status);
CREATE INDEX idx_fuel_logs_number ON public.fuel_logs(fuel_log_number);

-- =====================================================
-- 8. BUDGET (Budget Planning)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  category expense_category NOT NULL,
  budgeted_amount numeric(12,2) NOT NULL,
  actual_amount numeric(12,2) DEFAULT 0,
  variance numeric(12,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fiscal_year, month, category)
);

CREATE INDEX idx_budgets_year_month ON public.budgets(fiscal_year, month);
CREATE INDEX idx_budgets_category ON public.budgets(category);

-- =====================================================
-- 9. FINANCIAL REPORTS (Saved Reports)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM (
    'PROFIT_LOSS',
    'BALANCE_SHEET',
    'CASH_FLOW',
    'REVENUE_ANALYSIS',
    'EXPENSE_ANALYSIS',
    'ROUTE_PERFORMANCE',
    'CUSTOM'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name text NOT NULL,
  report_type report_type NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  report_data jsonb NOT NULL,
  summary jsonb,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_financial_reports_type ON public.financial_reports(report_type);
CREATE INDEX idx_financial_reports_period ON public.financial_reports(period_start, period_end);
CREATE INDEX idx_financial_reports_generated ON public.financial_reports(generated_at DESC);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Finance tables created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_04_hr_tables.sql';
END $$;
