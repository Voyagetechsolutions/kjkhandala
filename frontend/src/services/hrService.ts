import { supabase } from '@/lib/supabase';

export const hrService = {
  // Employee Management
  getEmployees: (filters?: any) => supabase.from('employees').select('*').eq('filters', filters),
  getEmployeeById: (id: string) => supabase.from('employees').select('*').eq('id', id),
  createEmployee: (data: any) => supabase.from('employees').insert([data]),
  updateEmployee: (id: string, data: any) => supabase.from('employees').update(data).eq('id', id),
  deleteEmployee: (id: string) => supabase.from('employees').delete().eq('id', id),
  uploadDocument: (employeeId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    return supabase.from('employee_documents').insert([{
      employee_id: employeeId,
      document: file,
      type: documentType
    }]);
  },
  getEmployeeDocuments: (employeeId: string) => supabase.from('employee_documents').select('*').eq('employee_id', employeeId),
  updateEmploymentStatus: (id: string, status: string) => 
    supabase.from('employees').update({ employment_status: status }).eq('id', id),

  // Recruitment & Onboarding
  getJobPostings: (filters?: any) => supabase.from('job_postings').select('*').eq('filters', filters),
  createJobPosting: (data: any) => supabase.from('job_postings').insert([data]),
  updateJobPosting: (id: string, data: any) => supabase.from('job_postings').update(data).eq('id', id),
  closeJobPosting: (id: string) => supabase.from('job_postings').update({ status: 'closed' }).eq('id', id),
  getApplications: (jobId?: string) => supabase.from('job_applications').select('*').eq('job_id', jobId),
  createApplication: (data: any) => supabase.from('job_applications').insert([data]),
  updateApplicationStatus: (id: string, status: string, notes?: string) => 
    supabase.from('job_applications').update({ status, notes }).eq('id', id),
  scheduleInterview: (applicationId: string, data: any) => 
    supabase.from('interviews').insert([{
      application_id: applicationId,
      ...data
    }]),
  generateOfferLetter: (applicationId: string, data: any) => 
    supabase.from('offer_letters').insert([{
      application_id: applicationId,
      ...data
    }]),
  getOnboardingChecklist: (employeeId: string) => 
    supabase.from('onboarding_checklist').select('*').eq('employee_id', employeeId),
  updateOnboardingItem: (employeeId: string, itemId: string, completed: boolean) => 
    supabase.from('onboarding_checklist').update({ completed }).eq('id', itemId),

  // Attendance & Shift Management
  getAttendance: (filters?: any) => supabase.from('attendance').select('*').eq('filters', filters),
  checkIn: (employeeId: string) => supabase.from('attendance').insert([{
    employee_id: employeeId,
    check_in: new Date()
  }]),
  checkOut: (employeeId: string) => supabase.from('attendance').update({ check_out: new Date() }).eq('employee_id', employeeId),
  getAttendanceSummary: (employeeId: string, month: string) => 
    supabase.from('attendance').select('*').eq('employee_id', employeeId).eq('month', month),
  markAbsence: (employeeId: string, date: string, reason: string) => 
    supabase.from('absences').insert([{
      employee_id: employeeId,
      date,
      reason
    }]),
  getShifts: (filters?: any) => supabase.from('shifts').select('*').eq('filters', filters),
  createShift: (data: any) => supabase.from('shifts').insert([data]),
  updateShift: (id: string, data: any) => supabase.from('shifts').update(data).eq('id', id),
  assignShift: (shiftId: string, employeeId: string) => 
    supabase.from('shift_assignments').insert([{
      shift_id: shiftId,
      employee_id: employeeId
    }]),
  getOvertimeReport: (period: string) => 
    supabase.from('overtime').select('*').eq('period', period),

  // Payroll Management (HR View)
  getPayrollRecords: (month: string) => supabase.from('payroll').select('*').eq('month', month),
  getEmployeePayroll: (employeeId: string, month: string) => 
    supabase.from('payroll').select('*').eq('employee_id', employeeId).eq('month', month),
  updateSalary: (employeeId: string, data: any) => 
    supabase.from('salaries').update(data).eq('employee_id', employeeId),
  addBonus: (employeeId: string, data: any) => 
    supabase.from('bonuses').insert([{
      employee_id: employeeId,
      ...data
    }]),
  addDeduction: (employeeId: string, data: any) => 
    supabase.from('deductions').insert([{
      employee_id: employeeId,
      ...data
    }]),
  getPayrollHistory: (employeeId: string) => 
    supabase.from('payroll_history').select('*').eq('employee_id', employeeId),

  // Performance Evaluation
  getEvaluations: (filters?: any) => supabase.from('evaluations').select('*').eq('filters', filters),
  createEvaluation: (data: any) => supabase.from('evaluations').insert([data]),
  updateEvaluation: (id: string, data: any) => supabase.from('evaluations').update(data).eq('id', id),
  submitEvaluation: (id: string) => supabase.from('evaluations').update({ status: 'submitted' }).eq('id', id),
  getEvaluationTemplates: () => supabase.from('evaluation_templates').select('*'),
  getEmployeePerformance: (employeeId: string) => 
    supabase.from('employee_performance').select('*').eq('employee_id', employeeId),
  setPerformanceGoals: (employeeId: string, goals: any[]) => 
    supabase.from('performance_goals').insert(goals.map(goal => ({ employee_id: employeeId, ...goal }))),
  recordFeedback: (employeeId: string, data: any) => 
    supabase.from('feedback').insert([{
      employee_id: employeeId,
      ...data
    }]),

  // Compliance & Certifications
  getCertifications: (filters?: any) => supabase.from('certifications').select('*').eq('filters', filters),
  addCertification: (employeeId: string, data: any) => 
    supabase.from('certifications').insert([{
      employee_id: employeeId,
      ...data
    }]),
  updateCertification: (id: string, data: any) => 
    supabase.from('certifications').update(data).eq('id', id),
  getExpiringCertifications: (days: number) => 
    supabase.from('certifications').select('*').lt('expiration_date', new Date().getTime() + days * 24 * 60 * 60 * 1000),
  uploadCertificate: (certificationId: string, file: File) => {
    const formData = new FormData();
    formData.append('certificate', file);
    return supabase.from('certifications').update({ certificate: file }).eq('id', certificationId);
  },
  getMedicalRecords: (employeeId: string) => 
    supabase.from('medical_records').select('*').eq('employee_id', employeeId),
  addMedicalRecord: (employeeId: string, data: any) => 
    supabase.from('medical_records').insert([{
      employee_id: employeeId,
      ...data
    }]),
  getComplianceSummary: () => supabase.from('compliance_summary').select('*'),

  // Leave & Time-Off Management
  getLeaveRequests: (filters?: any) => supabase.from('leave_requests').select('*').eq('filters', filters),
  createLeaveRequest: (data: any) => supabase.from('leave_requests').insert([data]),
  approveLeaveRequest: (id: string, notes?: string) => 
    supabase.from('leave_requests').update({ status: 'approved', notes }).eq('id', id),
  rejectLeaveRequest: (id: string, reason: string) => 
    supabase.from('leave_requests').update({ status: 'rejected', rejection_reason: reason }).eq('id', id),
  getLeaveBalance: (employeeId: string) => 
    supabase.from('leave_balance').select('*').eq('employee_id', employeeId),
  getLeaveHistory: (employeeId: string) => 
    supabase.from('leave_history').select('*').eq('employee_id', employeeId),
  getLeaveCalendar: (month: string) => 
    supabase.from('leave_calendar').select('*').eq('month', month),
  updateLeaveBalance: (employeeId: string, leaveType: string, days: number) => 
    api.put(`/hr/leave/balance/${employeeId}`, { leaveType, days }),

  // Reports & Analytics
  getHeadcountReport: () => api.get('/hr/reports/headcount'),
  getAttendanceReport: (period: string) => 
    api.get(`/hr/reports/attendance?period=${period}`),
  getPayrollReport: (month: string) => 
    api.get(`/hr/reports/payroll/${month}`),
  getLeaveReport: (period: string) => 
    api.get(`/hr/reports/leave?period=${period}`),
  getTurnoverReport: (period: string) => 
    api.get(`/hr/reports/turnover?period=${period}`),
  getPerformanceReport: (period: string) => 
    api.get(`/hr/reports/performance?period=${period}`),
  getComplianceReport: () => api.get('/hr/reports/compliance'),
  getRecruitmentReport: (period: string) => 
    api.get(`/hr/reports/recruitment?period=${period}`),
  exportReport: (reportType: string, format: string, params: any) => 
    api.get(`/hr/reports/${reportType}/export?format=${format}`, { 
      params, 
      responseType: 'blob' 
    }),
  getDashboardMetrics: () => api.get('/hr/reports/dashboard-metrics'),

  // Settings & Configuration
  getSettings: () => api.get('/hr/settings'),
  updateSettings: (data: any) => api.put('/hr/settings', data),
  getLeaveTypes: () => api.get('/hr/settings/leave-types'),
  updateLeaveTypes: (types: any[]) => api.put('/hr/settings/leave-types', { types }),
  getDepartments: () => api.get('/hr/settings/departments'),
  updateDepartments: (departments: any[]) => 
    api.put('/hr/settings/departments', { departments }),
  getJobTitles: () => api.get('/hr/settings/job-titles'),
  updateJobTitles: (titles: any[]) => api.put('/hr/settings/job-titles', { titles }),
  getDocumentTemplates: () => api.get('/hr/settings/templates'),
  updateDocumentTemplate: (templateId: string, content: string) => 
    api.put(`/hr/settings/templates/${templateId}`, { content }),
  getApprovalWorkflow: () => api.get('/hr/settings/approval-workflow'),
  updateApprovalWorkflow: (workflow: any) => 
    api.put('/hr/settings/approval-workflow', workflow),
};

export default hrService;
