import { supabase } from '@/lib/supabase';

export const maintenanceService = {
  // Work Orders Management
  getWorkOrders: (filters?: any) => supabase.from('work_orders').select('*'),
  getWorkOrderById: (id: string) => supabase.from('work_orders').select('*').eq('id', id),
  createWorkOrder: (data: any) => supabase.from('work_orders').insert([data]),
  updateWorkOrder: (id: string, data: any) => supabase.from('work_orders').update(data).eq('id', id),
  deleteWorkOrder: (id: string) => supabase.from('work_orders').delete().eq('id', id),
  assignMechanic: (id: string, mechanicId: string) => 
    supabase.from('work_orders').update({ mechanic_id: mechanicId }).eq('id', id),
  updateStatus: (id: string, status: string) => 
    supabase.from('work_orders').update({ status }).eq('id', id),
  attachPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return supabase.storage.from('work-orders').upload(`${id}/photo`, file, {
      cacheControl: '3600',
      upsert: false
    });
  },

  // Maintenance Schedule
  getSchedule: (filters?: any) => supabase.from('schedule').select('*'),
  getScheduleByBus: (busId: string) => supabase.from('schedule').select('*').eq('bus_id', busId),
  createSchedule: (data: any) => supabase.from('schedule').insert([data]),
  updateSchedule: (id: string, data: any) => supabase.from('schedule').update(data).eq('id', id),
  markCompleted: (id: string, data: any) => supabase.from('schedule').update(data).eq('id', id),
  getUpcomingServices: () => supabase.from('schedule').select('*').gt('due_date', new Date()),
  getOverdueServices: () => supabase.from('schedule').select('*').lt('due_date', new Date()),

  // Vehicle Inspections
  getInspections: (filters?: any) => supabase.from('inspections').select('*'),
  getInspectionById: (id: string) => supabase.from('inspections').select('*').eq('id', id),
  createInspection: (data: any) => supabase.from('inspections').insert([data]),
  updateInspection: (id: string, data: any) => supabase.from('inspections').update(data).eq('id', id),
  uploadInspectionPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return supabase.storage.from('inspections').upload(`${id}/photo`, file, {
      cacheControl: '3600',
      upsert: false
    });
  },
  generateInspectionReport: (id: string) => 
    supabase.storage.from('inspections').download(`${id}/report`),
  getInspectionTemplates: () => supabase.from('inspection_templates').select('*'),

  // Repairs & Parts Replacement
  getRepairs: (filters?: any) => supabase.from('repairs').select('*'),
  getRepairById: (id: string) => supabase.from('repairs').select('*').eq('id', id),
  createRepair: (data: any) => supabase.from('repairs').insert([data]),
  updateRepair: (id: string, data: any) => supabase.from('repairs').update(data).eq('id', id),
  markRepairComplete: (id: string, data: any) => supabase.from('repairs').update(data).eq('id', id),
  getRepairHistory: (busId: string) => supabase.from('repairs').select('*').eq('bus_id', busId),
  getCommonIssues: () => supabase.from('common_issues').select('*'),

  // Inventory & Spare Parts
  getInventory: (filters?: any) => supabase.from('inventory').select('*'),
  getInventoryItem: (id: string) => supabase.from('inventory').select('*').eq('id', id),
  createInventoryItem: (data: any) => supabase.from('inventory').insert([data]),
  updateInventoryItem: (id: string, data: any) => supabase.from('inventory').update(data).eq('id', id),
  updateStock: (itemId: string, quantity: number, reason: string) => 
    supabase.from('inventory').update({ quantity, reason }).eq('id', itemId),
  getLowStockItems: () => supabase.from('inventory').select('*').lt('quantity', 5),
  createReorderAlert: (itemId: string, threshold: number) => 
    supabase.from('reorder_alerts').insert([{ item_id: itemId, threshold }]),
  getStockMovements: (itemId: string) => supabase.from('stock_movements').select('*').eq('item_id', itemId),
  getSuppliers: () => supabase.from('suppliers').select('*'),

  // Cost Management
  getCosts: (filters: any) => supabase.from('maintenance_costs').select('*'),
  getCostByBus: (busId: string, period: string) => 
    supabase.from('maintenance_costs').select('*').eq('bus_id', busId),
  getCostByRoute: (routeId: string, period: string) => 
    supabase.from('maintenance_costs').select('*').eq('route_id', routeId),
  getCostBreakdown: (period: string) => 
    supabase.from('maintenance_costs').select('*'),
  getBudgetComparison: (period: string) => 
    supabase.from('budget_comparison').select('*'),
  exportCostReport: (format: string, filters: any) => 
    supabase.from('maintenance_costs').select('*'),

  // Reports & Analytics
  getCostReport: (period: string) => supabase.from('maintenance_reports').select('*').eq('type', 'costs'),
  getDowntimeReport: (period: string) => supabase.from('maintenance_reports').select('*').eq('type', 'downtime'),
  getFrequentIssuesReport: () => supabase.from('maintenance_reports').select('*').eq('type', 'frequent_issues'),
  getPartsConsumptionReport: (period: string) => 
    supabase.from('maintenance_reports').select('*').eq('type', 'parts_consumption'),
  getMechanicProductivityReport: (period: string) => 
    supabase.from('maintenance_reports').select('*').eq('type', 'mechanic_productivity'),
  getComplianceReport: () => supabase.from('maintenance_reports').select('*').eq('type', 'compliance'),
  exportReport: (reportType: string, format: string, params: any) => 
    supabase.from('maintenance_reports').select('*').eq('type', reportType),
  getDashboardMetrics: () => supabase.from('maintenance_metrics').select('*'),

  // Settings & Configuration
  getSettings: () => supabase.from('maintenance_settings').select('*'),
  updateSettings: (data: any) => supabase.from('maintenance_settings').upsert(data),
  getServiceIntervals: () => supabase.from('service_intervals').select('*'),
  updateServiceIntervals: (data: any) => supabase.from('service_intervals').upsert(data),
  getIssueCategories: () => supabase.from('issue_categories').select('*'),
  updateIssueCategories: (categories: any[]) => 
    supabase.from('issue_categories').upsert(categories),
  getPriorityRules: () => supabase.from('priority_rules').select('*'),
  updatePriorityRules: (rules: any) => supabase.from('priority_rules').upsert(rules),
  getReorderThresholds: () => supabase.from('reorder_thresholds').select('*'),
  updateReorderThresholds: (thresholds: any) => 
    supabase.from('reorder_thresholds').upsert(thresholds),
};

export default maintenanceService;
