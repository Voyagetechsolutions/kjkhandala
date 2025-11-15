# 🎯 HR Dashboard Enhancement Plan

## Overview
Comprehensive plan to enhance the HR Dashboard with real-time data, advanced features, and seamless integration between Admin and HR dashboards.

---

## ✅ Phase 1: HR Dashboard Home Page (CURRENT)

### 1.1 Real-Time Data Integration
**Status:** ✅ Already Implemented
- Total Employees (from profiles table)
- Active Employees (status = 'active')
- On Leave (status = 'on_leave')
- Terminated (status = 'terminated')

### 1.2 Staff by Department
**Status:** ✅ Already Implemented
- Dynamic department breakdown
- Percentage calculation
- Visual progress bars

### 1.3 Remove Mock Data
**Status:** 🔄 In Progress
**Location:** `HRDashboard.tsx` lines 360-373
**Action:** Replace with calculated retention/turnover rates from employee data

**Implementation:**
```typescript
// Calculate from employee data
const thisYear = new Date().getFullYear();
const startOfYear = new Date(thisYear, 0, 1);

const employeesAtStart = employees.filter(e => 
  new Date(e.hire_date) < startOfYear
).length;

const terminated = employees.filter(e => 
  e.status === 'terminated' && 
  new Date(e.termination_date) >= startOfYear
).length;

const turnoverRate = employeesAtStart > 0 
  ? ((terminated / employeesAtStart) * 100).toFixed(1)
  : '0.0';

const retentionRate = (100 - parseFloat(turnoverRate)).toFixed(1);

const avgTenure = employees
  .filter(e => e.hire_date)
  .reduce((sum, e) => {
    const years = (new Date().getTime() - new Date(e.hire_date).getTime()) / (365 * 24 * 60 * 60 * 1000);
    return sum + years;
  }, 0) / employees.length;
```

---

## 📋 Phase 2: Attendance Management

### 2.1 Features Required
- ✅ Employee dropdown (name + ID)
- ✅ Check-in time
- ✅ Check-out time
- ✅ Work hours (auto-calculated)
- ✅ Overtime (auto-calculated if > 8 hours)
- ✅ Status (Present, Absent, Late, Half-day)
- ✅ Available on both Admin and HR dashboards

### 2.2 Database Schema
**Table:** `attendance`
```sql
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id),
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  work_hours numeric(4,2),
  overtime_hours numeric(4,2) DEFAULT 0,
  status text CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);
```

### 2.3 UI Components
**File:** `frontend/src/pages/hr/Attendance.tsx`
- Employee selector with search
- Date picker
- Time pickers for check-in/check-out
- Auto-calculation of hours
- Status badges
- Attendance history table

---

## 💰 Phase 3: Payroll Management Enhancement

### 3.1 Features Required
- ✅ "Add to Payroll" button
- ✅ Employee selection
- ✅ Fields: Name, Department, Basic Salary, Allowances, Bonuses, Deductions, Net Salary
- ✅ "Run Payroll" button (batch process)
- ✅ Generate payslips
- ✅ Email/Download payslips

### 3.2 Database Schema
**Table:** `payroll`
```sql
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  basic_salary numeric(10,2) NOT NULL,
  allowances numeric(10,2) DEFAULT 0,
  bonuses numeric(10,2) DEFAULT 0,
  deductions numeric(10,2) DEFAULT 0,
  gross_pay numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + bonuses) STORED,
  net_salary numeric(10,2) GENERATED ALWAYS AS (basic_salary + allowances + bonuses - deductions) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  payment_date date,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Table:** `payslips`
```sql
CREATE TABLE IF NOT EXISTS payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id uuid REFERENCES payroll(id),
  employee_id uuid REFERENCES profiles(id),
  payslip_number text UNIQUE NOT NULL,
  pdf_url text,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 3.3 UI Components
**Enhancements to:** `frontend/src/pages/hr/HRPayroll.tsx`
- "Add to Payroll" dialog
- "Run Payroll" button with confirmation
- Payslip generation modal
- Email/Download actions
- Payroll history table

