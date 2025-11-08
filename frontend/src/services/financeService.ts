import api from './api';

export const financeService = {
  // Income Management
  getIncome: (filters: any) => api.get('/finance/income', { params: filters }),
  addIncome: (data: any) => api.post('/finance/income', data),
  updateIncome: (id: string, data: any) => api.put(`/finance/income/${id}`, data),
  deleteIncome: (id: string) => api.delete(`/finance/income/${id}`),
  exportIncome: (format: string, filters: any) => 
    api.get(`/finance/income/export?format=${format}`, { params: filters, responseType: 'blob' }),

  // Expense Management
  getExpenses: (filters: any) => api.get('/finance/expenses', { params: filters }),
  addExpense: (data: FormData) => api.post('/finance/expenses', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approveExpense: (id: string) => api.put(`/finance/expenses/${id}/approve`),
  rejectExpense: (id: string, reason: string) => 
    api.put(`/finance/expenses/${id}/reject`, { reason }),
  exportExpenses: (format: string, filters: any) => 
    api.get(`/finance/expenses/export?format=${format}`, { params: filters, responseType: 'blob' }),

  // Payroll Management
  getPayroll: (month: string) => api.get(`/finance/payroll/${month}`),
  getEmployeePayroll: (employeeId: string, month: string) => 
    api.get(`/finance/payroll/employee/${employeeId}/${month}`),
  processPayroll: (month: string, data: any) => 
    api.post(`/finance/payroll/process/${month}`, data),
  approvePayroll: (month: string) => api.put(`/finance/payroll/approve/${month}`),
  generatePayslip: (employeeId: string, month: string) => 
    api.get(`/finance/payroll/payslip/${employeeId}/${month}`, { responseType: 'blob' }),
  exportToBankFormat: (month: string) => 
    api.get(`/finance/payroll/bank-export/${month}`, { responseType: 'blob' }),
  calculatePayroll: (month: string) => api.post(`/finance/payroll/calculate/${month}`),

  // Fuel & Allowances
  getFuelLogs: (filters: any) => api.get('/finance/fuel-logs', { params: filters }),
  approveFuelLog: (id: string) => api.put(`/finance/fuel-logs/${id}/approve`),
  disputeFuelLog: (id: string, reason: string) => 
    api.put(`/finance/fuel-logs/${id}/dispute`, { reason }),
  getFuelEfficiency: (routeId?: string) => 
    api.get('/finance/fuel-logs/efficiency', { params: { routeId } }),
  getTopStations: () => api.get('/finance/fuel-logs/top-stations'),
  exportFuelReport: (format: string, filters: any) => 
    api.get(`/finance/fuel-logs/export?format=${format}`, { params: filters, responseType: 'blob' }),

  // Invoices & Billing
  getInvoices: (filters: any) => api.get('/finance/invoices', { params: filters }),
  createInvoice: (data: any) => api.post('/finance/invoices', data),
  updateInvoice: (id: string, data: any) => api.put(`/finance/invoices/${id}`, data),
  sendInvoice: (id: string, email: string) => 
    api.post(`/finance/invoices/${id}/send`, { email }),
  downloadInvoice: (id: string) => 
    api.get(`/finance/invoices/${id}/download`, { responseType: 'blob' }),
  recordPayment: (id: string, data: any) => 
    api.post(`/finance/invoices/${id}/payment`, data),
  getOverdueInvoices: () => api.get('/finance/invoices/overdue'),

  // Refunds & Adjustments
  getRefundRequests: (filters: any) => api.get('/finance/refunds', { params: filters }),
  processRefund: (id: string, data: any) => 
    api.post(`/finance/refunds/${id}/process`, data),
  approveRefund: (id: string, amount: number, reason: string) => 
    api.put(`/finance/refunds/${id}/approve`, { amount, reason }),
  declineRefund: (id: string, reason: string) => 
    api.put(`/finance/refunds/${id}/decline`, { reason }),
  calculateRefund: (ticketAmount: number, daysBeforeTravel: number) => 
    api.post('/finance/refunds/calculate', { ticketAmount, daysBeforeTravel }),
  getRefundPolicy: () => api.get('/finance/refunds/policy'),

  // Reports & Analytics
  getRevenueReport: (period: string, filters?: any) => 
    api.get(`/finance/reports/revenue?period=${period}`, { params: filters }),
  getProfitLossStatement: (startDate: string, endDate: string) => 
    api.get('/finance/reports/profit-loss', { params: { startDate, endDate } }),
  getExpenseBreakdown: (period: string) => 
    api.get(`/finance/reports/expense-breakdown?period=${period}`),
  getRouteProfitability: () => api.get('/finance/reports/route-profitability'),
  getFuelEfficiencyReport: (period: string) => 
    api.get(`/finance/reports/fuel-efficiency?period=${period}`),
  getPayrollSummary: (month: string) => 
    api.get(`/finance/reports/payroll-summary/${month}`),
  getOutstandingPayments: () => api.get('/finance/reports/outstanding-payments'),
  getBalanceSheet: (date: string) => 
    api.get('/finance/reports/balance-sheet', { params: { date } }),
  exportReport: (reportType: string, format: string, params: any) => 
    api.get(`/finance/reports/${reportType}/export?format=${format}`, { 
      params, 
      responseType: 'blob' 
    }),
  getDashboardMetrics: () => api.get('/finance/reports/dashboard-metrics'),

  // Accounts & Reconciliation
  getAccounts: () => api.get('/finance/accounts'),
  createAccount: (data: any) => api.post('/finance/accounts', data),
  updateAccount: (id: string, data: any) => api.put(`/finance/accounts/${id}`, data),
  uploadBankStatement: (accountId: string, file: File) => {
    const formData = new FormData();
    formData.append('statement', file);
    formData.append('accountId', accountId);
    return api.post('/finance/reconciliation/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  matchTransactions: (accountId: string, date: string) => 
    api.post('/finance/reconciliation/match', { accountId, date }),
  getReconciliationSummary: (accountId: string, date: string) => 
    api.get('/finance/reconciliation/summary', { params: { accountId, date } }),
  resolveDiscrepancy: (transactionId: string, resolution: any) => 
    api.post(`/finance/reconciliation/resolve/${transactionId}`, resolution),
  getDiscrepancies: (accountId: string) => 
    api.get(`/finance/reconciliation/discrepancies/${accountId}`),

  // Settings & Configuration
  getSettings: () => api.get('/finance/settings'),
  updateSettings: (data: any) => api.put('/finance/settings', data),
  getTaxRates: () => api.get('/finance/settings/tax-rates'),
  updateTaxRates: (data: any) => api.put('/finance/settings/tax-rates', data),
  getCurrencySettings: () => api.get('/finance/settings/currency'),
  updateCurrencySettings: (data: any) => api.put('/finance/settings/currency', data),
  getPayrollCycle: () => api.get('/finance/settings/payroll-cycle'),
  updatePayrollCycle: (cycle: string) => api.put('/finance/settings/payroll-cycle', { cycle }),
  getExpenseCategories: () => api.get('/finance/settings/expense-categories'),
  updateExpenseCategories: (categories: any[]) => 
    api.put('/finance/settings/expense-categories', { categories }),
  getRefundPolicies: () => api.get('/finance/settings/refund-policies'),
  updateRefundPolicies: (policies: any) => api.put('/finance/settings/refund-policies', policies),
  getChartOfAccounts: () => api.get('/finance/settings/chart-of-accounts'),
  updateChartOfAccounts: (accounts: any[]) => 
    api.put('/finance/settings/chart-of-accounts', { accounts }),
  getPaymentGatewayConfig: () => api.get('/finance/settings/payment-gateway'),
  updatePaymentGatewayConfig: (config: any) => 
    api.put('/finance/settings/payment-gateway', config),
};

export default financeService;
