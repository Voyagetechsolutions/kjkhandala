-- =====================================================
-- FINANCE SYSTEM - Complete Implementation
-- Run after COMPLETE_01 through COMPLETE_11
-- =====================================================

-- =====================================================
-- 1. INCOME MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  source text NOT NULL CHECK (source IN ('ticket_sales', 'cargo', 'charter', 'commission', 'other')),
  description text,
  route_id uuid REFERENCES public.routes(id),
  reference_number text,
  amount numeric(12,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money')),
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_date ON public.income_records(date);
CREATE INDEX IF NOT EXISTS idx_income_source ON public.income_records(source);
CREATE INDEX IF NOT EXISTS idx_income_status ON public.income_records(status);

-- =====================================================
-- 2. EXPENSE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('fuel', 'maintenance', 'salaries', 'utilities', 'rent', 'insurance', 'supplies', 'marketing', 'other')),
  description text NOT NULL,
  vendor text,
  receipt_number text,
  amount numeric(12,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_date ON public.expense_records(date);
CREATE INDEX IF NOT EXISTS idx_expense_category ON public.expense_records(category);
CREATE INDEX IF NOT EXISTS idx_expense_status ON public.expense_records(status);

-- =====================================================
-- 3. FUEL LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  driver_id uuid REFERENCES public.profiles(id),
  bus_id uuid REFERENCES public.buses(id),
  route_id uuid REFERENCES public.routes(id),
  fuel_station text NOT NULL,
  quantity_liters numeric(8,2) NOT NULL,
  price_per_liter numeric(8,2) NOT NULL,
  total_cost numeric(10,2) GENERATED ALWAYS AS (quantity_liters * price_per_liter) STORED,
  odometer_reading integer,
  previous_odometer integer,
  distance_covered integer GENERATED ALWAYS AS (odometer_reading - previous_odometer) STORED,
  fuel_efficiency numeric(6,2) GENERATED ALWAYS AS (
    CASE 
      WHEN (odometer_reading - previous_odometer) > 0 
      THEN (odometer_reading - previous_odometer)::numeric / quantity_liters 
      ELSE NULL 
    END
  ) STORED,
  variance numeric(8,2) DEFAULT 0,
  receipt_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fuel_date ON public.fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_driver ON public.fuel_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_bus ON public.fuel_logs(bus_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status ON public.fuel_logs(status);

-- =====================================================
-- 4. INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  service_description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  paid_amount numeric(12,2) DEFAULT 0,
  balance numeric(12,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled')),
  payment_terms text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON public.invoices(status);

-- =====================================================
-- 5. REFUND REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  request_date timestamptz DEFAULT now(),
  booking_reference text NOT NULL,
  passenger_name text NOT NULL,
  passenger_email text,
  passenger_phone text,
  route text NOT NULL,
  travel_date date NOT NULL,
  reason text NOT NULL,
  ticket_amount numeric(10,2) NOT NULL,
  refund_percentage integer NOT NULL,
  refunded_amount numeric(10,2) NOT NULL,
  penalty_amount numeric(10,2) GENERATED ALWAYS AS (ticket_amount - refunded_amount) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money', 'original_method')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_booking ON public.refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_date ON public.refund_requests(request_date);

-- =====================================================
-- 6. BANK ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'business', 'petty_cash')),
  currency text DEFAULT 'BWP',
  balance numeric(15,2) DEFAULT 0,
  last_reconciled_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_account_status ON public.bank_accounts(status);

-- =====================================================
-- 7. BANK TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.bank_accounts(id),
  date date NOT NULL,
  description text NOT NULL,
  reference_number text,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest')),
  amount numeric(12,2) NOT NULL,
  balance_after numeric(15,2),
  category text,
  reconciled boolean DEFAULT false,
  reconciled_date date,
  reconciled_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_account ON public.bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON public.bank_transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_reconciled ON public.bank_transactions(reconciled);

-- =====================================================
-- 8. FINANCIAL VIEWS
-- =====================================================

-- Daily Revenue Summary
CREATE OR REPLACE VIEW public.daily_revenue_summary AS
SELECT 
  date,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN source = 'ticket_sales' THEN amount ELSE 0 END) as ticket_sales,
  SUM(CASE WHEN source = 'cargo' THEN amount ELSE 0 END) as cargo_revenue,
  SUM(CASE WHEN source = 'charter' THEN amount ELSE 0 END) as charter_revenue
FROM public.income_records
WHERE status = 'confirmed'
GROUP BY date
ORDER BY date DESC;

-- Daily Expense Summary
CREATE OR REPLACE VIEW public.daily_expense_summary AS
SELECT 
  date,
  SUM(amount) as total_expenses,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN category = 'fuel' THEN amount ELSE 0 END) as fuel_cost,
  SUM(CASE WHEN category = 'salaries' THEN amount ELSE 0 END) as salary_cost,
  SUM(CASE WHEN category = 'maintenance' THEN amount ELSE 0 END) as maintenance_cost
FROM public.expense_records
WHERE status IN ('approved', 'paid')
GROUP BY date
ORDER BY date DESC;

-- Monthly Profit/Loss
CREATE OR REPLACE VIEW public.monthly_profit_loss AS
SELECT 
  DATE_TRUNC('month', date) as month,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_profit
