-- =====================================================
-- HR DASHBOARD ENHANCEMENTS - Complete Implementation
-- Run after COMPLETE_01 through COMPLETE_10
-- =====================================================

-- =====================================================
-- 1. ATTENDANCE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  work_hours numeric(4,2),
  overtime_hours numeric(4,2) DEFAULT 0,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- =====================================================
-- 2. PAYROLL ENHANCEMENTS
-- =====================================================

-- Enhance existing payroll table or create if not exists
CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  basic_salary numeric(10,2) NOT NULL,
  allowances numeric(10,2) DEFAULT 0,
  bonuses numeric(10,2) DEFAULT 0,
  deductions numeric(10,2) DEFAULT 0,
  gross_pay numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + bonuses) STORED,
  net_salary numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + bonuses - deductions) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  payment_date date,
  payment_method text CHECK (payment_method IN ('bank_transfer', 'cash', 'cheque', 'mobile_money')),
  payment_reference text,
  created_by uuid REFERENCES auth.users(id),
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);

-- Payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id uuid REFERENCES public.payroll(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  payslip_number text UNIQUE NOT NULL,
  pdf_url text,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  downloaded boolean DEFAULT false,
  downloaded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslips_payroll ON public.payslips(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_number ON public.payslips(payslip_number);

-- =====================================================
-- 3. PERFORMANCE EVALUATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES public.profiles(id),
  evaluation_period_start date NOT NULL,
  evaluation_period_end date NOT NULL,
  overall_rating numeric(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  attendance_score numeric(3,2) CHECK (attendance_score >= 0 AND attendance_score <= 5),
  quality_of_work_score numeric(3,2) CHECK (quality_of_work_score >= 0 AND quality_of_work_score <= 5),
  teamwork_score numeric(3,2) CHECK (teamwork_score >= 0 AND teamwork_score <= 5),
  communication_score numeric(3,2) CHECK (communication_score >= 0 AND communication_score <= 5),
  punctuality_score numeric(3,2) CHECK (punctuality_score >= 0 AND punctuality_score <= 5),
  initiative_score numeric(3,2) CHECK (initiative_score >= 0 AND initiative_score <= 5),
  strengths text,
  areas_for_improvement text,
  goals text,
  comments text,
  employee_comments text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged', 'disputed')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_employee ON public.performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluator ON public.performance_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_performance_period ON public.performance_evaluations(evaluation_period_start, evaluation_period_end);
CREATE INDEX IF NOT EXISTS idx_performance_status ON public.performance_evaluations(status);

-- =====================================================
-- 4. CERTIFICATIONS ENHANCEMENTS
-- =====================================================

-- Enhance existing certifications table or create if not exists
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_type text NOT NULL CHECK (certificate_type IN ('license', 'medical', 'contract', 'training', 'certification', 'other')),
  certificate_name text NOT NULL,
  certificate_number text,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  document_url text,
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'renewed', 'revoked')),
  notes text,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certifications_employee ON public.certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON public.certifications(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON public.certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications(status);

-- =====================================================
-- 5. LEAVE MANAGEMENT ENHANCEMENTS
-- =====================================================

-- Enhance existing leave_requests table or create if not exists
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'bereavement', 'study')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested int GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'withdrawn')),
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_type ON public.leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON public.leave_requests(start_date, end_date);

-- Leave balance tracking
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  year int NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'bereavement', 'study')),
  total_days numeric(5,2) NOT NULL DEFAULT 0,
  used_days numeric(5,2) DEFAULT 0,
  remaining_days numeric(5,2) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, year, leave_type)
);

CREATE INDEX IF NOT EXISTS idx_leave_balance_employee ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_year ON public.leave_balances(year);

-- =====================================================
-- 6. RECRUITMENT & JOB POSTINGS
-- =====================================================

