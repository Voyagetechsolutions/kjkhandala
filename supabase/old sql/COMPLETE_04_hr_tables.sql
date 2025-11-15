-- =====================================================
-- HR TABLES - For HR Manager Dashboard
-- Run AFTER COMPLETE_03_finance_tables.sql
-- =====================================================

-- =====================================================
-- 1. ATTENDANCE (Daily Attendance Tracking)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE','SICK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  hours_worked numeric(5,2),
  status attendance_status DEFAULT 'PRESENT',
  location text,
  notes text,
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date);

-- =====================================================
-- 2. LEAVE REQUESTS (Leave Management)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE leave_type AS ENUM (
    'ANNUAL',
    'SICK',
    'EMERGENCY',
    'MATERNITY',
    'PATERNITY',
    'BEREAVEMENT',
    'UNPAID',
    'STUDY',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_number text UNIQUE NOT NULL, -- LVE20251111-001
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested int NOT NULL,
  reason text NOT NULL,
  status leave_status DEFAULT 'PENDING',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  supporting_documents jsonb, -- Array of document URLs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_number ON public.leave_requests(leave_number);

-- =====================================================
-- 3. CERTIFICATIONS (Licenses & Certifications)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE certification_status AS ENUM ('ACTIVE','EXPIRED','REVOKED','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certification_name text NOT NULL,
  certification_type text, -- License, Certificate, Training, etc.
  issuing_authority text NOT NULL,
  certificate_number text,
  issue_date date NOT NULL,
  expiry_date date,
  file_url text,
  status certification_status DEFAULT 'ACTIVE',
  verification_status text, -- Verified, Pending, etc.
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_certifications_employee ON public.certifications(employee_id);
CREATE INDEX idx_certifications_status ON public.certifications(status);
CREATE INDEX idx_certifications_expiry ON public.certifications(expiry_date) WHERE status = 'ACTIVE';

-- =====================================================
-- 4. JOB POSTINGS (Recruitment)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('FULL_TIME','PART_TIME','CONTRACT','TEMPORARY','INTERNSHIP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('DRAFT','ACTIVE','CLOSED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number text UNIQUE NOT NULL, -- JOB20251111-001
  title text NOT NULL,
  department text NOT NULL,
  position text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  responsibilities text,
  qualifications text,
  salary_range text,
  location text NOT NULL,
  employment_type employment_type NOT NULL,
  vacancies int DEFAULT 1,
  status job_status DEFAULT 'DRAFT',
  posted_date date,
  closing_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_department ON public.job_postings(department);
CREATE INDEX idx_job_postings_closing ON public.job_postings(closing_date);
CREATE INDEX idx_job_postings_number ON public.job_postings(job_number);

-- =====================================================
-- 5. JOB APPLICATIONS (Applications)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'SUBMITTED',
    'SCREENING',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'OFFER_MADE',
    'HIRED',
    'REJECTED',
    'WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text UNIQUE NOT NULL, -- APP20251111-001
  job_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  resume_url text NOT NULL,
  cover_letter text,
  qualifications jsonb, -- Array of qualifications
  experience_years int,
  current_employer text,
  expected_salary text,
  availability_date date,
  status application_status DEFAULT 'SUBMITTED',
  rating numeric(3,2), -- 0.00 to 5.00
  interview_date timestamptz,
  interview_notes text,
  rejection_reason text,
  notes text,
  applied_date date DEFAULT CURRENT_DATE,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_email ON public.job_applications(email);
CREATE INDEX idx_job_applications_number ON public.job_applications(application_number);

-- =====================================================
-- 6. PERFORMANCE EVALUATIONS (Reviews)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM ('DRAFT','SUBMITTED','REVIEWED','APPROVED','COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.performance_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_number text UNIQUE NOT NULL, -- EVAL20251111-001
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id),
  evaluation_period text NOT NULL, -- Q1 2024, Annual 2024, etc.
  evaluation_date date NOT NULL,
  overall_rating numeric(3,2) NOT NULL CHECK (overall_rating BETWEEN 0 AND 5),
  performance_areas jsonb, -- Array of {area, rating, comments}
  goals_achieved text,
  areas_for_improvement text,
  strengths text,
  weaknesses text,
  development_plan text,
  training_recommendations text,
  salary_recommendation text,
  promotion_recommendation boolean DEFAULT false,
  comments text,
  status evaluation_status DEFAULT 'DRAFT',
  employee_acknowledgement boolean DEFAULT false,
  employee_comments text,
  acknowledged_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_performance_evaluations_employee ON public.performance_evaluations(employee_id);
CREATE INDEX idx_performance_evaluations_evaluator ON public.performance_evaluations(evaluator_id);
CREATE INDEX idx_performance_evaluations_status ON public.performance_evaluations(status);
CREATE INDEX idx_performance_evaluations_date ON public.performance_evaluations(evaluation_date DESC);
CREATE INDEX idx_performance_evaluations_number ON public.performance_evaluations(evaluation_number);

-- =====================================================
-- 7. PAYROLL (Salary Processing)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM ('DRAFT','PENDING','APPROVED','PAID','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_number text UNIQUE NOT NULL, -- PAY20251111-001
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month text NOT NULL, -- YYYY-MM format
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  -- Earnings
  basic_salary numeric(10,2) NOT NULL,
  overtime_hours numeric(5,2) DEFAULT 0,
  overtime_rate numeric(8,2) DEFAULT 0,
  overtime_pay numeric(10,2) DEFAULT 0,
  allowances numeric(10,2) DEFAULT 0,
  bonuses numeric(10,2) DEFAULT 0,
  commissions numeric(10,2) DEFAULT 0,
  gross_salary numeric(10,2) NOT NULL,
  -- Deductions
  tax numeric(10,2) DEFAULT 0,
  pension numeric(10,2) DEFAULT 0,
  health_insurance numeric(10,2) DEFAULT 0,
  loans numeric(10,2) DEFAULT 0,
  other_deductions numeric(10,2) DEFAULT 0,
  total_deductions numeric(10,2) DEFAULT 0,
  -- Net
  net_salary numeric(10,2) GENERATED ALWAYS AS (gross_salary - total_deductions) STORED,
  -- Attendance
  days_worked int,
  days_absent int,
  days_on_leave int,
  -- Payment
  status payroll_status DEFAULT 'DRAFT',
  payment_method payment_method,
  payment_reference text,
  pay_date date,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month)
);

CREATE INDEX idx_payroll_employee ON public.payroll(employee_id);
CREATE INDEX idx_payroll_month ON public.payroll(month DESC);
CREATE INDEX idx_payroll_status ON public.payroll(status);
CREATE INDEX idx_payroll_number ON public.payroll(payroll_number);

-- =====================================================
-- 8. SHIFTS (Shift Scheduling)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('MORNING','AFTERNOON','EVENING','NIGHT','SPLIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('SCHEDULED','CONFIRMED','STARTED','COMPLETED','CANCELLED','NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift_type shift_type NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  break_duration_minutes int DEFAULT 0,
  location text,
  status shift_status DEFAULT 'SCHEDULED',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shifts_employee ON public.shifts(employee_id);
CREATE INDEX idx_shifts_date ON public.shifts(date DESC);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_shifts_employee_date ON public.shifts(employee_id, date);

-- =====================================================
-- 9. EMPLOYEE DOCUMENTS (Document Management)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'ID_COPY',
    'CONTRACT',
    'CERTIFICATE',
    'RESUME',
    'REFERENCE',
    'MEDICAL',
    'POLICE_CLEARANCE',
    'BANK_DETAILS',
    'TAX_FORM',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('PENDING','VERIFIED','APPROVED','REJECTED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_name text NOT NULL,
  document_number text,
  file_url text NOT NULL,
  file_size int, -- bytes
  file_type text, -- pdf, jpg, etc.
  issue_date date,
  expiry_date date,
  status document_status DEFAULT 'PENDING',
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_employee_documents_employee ON public.employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON public.employee_documents(document_type);
CREATE INDEX idx_employee_documents_status ON public.employee_documents(status);
CREATE INDEX idx_employee_documents_expiry ON public.employee_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- 10. TRAINING PROGRAMS (Training Management)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE training_status AS ENUM ('PLANNED','ONGOING','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_number text UNIQUE NOT NULL, -- TRN20251111-001
  title text NOT NULL,
  description text,
  trainer_name text,
  location text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_hours numeric(5,2),
  max_participants int,
  cost_per_participant numeric(10,2),
  total_cost numeric(10,2),
  status training_status DEFAULT 'PLANNED',
  materials_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_training_programs_status ON public.training_programs(status);
CREATE INDEX idx_training_programs_dates ON public.training_programs(start_date, end_date);
CREATE INDEX idx_training_programs_number ON public.training_programs(training_number);

-- =====================================================
-- 11. TRAINING PARTICIPANTS (Training Enrollment)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE participation_status AS ENUM ('ENROLLED','ATTENDED','COMPLETED','ABSENT','WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.training_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status participation_status DEFAULT 'ENROLLED',
  attendance_percentage numeric(5,2),
  assessment_score numeric(5,2),
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  feedback text,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(training_id, employee_id)
);

CREATE INDEX idx_training_participants_training ON public.training_participants(training_id);
CREATE INDEX idx_training_participants_employee ON public.training_participants(employee_id);
CREATE INDEX idx_training_participants_status ON public.training_participants(status);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ HR tables created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_05_maintenance_tables.sql';
END $$;
