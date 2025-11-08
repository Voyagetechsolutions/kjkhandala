import api from './api';

export const hrService = {
  // Employee Management
  getEmployees: (filters?: any) => api.get('/hr/employees', { params: filters }),
  getEmployeeById: (id: string) => api.get(`/hr/employees/${id}`),
  createEmployee: (data: FormData) => api.post('/hr/employees', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateEmployee: (id: string, data: any) => api.put(`/hr/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/hr/employees/${id}`),
  uploadDocument: (employeeId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    return api.post(`/hr/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getEmployeeDocuments: (employeeId: string) => api.get(`/hr/employees/${employeeId}/documents`),
  updateEmploymentStatus: (id: string, status: string) => 
    api.put(`/hr/employees/${id}/status`, { status }),

  // Recruitment & Onboarding
  getJobPostings: (filters?: any) => api.get('/hr/recruitment/jobs', { params: filters }),
  createJobPosting: (data: any) => api.post('/hr/recruitment/jobs', data),
  updateJobPosting: (id: string, data: any) => api.put(`/hr/recruitment/jobs/${id}`, data),
  closeJobPosting: (id: string) => api.put(`/hr/recruitment/jobs/${id}/close`),
  getApplications: (jobId?: string) => api.get('/hr/recruitment/applications', { params: { jobId } }),
  createApplication: (data: any) => api.post('/hr/recruitment/applications', data),
  updateApplicationStatus: (id: string, status: string, notes?: string) => 
    api.put(`/hr/recruitment/applications/${id}/status`, { status, notes }),
  scheduleInterview: (applicationId: string, data: any) => 
    api.post(`/hr/recruitment/applications/${applicationId}/interview`, data),
  generateOfferLetter: (applicationId: string, data: any) => 
    api.post(`/hr/recruitment/applications/${applicationId}/offer`, data, { responseType: 'blob' }),
  getOnboardingChecklist: (employeeId: string) => 
    api.get(`/hr/onboarding/${employeeId}/checklist`),
  updateOnboardingItem: (employeeId: string, itemId: string, completed: boolean) => 
    api.put(`/hr/onboarding/${employeeId}/checklist/${itemId}`, { completed }),

  // Attendance & Shift Management
  getAttendance: (filters: any) => api.get('/hr/attendance', { params: filters }),
  checkIn: (employeeId: string) => api.post('/hr/attendance/check-in', { employeeId }),
  checkOut: (employeeId: string) => api.post('/hr/attendance/check-out', { employeeId }),
  getAttendanceSummary: (employeeId: string, month: string) => 
    api.get(`/hr/attendance/summary/${employeeId}/${month}`),
  markAbsence: (employeeId: string, date: string, reason: string) => 
    api.post('/hr/attendance/absence', { employeeId, date, reason }),
  getShifts: (filters?: any) => api.get('/hr/shifts', { params: filters }),
  createShift: (data: any) => api.post('/hr/shifts', data),
  updateShift: (id: string, data: any) => api.put(`/hr/shifts/${id}`, data),
  assignShift: (shiftId: string, employeeId: string) => 
    api.post(`/hr/shifts/${shiftId}/assign`, { employeeId }),
  getOvertimeReport: (period: string) => api.get(`/hr/attendance/overtime?period=${period}`),

  // Payroll Management (HR View)
  getPayrollRecords: (month: string) => api.get(`/hr/payroll/${month}`),
  getEmployeePayroll: (employeeId: string, month: string) => 
    api.get(`/hr/payroll/employee/${employeeId}/${month}`),
  updateSalary: (employeeId: string, data: any) => 
    api.put(`/hr/employees/${employeeId}/salary`, data),
  addBonus: (employeeId: string, data: any) => 
    api.post(`/hr/payroll/bonus`, { employeeId, ...data }),
  addDeduction: (employeeId: string, data: any) => 
    api.post(`/hr/payroll/deduction`, { employeeId, ...data }),
  getPayrollHistory: (employeeId: string) => 
    api.get(`/hr/payroll/history/${employeeId}`),

  // Performance Evaluation
  getEvaluations: (filters?: any) => api.get('/hr/performance/evaluations', { params: filters }),
  createEvaluation: (data: any) => api.post('/hr/performance/evaluations', data),
  updateEvaluation: (id: string, data: any) => api.put(`/hr/performance/evaluations/${id}`, data),
  submitEvaluation: (id: string) => api.put(`/hr/performance/evaluations/${id}/submit`),
  getEvaluationTemplates: () => api.get('/hr/performance/templates'),
  getEmployeePerformance: (employeeId: string) => 
    api.get(`/hr/performance/employee/${employeeId}`),
  setPerformanceGoals: (employeeId: string, goals: any[]) => 
    api.post(`/hr/performance/goals`, { employeeId, goals }),
  recordFeedback: (employeeId: string, data: any) => 
    api.post(`/hr/performance/feedback`, { employeeId, ...data }),

  // Compliance & Certifications
  getCertifications: (filters?: any) => api.get('/hr/compliance/certifications', { params: filters }),
  addCertification: (employeeId: string, data: any) => 
    api.post('/hr/compliance/certifications', { employeeId, ...data }),
  updateCertification: (id: string, data: any) => 
    api.put(`/hr/compliance/certifications/${id}`, data),
  getExpiringCertifications: (days: number) => 
    api.get(`/hr/compliance/expiring?days=${days}`),
  uploadCertificate: (certificationId: string, file: File) => {
    const formData = new FormData();
    formData.append('certificate', file);
    return api.post(`/hr/compliance/certifications/${certificationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMedicalRecords: (employeeId: string) => 
    api.get(`/hr/compliance/medical/${employeeId}`),
  addMedicalRecord: (employeeId: string, data: any) => 
    api.post('/hr/compliance/medical', { employeeId, ...data }),
  getComplianceSummary: () => api.get('/hr/compliance/summary'),

  // Leave & Time-Off Management
  getLeaveRequests: (filters?: any) => api.get('/hr/leave/requests', { params: filters }),
  createLeaveRequest: (data: any) => api.post('/hr/leave/requests', data),
  approveLeaveRequest: (id: string, notes?: string) => 
    api.put(`/hr/leave/requests/${id}/approve`, { notes }),
  rejectLeaveRequest: (id: string, reason: string) => 
    api.put(`/hr/leave/requests/${id}/reject`, { reason }),
  getLeaveBalance: (employeeId: string) => 
    api.get(`/hr/leave/balance/${employeeId}`),
  getLeaveHistory: (employeeId: string) => 
    api.get(`/hr/leave/history/${employeeId}`),
  getLeaveCalendar: (month: string) => 
    api.get(`/hr/leave/calendar/${month}`),
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