-- Job postings table (enhance if exists)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  location text,
  employment_type text CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
  description text,
  requirements text,
  responsibilities text,
  qualifications text,
  salary_range text,
  benefits text,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'filled', 'cancelled')),
  posted_date date DEFAULT CURRENT_DATE,
  closing_date date,
  positions_available int DEFAULT 1,
  positions_filled int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON public.job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_date ON public.job_postings(posted_date);

-- Job applications table (enhance if exists)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text,
  applicant_address text,
  resume_url text,
  cover_letter text,
  linkedin_url text,
  portfolio_url text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  applied_date timestamptz DEFAULT now(),
  interview_date timestamptz,
  interview_notes text,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON public.job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications(applicant_email);

-- =====================================================
-- 7. VIEWS FOR HR REPORTING
-- =====================================================

-- View: Employee headcount by department
CREATE OR REPLACE VIEW hr_headcount_by_department AS
SELECT
  COALESCE(p.department, 'Unassigned') as department,
  COUNT(*) as total_employees,
  COUNT(*) FILTER (WHERE p.status = 'active') as active_employees,
  COUNT(*) FILTER (WHERE p.status = 'on_leave') as on_leave,
  COUNT(*) FILTER (WHERE p.status = 'terminated') as terminated
FROM public.profiles p
WHERE p.employee_id IS NOT NULL
GROUP BY p.department;

-- View: Attendance summary
CREATE OR REPLACE VIEW hr_attendance_summary AS
SELECT
  DATE(a.date) as attendance_date,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE a.status = 'present') as present,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent,
  COUNT(*) FILTER (WHERE a.status = 'late') as late,
  COUNT(*) FILTER (WHERE a.status = 'half_day') as half_day,
  ROUND(AVG(a.work_hours), 2) as avg_work_hours,
  ROUND(SUM(a.overtime_hours), 2) as total_overtime
FROM public.attendance a
GROUP BY DATE(a.date)
ORDER BY attendance_date DESC;

-- View: Leave summary
CREATE OR REPLACE VIEW hr_leave_summary AS
SELECT
  lr.leave_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE lr.status = 'pending') as pending,
  COUNT(*) FILTER (WHERE lr.status = 'approved') as approved,
  COUNT(*) FILTER (WHERE lr.status = 'rejected') as rejected,
  SUM(lr.days_requested) FILTER (WHERE lr.status = 'approved') as total_days_approved
FROM public.leave_requests lr
GROUP BY lr.leave_type;

-- View: Payroll summary
CREATE OR REPLACE VIEW hr_payroll_summary AS
SELECT
  DATE_TRUNC('month', p.period_start) as payroll_month,
  COUNT(*) as total_payroll_records,
  SUM(p.basic_salary) as total_basic_salary,
  SUM(p.allowances) as total_allowances,
  SUM(p.bonuses) as total_bonuses,
  SUM(p.deductions) as total_deductions,
  SUM(p.gross_pay) as total_gross_pay,
  SUM(p.net_salary) as total_net_salary,
  COUNT(*) FILTER (WHERE p.status = 'processed') as processed_count,
  COUNT(*) FILTER (WHERE p.status = 'paid') as paid_count
FROM public.payroll p
GROUP BY DATE_TRUNC('month', p.period_start)
ORDER BY payroll_month DESC;

-- View: Performance evaluation summary
CREATE OR REPLACE VIEW hr_performance_summary AS
SELECT
  DATE_TRUNC('quarter', pe.evaluation_period_start) as evaluation_quarter,
  COUNT(*) as total_evaluations,
  ROUND(AVG(pe.overall_rating), 2) as avg_overall_rating,
  ROUND(AVG(pe.attendance_score), 2) as avg_attendance_score,
  ROUND(AVG(pe.quality_of_work_score), 2) as avg_quality_score,
  ROUND(AVG(pe.teamwork_score), 2) as avg_teamwork_score,
  COUNT(*) FILTER (WHERE pe.status = 'acknowledged') as completed_evaluations