---

## 📊 Phase 4: Performance Evaluation

### 4.1 Features Required
- ✅ Employee selection
- ✅ Evaluation period
- ✅ Performance metrics (KPIs)
- ✅ Rating system (1-5 stars or percentage)
- ✅ Comments/feedback
- ✅ Goals and objectives
- ✅ Performance history

### 4.2 Database Schema
**Table:** `performance_evaluations`
```sql
CREATE TABLE IF NOT EXISTS performance_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id),
  evaluator_id uuid REFERENCES profiles(id),
  evaluation_period_start date NOT NULL,
  evaluation_period_end date NOT NULL,
  overall_rating numeric(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  attendance_score numeric(3,2),
  quality_of_work_score numeric(3,2),
  teamwork_score numeric(3,2),
  communication_score numeric(3,2),
  punctuality_score numeric(3,2),
  strengths text,
  areas_for_improvement text,
  goals text,
  comments text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4.3 UI Components
**File:** `frontend/src/pages/hr/Performance.tsx`
- Employee selector
- Period selector
- Rating sliders/stars for each metric
- Text areas for feedback
- Goals management
- Performance history chart

---

## 📜 Phase 5: Compliance & Certificates

### 5.1 Features Required
- ✅ Certificate tracking (licenses, medical, contracts)
- ✅ Expiry date monitoring
- ✅ Automatic alerts (30 days before expiry)
- ✅ Upload certificate documents
- ✅ Manual or automatic data entry

### 5.2 Database Schema
**Table:** `certifications` (Already exists, enhance if needed)
```sql
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id),
  certificate_type text NOT NULL CHECK (certificate_type IN ('license', 'medical', 'contract', 'training', 'other')),
  certificate_name text NOT NULL,
  certificate_number text,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  document_url text,
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'renewed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5.3 UI Components
**Enhancements to:** `frontend/src/pages/hr/Compliance.tsx`
- Add certificate dialog
- Document upload
- Expiry alerts
- Renewal workflow
- Certificate history

---

## 🏖️ Phase 6: Leave Management

### 6.1 Features Required
- ✅ Leave request form
- ✅ Employee name
- ✅ Leave type (Annual, Sick, Emergency, Unpaid)
- ✅ Start date, End date
- ✅ Number of days (auto-calculated)
- ✅ Reason
- ✅ Status (Pending, Approved, Rejected)
- ✅ Actions (Approve, Reject)

### 6.2 Database Schema
**Table:** `leave_requests`
```sql
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id),
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested int GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6.3 UI Components
**Enhancements to:** `frontend/src/pages/hr/Leave.tsx`
- Leave request form
- Leave type selector
- Date range picker
- Days calculator
- Approval workflow
- Leave balance tracker

---

## 📈 Phase 7: HR Reporting & Analytics

### 7.1 Reports Required
1. **Headcount Report**
   - Total employees
   - By department
   - By status
   - Trend over time

2. **Attendance Report**
   - Attendance rate
   - Absenteeism rate
   - Late arrivals
   - By department/employee

3. **Leave Report**
   - Leave taken
   - Leave balance
   - Leave trends
   - By type/department

4. **Turnover Report**
   - Turnover rate
   - Retention rate
   - Reasons for leaving
   - By department

5. **Performance Report**
   - Average ratings
   - Top performers
   - Performance trends
   - By department

6. **Compliance Report**
   - Expiring certificates
   - Expired certificates
   - Compliance rate
   - By type

7. **Payroll Summary**
   - Total payroll cost
   - By department
   - Overtime costs
   - Trends

8. **Recruitment Report**
   - Active jobs
   - Applications received
   - Interviews conducted
   - Hires made
   - Time to hire

### 7.2 Features
- ✅ Period selector (Weekly, Monthly, Quarterly, Annually, Custom)
- ✅ Export to PDF
- ✅ Export to Excel
- ✅ Report preview
- ✅ Charts and visualizations

### 7.3 UI Components
**File:** `frontend/src/pages/hr/HRReports.tsx`
- Report type selector
- Period selector
- Filter options
- Chart visualizations
- Export buttons
- Report preview

---

## 🌐 Phase 8: Careers Page (Website Integration)

### 8.1 Features Required
- ✅ Public careers page on main website
- ✅ Auto-updates with job posts from Admin dashboard
- ✅ Job listing with details
- ✅ Application form
- ✅ Application tracking

### 8.2 Database Schema
**Table:** `job_postings`
```sql
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  location text,
  employment_type text CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  description text,
  requirements text,
  responsibilities text,
  salary_range text,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'filled')),
  posted_date date DEFAULT CURRENT_DATE,
  closing_date date,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Table:** `job_applications`
