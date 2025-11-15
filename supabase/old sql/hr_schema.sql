-- HR module tables for Supabase

-- Attendance tracking
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  hours_worked numeric,
  status text default 'present', -- present, absent, late, half_day
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, date)
);

-- Leave requests
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  leave_type text not null, -- annual, sick, emergency, maternity, etc
  start_date date not null,
  end_date date not null,
  days_requested integer,
  reason text,
  status text default 'pending', -- pending, approved, rejected
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Certifications
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  name text not null,
  issuing_authority text,
  issue_date date,
  expiry_date date,
  certificate_number text,
  file_url text,
  status text default 'active', -- active, expired, revoked
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job postings
create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  position text,
  description text,
  requirements text,
  salary_range text,
  location text,
  employment_type text, -- full_time, part_time, contract
  status text default 'active', -- active, closed, draft
  created_by uuid references profiles(id),
  posted_date date default current_date,
  closing_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job applications
create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references job_postings(id),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  resume_url text,
  cover_letter text,
  status text default 'submitted', -- submitted, reviewed, interviewed, hired, rejected
  notes text,
  applied_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Performance evaluations
create table if not exists performance_evaluations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  evaluator_id uuid references profiles(id),
  evaluation_period text, -- Q1 2024, Annual 2024, etc
  overall_rating numeric, -- 1-5 scale
  goals_achieved text,
  areas_improvement text,
  strengths text,
  development_plan text,
  comments text,
  status text default 'draft', -- draft, completed, approved
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payroll records
create table if not exists payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  month text not null, -- YYYY-MM format
  gross_salary numeric not null,
  deductions numeric default 0,
  net_salary numeric generated always as (gross_salary - deductions) stored,
  days_worked integer,
  total_hours numeric,
  overtime_hours numeric default 0,
  overtime_rate numeric default 0,
  allowances numeric default 0,
  tax numeric default 0,
  status text default 'pending', -- pending, paid, cancelled
  processed_by uuid references profiles(id),
  processed_at timestamptz,
  pay_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, month)
);

-- Employee shifts
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  date date not null,
  shift_type text not null, -- morning, afternoon, night, split
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'scheduled', -- scheduled, started, completed, cancelled
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employee documents
create table if not exists employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id),
  document_type text not null, -- id_copy, contract, certificate, etc
  document_number text,
  file_url text not null,
  expiry_date date,
  status text default 'pending', -- pending, approved, rejected, expired
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table attendance enable row level security;
alter table leave_requests enable row level security;
alter table certifications enable row level security;
alter table job_postings enable row level security;
alter table job_applications enable row level security;
alter table performance_evaluations enable row level security;
alter table payroll enable row level security;
alter table shifts enable row level security;
alter table employee_documents enable row level security;

-- Simple RLS policies
create policy "hr_select_all_attendance" on attendance for select using (true);
create policy "hr_select_all_leave" on leave_requests for select using (true);
create policy "hr_select_all_certs" on certifications for select using (true);
create policy "hr_select_all_jobs" on job_postings for select using (true);
create policy "hr_select_all_apps" on job_applications for select using (true);
create policy "hr_select_all_evals" on performance_evaluations for select using (true);
create policy "hr_select_all_payroll" on payroll for select using (true);
create policy "hr_select_all_shifts" on shifts for select using (true);
create policy "hr_select_all_docs" on employee_documents for select using (true);
