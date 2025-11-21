-- ============================================================================
-- PRODUCTION SCHEMA PART 4: HR TABLES
-- Employees, Attendance, Leave, Payroll
-- ============================================================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE NOT NULL,
  employment_type employment_type DEFAULT 'full_time',
  employment_status employment_status DEFAULT 'active',
  salary NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  UNIQUE(employee_id, leave_type, year)
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary NUMERIC(12, 2) NOT NULL,
  allowances NUMERIC(12, 2) DEFAULT 0,
  deductions NUMERIC(12, 2) DEFAULT 0,
  gross_salary NUMERIC(12, 2) NOT NULL,
  net_salary NUMERIC(12, 2) NOT NULL,
  tax NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  salary NUMERIC(12, 2),
  terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Evaluations
CREATE TABLE IF NOT EXISTS performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  overall_rating NUMERIC(3, 2),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_employee ON performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance_evaluations(evaluation_date DESC);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_employee ON certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(expiry_date);

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type employment_type DEFAULT 'full_time',
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
