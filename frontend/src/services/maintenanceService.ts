import api from './api';

export const maintenanceService = {
  // Work Orders Management
  getWorkOrders: (filters: any) => api.get('/maintenance/work-orders', { params: filters }),
  getWorkOrderById: (id: string) => api.get(`/maintenance/work-orders/${id}`),
  createWorkOrder: (data: any) => api.post('/maintenance/work-orders', data),
  updateWorkOrder: (id: string, data: any) => api.put(`/maintenance/work-orders/${id}`, data),
  deleteWorkOrder: (id: string) => api.delete(`/maintenance/work-orders/${id}`),
  assignMechanic: (id: string, mechanicId: string) => 
    api.put(`/maintenance/work-orders/${id}/assign`, { mechanicId }),
  updateStatus: (id: string, status: string) => 
    api.put(`/maintenance/work-orders/${id}/status`, { status }),
  attachPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/maintenance/work-orders/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Maintenance Schedule
  getSchedule: (filters?: any) => api.get('/maintenance/schedule', { params: filters }),
  getScheduleByBus: (busId: string) => api.get(`/maintenance/schedule/bus/${busId}`),
  createSchedule: (data: any) => api.post('/maintenance/schedule', data),
  updateSchedule: (id: string, data: any) => api.put(`/maintenance/schedule/${id}`, data),
  markCompleted: (id: string, data: any) => api.put(`/maintenance/schedule/${id}/complete`, data),
  getUpcomingServices: () => api.get('/maintenance/schedule/upcoming'),
  getOverdueServices: () => api.get('/maintenance/schedule/overdue'),

  // Vehicle Inspections
  getInspections: (filters: any) => api.get('/maintenance/inspections', { params: filters }),
  getInspectionById: (id: string) => api.get(`/maintenance/inspections/${id}`),
  createInspection: (data: any) => api.post('/maintenance/inspections', data),
  updateInspection: (id: string, data: any) => api.put(`/maintenance/inspections/${id}`, data),
  uploadInspectionPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/maintenance/inspections/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  generateInspectionReport: (id: string) => 
    api.get(`/maintenance/inspections/${id}/report`, { responseType: 'blob' }),
  getInspectionTemplates: () => api.get('/maintenance/inspections/templates'),

  // Repairs & Parts Replacement
  getRepairs: (filters: any) => api.get('/maintenance/repairs', { params: filters }),
  getRepairById: (id: string) => api.get(`/maintenance/repairs/${id}`),
  createRepair: (data: any) => api.post('/maintenance/repairs', data),
  updateRepair: (id: string, data: any) => api.put(`/maintenance/repairs/${id}`, data),
  markRepairComplete: (id: string, data: any) => 
    api.put(`/maintenance/repairs/${id}/complete`, data),
  getRepairHistory: (busId: string) => api.get(`/maintenance/repairs/history/${busId}`),
  getCommonIssues: () => api.get('/maintenance/repairs/common-issues'),

  // Inventory & Spare Parts
  getInventory: (filters?: any) => api.get('/maintenance/inventory', { params: filters }),
  getInventoryItem: (id: string) => api.get(`/maintenance/inventory/${id}`),
  createInventoryItem: (data: any) => api.post('/maintenance/inventory', data),
  updateInventoryItem: (id: string, data: any) => api.put(`/maintenance/inventory/${id}`, data),
  updateStock: (itemId: string, quantity: number, reason: string) => 
    api.put(`/maintenance/inventory/${itemId}/stock`, { quantity, reason }),
  getLowStockItems: () => api.get('/maintenance/inventory/low-stock'),
  createReorderAlert: (itemId: string, threshold: number) => 
    api.post('/maintenance/inventory/reorder-alert', { itemId, threshold }),
  getStockMovements: (itemId: string) => api.get(`/maintenance/inventory/${itemId}/movements`),
  getSuppliers: () => api.get('/maintenance/inventory/suppliers'),

  // Cost Management
  getCosts: (filters: any) => api.get('/maintenance/costs', { params: filters }),
  getCostByBus: (busId: string, period: string) => 
    api.get(`/maintenance/costs/bus/${busId}?period=${period}`),
  getCostByRoute: (routeId: string, period: string) => 
    api.get(`/maintenance/costs/route/${routeId}?period=${period}`),
  getCostBreakdown: (period: string) => 
    api.get(`/maintenance/costs/breakdown?period=${period}`),
  getBudgetComparison: (period: string) => 
    api.get(`/maintenance/costs/budget-comparison?period=${period}`),
  exportCostReport: (format: string, filters: any) => 
    api.get(`/maintenance/costs/export?format=${format}`, { 
      params: filters, 
      responseType: 'blob' 
    }),

  // Reports & Analytics
  getCostReport: (period: string) => api.get(`/maintenance/reports/costs?period=${period}`),
  getDowntimeReport: (period: string) => api.get(`/maintenance/reports/downtime?period=${period}`),
  getFrequentIssuesReport: () => api.get('/maintenance/reports/frequent-issues'),
  getPartsConsumptionReport: (period: string) => 
    api.get(`/maintenance/reports/parts-consumption?period=${period}`),
  getMechanicProductivityReport: (period: string) => 
    api.get(`/maintenance/reports/mechanic-productivity?period=${period}`),
  getComplianceReport: () => api.get('/maintenance/reports/compliance'),
  exportReport: (reportType: string, format: string, params: any) => 
    api.get(`/maintenance/reports/${reportType}/export?format=${format}`, { 
      params, 
      responseType: 'blob' 
    }),
  getDashboardMetrics: () => api.get('/maintenance/reports/dashboard-metrics'),

  // Settings & Configuration
  getSettings: () => api.get('/maintenance/settings'),
  updateSettings: (data: any) => api.put('/maintenance/settings', data),
  getServiceIntervals: () => api.get('/maintenance/settings/service-intervals'),
  updateServiceIntervals: (data: any) => api.put('/maintenance/settings/service-intervals', data),
  getIssueCategories: () => api.get('/maintenance/settings/issue-categories'),
  updateIssueCategories: (categories: any[]) => 
    api.put('/maintenance/settings/issue-categories', { categories }),
  getPriorityRules: () => api.get('/maintenance/settings/priority-rules'),
  updatePriorityRules: (rules: any) => api.put('/maintenance/settings/priority-rules', rules),
  getReorderThresholds: () => api.get('/maintenance/settings/reorder-thresholds'),
  updateReorderThresholds: (thresholds: any) => 
    api.put('/maintenance/settings/reorder-thresholds', thresholds),
};

export default maintenanceService;
