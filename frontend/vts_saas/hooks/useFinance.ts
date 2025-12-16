import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import financeService from '@/services/financeService';

// Income
export function useIncome(filters?: any) {
  return useQuery({
    queryKey: ['income', filters],
    queryFn: () => financeService.getIncome(filters),
  });
}

export function useAddIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.addIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
  });
}

// Expenses
export function useExpenses(filters?: any) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => financeService.getExpenses(filters),
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      financeService.rejectExpense(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// Payroll
export function usePayroll(month: string) {
  return useQuery({
    queryKey: ['payroll', month],
    queryFn: () => financeService.getPayroll(month),
    enabled: !!month,
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, data }: { month: string; data: any }) => 
      financeService.processPayroll(month, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.month] });
    },
  });
}

// Fuel Logs
export function useFuelLogs(filters?: any) {
  return useQuery({
    queryKey: ['fuel-logs', filters],
    queryFn: () => financeService.getFuelLogs(filters),
  });
}

export function useApproveFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.approveFuelLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
    },
  });
}

// Invoices
export function useInvoices(filters?: any) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => financeService.getInvoices(filters),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => 
      financeService.sendInvoice(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Refunds
export function useRefundRequests(filters?: any) {
  return useQuery({
    queryKey: ['refund-requests', filters],
    queryFn: () => financeService.getRefundRequests(filters),
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      financeService.processRefund(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
  });
}

// Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => financeService.getAccounts(),
  });
}

export function useUploadBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File }) => 
      financeService.uploadBankStatement(accountId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