FROM public.performance_evaluations pe
GROUP BY DATE_TRUNC('quarter', pe.evaluation_period_start)
ORDER BY evaluation_quarter DESC;

-- View: Compliance & certifications status
CREATE OR REPLACE VIEW hr_compliance_status AS
SELECT
  c.certificate_type,
  COUNT(*) as total_certificates,
  COUNT(*) FILTER (WHERE c.status = 'valid') as valid,
  COUNT(*) FILTER (WHERE c.status = 'expiring_soon') as expiring_soon,
  COUNT(*) FILTER (WHERE c.status = 'expired') as expired,
  COUNT(*) FILTER (WHERE c.expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_next_30_days
FROM public.certifications c
GROUP BY c.certificate_type;

-- View: Recruitment pipeline
CREATE OR REPLACE VIEW hr_recruitment_pipeline AS
SELECT
  jp.title as job_title,
  jp.department,
  jp.status as job_status,
  COUNT(ja.id) as total_applications,
  COUNT(ja.id) FILTER (WHERE ja.status = 'received') as received,
  COUNT(ja.id) FILTER (WHERE ja.status = 'screening') as screening,
  COUNT(ja.id) FILTER (WHERE ja.status = 'shortlisted') as shortlisted,
  COUNT(ja.id) FILTER (WHERE ja.status = 'interview') as interview,
  COUNT(ja.id) FILTER (WHERE ja.status = 'offer') as offer,
  COUNT(ja.id) FILTER (WHERE ja.status = 'hired') as hired,
  COUNT(ja.id) FILTER (WHERE ja.status = 'rejected') as rejected
FROM public.job_postings jp
LEFT JOIN public.job_applications ja ON jp.id = ja.job_posting_id
GROUP BY jp.id, jp.title, jp.department, jp.status;

-- =====================================================
-- 8. FUNCTIONS FOR HR OPERATIONS
-- =====================================================

-- Function: Calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours(
  p_check_in timestamptz,
  p_check_out timestamptz
)
RETURNS numeric AS $$
DECLARE
  v_hours numeric;
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL THEN
    RETURN 0;
  END IF;
  
  v_hours := EXTRACT(EPOCH FROM (p_check_out - p_check_in)) / 3600;
  RETURN ROUND(v_hours, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate overtime hours
CREATE OR REPLACE FUNCTION calculate_overtime_hours(
  p_work_hours numeric,
  p_standard_hours numeric DEFAULT 8
)
RETURNS numeric AS $$
BEGIN
  IF p_work_hours > p_standard_hours THEN
    RETURN ROUND(p_work_hours - p_standard_hours, 2);
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate payslip number
CREATE OR REPLACE FUNCTION generate_payslip_number()
RETURNS text AS $$
DECLARE
  v_date text;
  v_sequence int;
  v_number text;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(payslip_number FROM 8) AS int)
  ), 0) + 1
  INTO v_sequence
  FROM public.payslips
  WHERE payslip_number LIKE 'PS' || v_date || '%';
  
  v_number := 'PS' || v_date || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Update leave balance
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Deduct from leave balance
    UPDATE public.leave_balances
    SET used_days = used_days + NEW.days_requested,
        updated_at = now()
    WHERE employee_id = NEW.employee_id
      AND year = EXTRACT(YEAR FROM NEW.start_date)
      AND leave_type = NEW.leave_type;
      
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    -- Restore to leave balance
    UPDATE public.leave_balances
    SET used_days = used_days - NEW.days_requested,
        updated_at = now()
    WHERE employee_id = NEW.employee_id
      AND year = EXTRACT(YEAR FROM NEW.start_date)
      AND leave_type = NEW.leave_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update certification status based on expiry
