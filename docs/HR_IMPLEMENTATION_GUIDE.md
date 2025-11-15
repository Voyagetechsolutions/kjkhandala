# 🚀 HR Dashboard Enhancement - Complete Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [What's Been Completed](#whats-been-completed)
3. [Quick Start](#quick-start)
4. [Detailed Implementation Steps](#detailed-implementation-steps)
5. [Feature Specifications](#feature-specifications)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete instructions for implementing comprehensive HR Dashboard enhancements with real-time data integration, advanced features, and seamless Admin/HR dashboard integration.

### Goals:
- ✅ 100% real-time data (no mock data)
- ✅ Advanced HR features (Attendance, Payroll, Performance, Leave, Compliance)
- ✅ Comprehensive reporting and analytics
- ✅ Public careers page integration
- ✅ Layout consistency across dashboards

---

## What's Been Completed

### ✅ Phase 1: Foundation (DONE)

#### 1. HR Dashboard Home Page Fixed
**File:** `frontend/src/pages/hr/HRDashboard.tsx`

**Changes Made:**
- ✅ Removed mock data from Turnover & Retention section
- ✅ Added real-time calculations for:
  - Retention Rate (calculated from employee data)
  - Turnover Rate (100 - Retention Rate)
  - Average Tenure (calculated from hire dates)

**Before:**
```typescript
<div className="text-3xl font-bold text-green-600">94.2%</div> // Mock data
```

**After:**
```typescript
<div className="text-3xl font-bold text-green-600">{retentionRate}%</div> // Real data
```

#### 2. Complete SQL Schema Created
**File:** `supabase/COMPLETE_11_hr_enhancements.sql`

**Created:**
- 9 database tables
- 7 reporting views
- 5 helper functions
- 3 automation triggers
- All indexes and permissions

#### 3. Documentation Created
- ✅ HR_DASHBOARD_ENHANCEMENT_PLAN.md (Detailed plan)
- ✅ HR_ENHANCEMENTS_SUMMARY.md (Summary)
- ✅ HR_IMPLEMENTATION_GUIDE.md (This file)
- ✅ COMPLETE_11_hr_enhancements.sql (SQL schema)

---

## Quick Start

### Step 1: Run SQL Migration (REQUIRED)

```bash
# In Supabase SQL Editor, execute:
supabase/COMPLETE_11_hr_enhancements.sql
```

This creates all necessary tables, views, functions, and triggers.

### Step 2: Install Dependencies

```bash
cd frontend
npm install recharts jspdf jspdf-autotable xlsx react-datepicker
```

### Step 3: Verify HR Dashboard

1. Navigate to `/admin/hr` or `/hr`
2. Check that Turnover & Retention shows real data (not 94.2%, 5.8%, 2.3 yrs)
3. Verify all employee stats are displaying correctly

---

## Detailed Implementation Steps

### Priority 1: Attendance Management

#### File to Create: `frontend/src/pages/hr/Attendance.tsx`

**Features to Implement:**
1. Employee selector with search
2. Date picker
3. Check-in/Check-out time pickers
4. Auto-calculated work hours
5. Auto-calculated overtime
6. Status badges
7. Attendance history table
8. Export to Excel

**Code Structure:**
```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';

export default function Attendance() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  
  // Employee selector
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id')
        .not('employee_id', 'is', null)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
  
  // Attendance records
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:profiles(full_name, employee_id)
        `)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  
  // Create attendance mutation
  const createAttendance = useMutation({
    mutationFn: async (attendanceData) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendanceData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded successfully');
    },
  });
  
  return (
    <Layout>
      {/* Employee selector */}
      {/* Date picker */}
      {/* Time pickers */}
      {/* Attendance table */}
    </Layout>
  );
}
```

**UI Components Needed:**
- Employee dropdown with search
- Date picker (react-datepicker)
- Time pickers
- Attendance form
- Attendance table with filters
- Export button

---

### Priority 2: Payroll Enhancement

#### File to Enhance: `frontend/src/pages/hr/HRPayroll.tsx`

**New Features to Add:**

1. **Add to Payroll Dialog:**
```typescript
const [showAddDialog, setShowAddDialog] = useState(false);