FROM (
  SELECT date, amount, 'income' as type FROM public.income_records WHERE status = 'confirmed'
  UNION ALL
  SELECT date, amount, 'expense' as type FROM public.expense_records WHERE status IN ('approved', 'paid')
) combined
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Route Profitability
CREATE OR REPLACE VIEW public.route_profitability AS
SELECT 
  r.id as route_id,
  r.origin || ' - ' || r.destination as route_name,
  COUNT(DISTINCT t.id) as total_trips,
  COALESCE(SUM(i.amount), 0) as total_revenue,
  COALESCE(SUM(f.total_cost), 0) as fuel_cost,
  COALESCE(SUM(i.amount), 0) - COALESCE(SUM(f.total_cost), 0) as gross_profit,
  CASE 
    WHEN COALESCE(SUM(i.amount), 0) > 0 
    THEN ((COALESCE(SUM(i.amount), 0) - COALESCE(SUM(f.total_cost), 0)) / COALESCE(SUM(i.amount), 0) * 100)
    ELSE 0 
  END as profit_margin
FROM public.routes r
LEFT JOIN public.trips t ON t.route_id = r.id
LEFT JOIN public.income_records i ON i.route_id = r.id
LEFT JOIN public.fuel_logs f ON f.route_id = r.id
GROUP BY r.id, r.origin, r.destination
ORDER BY gross_profit DESC;

-- Fuel Efficiency by Bus
CREATE OR REPLACE VIEW public.fuel_efficiency_by_bus AS
SELECT 
  b.id as bus_id,
  b.registration_number,
  b.model,
  COUNT(f.id) as refuel_count,
  SUM(f.quantity_liters) as total_fuel_used,
  SUM(f.total_cost) as total_fuel_cost,
  AVG(f.fuel_efficiency) as avg_fuel_efficiency,
  SUM(f.distance_covered) as total_distance
FROM public.buses b
LEFT JOIN public.fuel_logs f ON f.bus_id = b.id
WHERE f.status = 'approved'
GROUP BY b.id, b.registration_number, b.model
ORDER BY avg_fuel_efficiency DESC;

-- Outstanding Invoices
CREATE OR REPLACE VIEW public.outstanding_invoices AS
SELECT 
  id,
  invoice_number,
  date,
  due_date,
  client_name,
  amount,
  paid_amount,
  balance,
  CASE 
    WHEN due_date < CURRENT_DATE THEN 'overdue'
    WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'pending'
  END as urgency,
  CURRENT_DATE - due_date as days_overdue
FROM public.invoices
WHERE status IN ('sent', 'pending', 'overdue') AND balance > 0
ORDER BY due_date ASC;

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

-- Calculate Refund Amount based on Policy
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_travel_date date,
  p_ticket_amount numeric
)
RETURNS TABLE (
  refund_percentage integer,
  refunded_amount numeric,
  penalty_amount numeric
) AS $$
DECLARE
  days_until_travel integer;
  refund_pct integer;
BEGIN
  days_until_travel := p_travel_date - CURRENT_DATE;
  
  IF days_until_travel > 7 THEN
    refund_pct := 100;
  ELSIF days_until_travel >= 3 THEN
    refund_pct := 80;
  ELSIF days_until_travel >= 1 THEN
    refund_pct := 50;
  ELSE
    refund_pct := 0;
  END IF;
  
  RETURN QUERY SELECT 
    refund_pct,
    (p_ticket_amount * refund_pct / 100)::numeric(10,2),
    (p_ticket_amount * (100 - refund_pct) / 100)::numeric(10,2);
END;
$$ LANGUAGE plpgsql;

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  invoice_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-%';
  
  invoice_num := 'INV-' || LPAD(next_number::text, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Update Account Balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bank_accounts
    SET balance = balance + 
      CASE 
        WHEN NEW.transaction_type IN ('deposit', 'interest') THEN NEW.amount
        ELSE -NEW.amount
      END,
      updated_at = now()
    WHERE id = NEW.account_id;
    
    NEW.balance_after := (SELECT balance FROM public.bank_accounts WHERE id = NEW.account_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Auto-update invoice status based on payment
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.amount THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'pending';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_amount = 0 THEN
    NEW.status := 'overdue';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_status
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_status();

-- Auto-update account balance on transaction
CREATE TRIGGER trigger_update_account_balance
BEFORE INSERT ON public.bank_transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION auto_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION auto_invoice_number();

-- =====================================================
-- 11. RLS POLICIES
-- =====================================================

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Finance users can view all financial records
CREATE POLICY "Finance users can view income"
ON public.income_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

CREATE POLICY "Finance users can insert income"
ON public.income_records FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

-- Similar policies for other tables
CREATE POLICY "Finance users can view expenses"
ON public.expense_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

CREATE POLICY "Finance users can manage expenses"
ON public.expense_records FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

-- Drivers can view their own fuel logs
CREATE POLICY "Drivers can view own fuel logs"
ON public.fuel_logs FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

CREATE POLICY "Drivers can insert fuel logs"
ON public.fuel_logs FOR INSERT
TO authenticated
WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Finance can manage fuel logs"
ON public.fuel_logs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'finance', 'super_admin')
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refund_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;

-- Grant view access
GRANT SELECT ON public.daily_revenue_summary TO authenticated;
GRANT SELECT ON public.daily_expense_summary TO authenticated;
GRANT SELECT ON public.monthly_profit_loss TO authenticated;
GRANT SELECT ON public.route_profitability TO authenticated;
GRANT SELECT ON public.fuel_efficiency_by_bus TO authenticated;
GRANT SELECT ON public.outstanding_invoices TO authenticated;