```sql
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid REFERENCES job_postings(id),
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  applied_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 8.3 UI Components
**Public Page:** `frontend/src/pages/public/Careers.tsx`
- Job listings
- Job details
- Application form
- File upload for resume

**Admin Page:** `frontend/src/pages/hr/Recruitment.tsx` (enhance existing)
- Create job posting
- Manage applications
- Interview scheduling

---

## 🎨 Phase 9: Layout Consistency

### 9.1 Requirements
- ✅ Consistent design between Admin and HR dashboards
- ✅ Same components and styling
- ✅ Layout-agnostic pages (work on both dashboards)
- ✅ Unified navigation

### 9.2 Implementation
- Use existing layout-agnostic pattern
- Ensure all HR pages detect route and use appropriate layout
- Consistent color scheme and spacing
- Shared components library

---

## 📦 Implementation Order

### Priority 1 (Critical)
1. ✅ Remove mock data from Turnover & Retention
2. ✅ Enhance Attendance page with employee dropdown and time tracking
3. ✅ Enhance Payroll with Add to Payroll and Run Payroll features

### Priority 2 (High)
4. ✅ Implement Performance Evaluation feature
5. ✅ Enhance Leave Management with request form
6. ✅ Fix and enhance Compliance & Certificates

### Priority 3 (Medium)
7. ✅ Build HR Reporting & Analytics
8. ✅ Create Careers page for website

### Priority 4 (Polish)
9. ✅ Ensure layout consistency
10. ✅ Add loading states and error handling
11. ✅ Implement real-time updates

---

## 🔧 Technical Stack

### Frontend
- React + TypeScript
- TailwindCSS for styling
- shadcn/ui components
- React Query for data fetching
- Recharts for visualizations
- jsPDF for PDF generation
- xlsx for Excel export

### Backend
- Supabase (PostgreSQL)
- Supabase Realtime for live updates
- Supabase Storage for file uploads
- Row Level Security (RLS) policies

### Email
- Supabase Edge Functions for email sending
- Email templates for payslips

---

## 📝 SQL Migration Files to Create

1. `COMPLETE_11_hr_enhancements.sql`
   - attendance table
   - payroll enhancements
   - payslips table
   - performance_evaluations table
   - certifications enhancements
   - leave_requests enhancements
   - job_postings table
   - job_applications table
   - Views for reporting
   - Functions for calculations
   - Triggers for automation

---

## ✅ Success Criteria

- [ ] HR Dashboard shows 100% real-time data (no mock data)
- [ ] Attendance management fully functional on both dashboards
- [ ] Payroll with Add, Run, and Generate Payslips working
- [ ] Performance Evaluation feature implemented
- [ ] Leave Management with approval workflow working
- [ ] Compliance & Certificates tracking active
- [ ] HR Reporting with 8 report types and export functionality
- [ ] Careers page auto-updates from Admin dashboard
- [ ] All pages layout-agnostic and consistent
- [ ] All features tested and bug-free

---

**Status:** 📋 **PLAN READY - IMPLEMENTATION STARTING**

**Last Updated:** November 13, 2025 - 8:30 AM