const addToPayroll = useMutation({
  mutationFn: async (payrollData) => {
    const { data, error } = await supabase
      .from('payroll')
      .insert([{
        employee_id: payrollData.employeeId,
        period_start: payrollData.periodStart,
        period_end: payrollData.periodEnd,
        basic_salary: payrollData.basicSalary,
        allowances: payrollData.allowances,
        bonuses: payrollData.bonuses,
        deductions: payrollData.deductions,
        status: 'pending',
        created_by: user.id,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['hr-payroll'] });
    toast.success('Employee added to payroll');
    setShowAddDialog(false);
  },
});
```

2. **Run Payroll Button:**
```typescript
const runPayroll = useMutation({
  mutationFn: async (payrollIds: string[]) => {
    const { data, error } = await supabase
      .from('payroll')
      .update({
        status: 'processed',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .in('id', payrollIds)
      .eq('status', 'pending')
      .select();
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['hr-payroll'] });
    toast.success(`Processed ${data.length} payroll records`);
  },
});
```

3. **Generate Payslips:**
```typescript
const generatePayslip = useMutation({
  mutationFn: async (payrollId: string) => {
    // Generate PDF using jsPDF
    const doc = new jsPDF();
    
    // Fetch payroll data
    const { data: payroll } = await supabase
      .from('payroll')
      .select(`
        *,
        employee:profiles(full_name, employee_id)
      `)
      .eq('id', payrollId)
      .single();
    
    // Add content to PDF
    doc.text('PAYSLIP', 105, 20, { align: 'center' });
    doc.text(`Employee: ${payroll.employee.full_name}`, 20, 40);
    doc.text(`Employee ID: ${payroll.employee.employee_id}`, 20, 50);
    doc.text(`Period: ${payroll.period_start} to ${payroll.period_end}`, 20, 60);
    
    // Add salary breakdown table
    doc.autoTable({
      startY: 70,
      head: [['Description', 'Amount']],
      body: [
        ['Basic Salary', `P ${payroll.basic_salary.toFixed(2)}`],
        ['Allowances', `P ${payroll.allowances.toFixed(2)}`],
        ['Bonuses', `P ${payroll.bonuses.toFixed(2)}`],
        ['Gross Pay', `P ${payroll.gross_pay.toFixed(2)}`],
        ['Deductions', `P ${payroll.deductions.toFixed(2)}`],
        ['Net Salary', `P ${payroll.net_salary.toFixed(2)}`],
      ],
    });
    
    // Save PDF
    const pdfBlob = doc.output('blob');
    
    // Upload to Supabase Storage
    const fileName = `payslips/${payroll.employee_id}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob);
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    
    // Create payslip record
    const { data, error } = await supabase
      .from('payslips')
      .insert([{
        payroll_id: payrollId,
        employee_id: payroll.employee_id,
        pdf_url: publicUrl,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success('Payslip generated successfully');
  },
});
```

---

### Priority 3: Performance Evaluation

#### File to Create: `frontend/src/pages/hr/Performance.tsx`

**Features:**
- Employee selector
- Evaluation period selector
- Rating sliders (1-5) for each metric:
  - Attendance
  - Quality of Work
  - Teamwork
  - Communication
  - Punctuality
  - Initiative
- Text areas for:
  - Strengths
  - Areas for Improvement
  - Goals
  - Comments
- Performance history chart
- Export to PDF

**Code Structure:**
```typescript
const [ratings, setRatings] = useState({
  attendance: 0,
  qualityOfWork: 0,
  teamwork: 0,
  communication: 0,
  punctuality: 0,
  initiative: 0,
});

const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;

const createEvaluation = useMutation({
  mutationFn: async (evaluationData) => {
    const { data, error } = await supabase
      .from('performance_evaluations')
      .insert([{
        employee_id: evaluationData.employeeId,
        evaluator_id: user.id,
        evaluation_period_start: evaluationData.periodStart,
        evaluation_period_end: evaluationData.periodEnd,
        overall_rating: overallRating,
        attendance_score: ratings.attendance,
        quality_of_work_score: ratings.qualityOfWork,
        teamwork_score: ratings.teamwork,
        communication_score: ratings.communication,
        punctuality_score: ratings.punctuality,
        initiative_score: ratings.initiative,
        strengths: evaluationData.strengths,
        areas_for_improvement: evaluationData.areasForImprovement,
        goals: evaluationData.goals,
        comments: evaluationData.comments,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success('Performance evaluation submitted');
  },
});
```

---

### Priority 4: Leave Management Enhancement

#### File to Enhance: `frontend/src/pages/hr/Leave.tsx`

**New Features:**

1. **Leave Request Form:**
```typescript
const createLeaveRequest = useMutation({
  mutationFn: async (leaveData) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: leaveData.employeeId,
        leave_type: leaveData.leaveType,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason,
        status: 'pending',
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success('Leave request submitted');
  },
});
```

2. **Approval Workflow:**
```typescript
const approveLeave = useMutation({
  mutationFn: async (leaveId: string) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    toast.success('Leave request approved');
  },
});

const rejectLeave = useMutation({
  mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', leaveId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    toast.success('Leave request rejected');
  },
});
```

3. **Leave Balance Display:**
```typescript
const { data: leaveBalances = [] } = useQuery({
  queryKey: ['leave-balances', employeeId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', new Date().getFullYear());
    if (error) throw error;
    return data;
  },
});
```

---

### Priority 5: HR Reporting & Analytics

#### File to Create: `frontend/src/pages/hr/HRReports.tsx`

**8 Report Types:**

1. **Headcount Report:**
```typescript
const { data: headcountData } = useQuery({
  queryKey: ['report-headcount', period],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_headcount_by_department')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

2. **Attendance Report:**
```typescript
const { data: attendanceData } = useQuery({
  queryKey: ['report-attendance', period],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_attendance_summary')
      .select('*')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);
    if (error) throw error;
    return data;
  },
});
```

3. **Leave Report:**
```typescript
const { data: leaveData } = useQuery({
  queryKey: ['report-leave', period],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_leave_summary')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

4. **Turnover Report:**
```typescript
// Calculate from employee data
const turnoverData = employees.filter(e => 
  e.status === 'terminated' && 
  new Date(e.termination_date) >= startDate &&
  new Date(e.termination_date) <= endDate
);
```

5. **Performance Report:**
```typescript
const { data: performanceData } = useQuery({
  queryKey: ['report-performance', period],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_performance_summary')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

6. **Compliance Report:**
```typescript
const { data: complianceData } = useQuery({
  queryKey: ['report-compliance'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_compliance_status')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

7. **Payroll Summary:**
```typescript
const { data: payrollData } = useQuery({
  queryKey: ['report-payroll', period],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_payroll_summary')
      .select('*')
      .gte('payroll_month', startDate)
      .lte('payroll_month', endDate);
    if (error) throw error;
    return data;
  },
});
```

8. **Recruitment Report:**
```typescript
const { data: recruitmentData } = useQuery({
  queryKey: ['report-recruitment'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('hr_recruitment_pipeline')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

**Export Functions:**

```typescript
// Export to PDF
const exportToPDF = () => {
  const doc = new jsPDF();
  doc.text('HR Report', 105, 20, { align: 'center' });
  doc.autoTable({
    head: [['Column 1', 'Column 2', 'Column 3']],
    body: reportData.map(row => [row.col1, row.col2, row.col3]),
  });
  doc.save(`hr-report-${Date.now()}.pdf`);
};

// Export to Excel
const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(reportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `hr-report-${Date.now()}.xlsx`);
};
```

---

### Priority 6: Careers Page

#### File to Create: `frontend/src/pages/public/Careers.tsx`

**Features:**
- Public job listings
- Job details view
- Application form
- Resume upload

**Code Structure:**
```typescript
export default function Careers() {
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .gte('closing_date', new Date().toISOString())
        .order('posted_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  
  const submitApplication = useMutation({
    mutationFn: async (applicationData) => {
      // Upload resume
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(`${Date.now()}_${applicationData.resumeFile.name}`, applicationData.resumeFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(uploadData.path);
      
      // Create application
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          job_posting_id: applicationData.jobId,
          applicant_name: applicationData.name,
          applicant_email: applicationData.email,
          applicant_phone: applicationData.phone,
          resume_url: publicUrl,
          cover_letter: applicationData.coverLetter,
          status: 'received',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Application submitted successfully');
    },
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Job listings */}
      {/* Application form */}
    </div>
  );
}
```

---

## Testing Checklist

### HR Dashboard Home Page:
- [ ] Navigate to `/admin/hr` - page loads without errors
- [ ] Navigate to `/hr` - page loads without errors
- [ ] Turnover & Retention shows real data (not 94.2%, 5.8%, 2.3 yrs)
- [ ] Employee stats update in real-time
- [ ] Department breakdown displays correctly

### Attendance Management:
- [ ] Employee dropdown loads all employees
- [ ] Can select date
- [ ] Can enter check-in time
- [ ] Can enter check-out time
- [ ] Work hours auto-calculate
- [ ] Overtime auto-calculates (if > 8 hours)
- [ ] Status auto-determines (Present/Late/Half-day)
- [ ] Attendance saves to database
- [ ] Attendance history displays correctly
- [ ] Export to Excel works

### Payroll Management:
- [ ] "Add to Payroll" button opens dialog
- [ ] Can select employee
- [ ] Can enter salary details
- [ ] Gross pay auto-calculates
- [ ] Net salary auto-calculates
- [ ] Payroll saves to database
- [ ] "Run Payroll" processes pending records
- [ ] "Generate Payslip" creates PDF
- [ ] Can email payslip
- [ ] Can download payslip

### Performance Evaluation:
- [ ] Can select employee
- [ ] Can select evaluation period
- [ ] Rating sliders work (1-5)
- [ ] Overall rating auto-calculates
- [ ] Can enter feedback text
- [ ] Evaluation saves to database
- [ ] Performance history displays
- [ ] Can export to PDF

### Leave Management:
- [ ] Leave request form works
- [ ] Can select leave type
- [ ] Date range picker works
- [ ] Days auto-calculate
- [ ] Leave request saves
- [ ] Can approve leave
- [ ] Can reject leave
- [ ] Leave balance updates
- [ ] Leave history displays

### HR Reporting:
- [ ] Can select report type
- [ ] Can select period
- [ ] Report data loads correctly
- [ ] Charts display correctly
- [ ] Can export to PDF
- [ ] Can export to Excel
- [ ] Report preview works

### Careers Page:
- [ ] Job listings display on public page
- [ ] Job details show correctly
- [ ] Application form works
- [ ] Resume upload works
- [ ] Application saves to database
- [ ] Admin can view applications

---

## Troubleshooting

### Issue: SQL Migration Fails

**Solution:**
1. Check if tables already exist
2. Drop existing tables if needed (backup first!)
3. Run migration again
4. Check Supabase logs for specific errors

### Issue: Data Not Displaying

**Solution:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Verify table permissions
5. Check query syntax

### Issue: Real-Time Updates Not Working

**Solution:**
1. Verify Supabase Realtime is enabled
2. Check subscription setup
3. Verify channel names
4. Check React Query invalidation

### Issue: File Upload Fails

**Solution:**
1. Check Supabase Storage bucket exists
2. Verify bucket permissions
3. Check file size limits
4. Verify file type restrictions

---

## Support

For issues or questions:
1. Check documentation files
2. Review SQL schema comments
3. Check Supabase logs
4. Review browser console errors

---

**Status:** 🟢 **READY FOR IMPLEMENTATION**

**Last Updated:** November 13, 2025 - 8:40 AM