CREATE OR REPLACE FUNCTION update_certification_status()
RETURNS void AS $$
BEGIN
  -- Mark as expired
  UPDATE public.certifications
  SET status = 'expired',
      updated_at = now()
  WHERE expiry_date < CURRENT_DATE
    AND status != 'expired';
  
  -- Mark as expiring soon (30 days)
  UPDATE public.certifications
  SET status = 'expiring_soon',
      updated_at = now()
  WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND status = 'valid';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Trigger: Auto-calculate work hours on attendance
CREATE OR REPLACE FUNCTION auto_calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.work_hours := calculate_work_hours(NEW.check_in_time, NEW.check_out_time);
    NEW.overtime_hours := calculate_overtime_hours(NEW.work_hours);
    
    -- Determine status based on check-in time
    IF EXTRACT(HOUR FROM NEW.check_in_time) > 9 THEN
      NEW.status := 'late';
    ELSIF NEW.work_hours < 4 THEN
      NEW.status := 'half_day';
    ELSE
      NEW.status := 'present';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calculate_attendance ON public.attendance;
CREATE TRIGGER trigger_auto_calculate_attendance
  BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_attendance_hours();

-- Trigger: Update leave balance on approval
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON public.leave_requests;
CREATE TRIGGER trigger_update_leave_balance
  AFTER INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance();

-- Trigger: Auto-generate payslip number
CREATE OR REPLACE FUNCTION auto_generate_payslip_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payslip_number IS NULL OR NEW.payslip_number = '' THEN
    NEW.payslip_number := generate_payslip_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_payslip_number ON public.payslips;
CREATE TRIGGER trigger_auto_payslip_number
  BEFORE INSERT ON public.payslips
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_payslip_number();

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant access to HR managers and admins
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payroll TO authenticated;
GRANT SELECT, INSERT ON public.payslips TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.performance_evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_postings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;

-- Grant access to views
GRANT SELECT ON hr_headcount_by_department TO authenticated;
GRANT SELECT ON hr_attendance_summary TO authenticated;
GRANT SELECT ON hr_leave_summary TO authenticated;
GRANT SELECT ON hr_payroll_summary TO authenticated;
GRANT SELECT ON hr_performance_summary TO authenticated;
GRANT SELECT ON hr_compliance_status TO authenticated;
GRANT SELECT ON hr_recruitment_pipeline TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_work_hours(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overtime_hours(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_payslip_number() TO authenticated;
GRANT EXECUTE ON FUNCTION update_certification_status() TO authenticated;

-- =====================================================
-- 11. COMMENTS
-- =====================================================

COMMENT ON TABLE public.attendance IS 'Employee attendance tracking with check-in/out times';
COMMENT ON TABLE public.payroll IS 'Employee payroll records with salary breakdown';
COMMENT ON TABLE public.payslips IS 'Generated payslips for employees';
COMMENT ON TABLE public.performance_evaluations IS 'Employee performance evaluation records';
COMMENT ON TABLE public.certifications IS 'Employee certificates, licenses, and compliance documents';
COMMENT ON TABLE public.leave_requests IS 'Employee leave requests and approvals';
COMMENT ON TABLE public.leave_balances IS 'Employee leave balance tracking by year';
COMMENT ON TABLE public.job_postings IS 'Job postings for recruitment';
COMMENT ON TABLE public.job_applications IS 'Applications received for job postings';

COMMENT ON VIEW hr_headcount_by_department IS 'Employee headcount breakdown by department';
COMMENT ON VIEW hr_attendance_summary IS 'Daily attendance summary with statistics';
COMMENT ON VIEW hr_leave_summary IS 'Leave requests summary by type';
COMMENT ON VIEW hr_payroll_summary IS 'Monthly payroll summary with totals';
COMMENT ON VIEW hr_performance_summary IS 'Quarterly performance evaluation summary';
COMMENT ON VIEW hr_compliance_status IS 'Compliance and certification status overview';
COMMENT ON VIEW hr_recruitment_pipeline IS 'Recruitment pipeline with application stages';
