import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import hrService from '@/services/hrService';

// Employees
export function useEmployees(filters?: any) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => hrService.getEmployees(filters),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => hrService.getEmployeeById(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      hrService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
}

// Attendance
export function useAttendance(filters: any) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => hrService.getAttendance(filters),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => hrService.checkIn(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => hrService.checkOut(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Leave Requests
export function useLeaveRequests(filters?: any) {
  return useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: () => hrService.getLeaveRequests(filters),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      hrService.approveLeaveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      hrService.rejectLeaveRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

// Certifications
export function useCertifications(filters?: any) {
  return useQuery({
    queryKey: ['certifications', filters],
    queryFn: () => hrService.getCertifications(filters),
  });
}

export function useExpiringCertifications(days: number = 30) {
  return useQuery({
    queryKey: ['certifications', 'expiring', days],
    queryFn: () => hrService.getExpiringCertifications(days),
  });
}

export function useAddCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) => 
      hrService.addCertification(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}

// Recruitment
export function useJobPostings(filters?: any) {
  return useQuery({
    queryKey: ['job-postings', filters],
    queryFn: () => hrService.getJobPostings(filters),
  });
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.createJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
    },
  });
}

export function useApplications(jobId?: string) {
  return useQuery({
    queryKey: ['applications', jobId],
    queryFn: () => hrService.getApplications(jobId),
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => 
      hrService.updateApplicationStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

// Performance
export function useEvaluations(filters?: any) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => hrService.getEvaluations(filters),
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

// Payroll (HR View)
export function usePayrollRecords(month: string) {
  return useQuery({
    queryKey: ['hr-payroll', month],
    queryFn: () => hrService.getPayrollRecords(month),
    enabled: !!month,
  });
}

export function useUpdateSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) => 
      hrService.updateSalary(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
