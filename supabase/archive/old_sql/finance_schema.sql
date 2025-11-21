-- Additional finance-related tables for Supabase migration

-- Invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique,
  date timestamptz default now(),
  client text,
  client_email text,
  description text,
  amount numeric default 0,
  paid numeric default 0,
  balance numeric default 0,
  due_date timestamptz,
  status text default 'pending',
  items jsonb,
  notes text,
  created_by uuid references profiles(id),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Refunds
create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid,
  booking_ref text,
  request_date timestamptz default now(),
  passenger text,
  passenger_email text,
  route text,
  travel_date timestamptz,
  ticket_amount numeric,
  requested_amount numeric,
  amount numeric,
  approved_amount numeric,
  penalty numeric default 0,
  reason text,
  status text default 'pending',
  processed_by uuid references profiles(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Accounts
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text,
  bank text,
  account_number text unique,
  balance numeric default 0,
  type text,
  last_reconciled timestamptz,
  status text default 'active',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Collections (cash collections)
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  amount numeric not null,
  source text not null,
  collected_by uuid references profiles(id),
  notes text,
  status text default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reconciliation per date
create table if not exists reconciliation (
  date date primary key,
  bookings_revenue numeric default 0,
  bookings_count int default 0,
  collections_total numeric default 0,
  collections_count int default 0,
  expenses_total numeric default 0,
  expenses_count int default 0,
  net_cash numeric default 0,
  reconciled boolean default false,
  reconciled_by uuid references profiles(id),
  reconciled_at timestamptz
);

-- Fuel logs (basic)
create table if not exists fuel_logs (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  driver_id uuid references drivers(id),
  bus_id uuid references buses(id),
  station text,
  liters numeric,
  price_per_liter numeric,
  total_cost numeric,
  status text default 'PENDING',
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS hooks
alter table invoices enable row level security;
alter table refunds enable row level security;
alter table accounts enable row level security;
alter table collections enable row level security;
alter table reconciliation enable row level security;
alter table fuel_logs enable row level security;

-- Simple RLS (adjust as needed)
create policy "finance_select_all" on invoices for select using (true);
create policy "finance_select_all_refunds" on refunds for select using (true);
create policy "finance_select_all_accounts" on accounts for select using (true);
create policy "finance_select_all_collections" on collections for select using (true);
create policy "finance_select_all_recon" on reconciliation for select using (true);
create policy "finance_select_all_fuel" on fuel_logs for select using (true);
