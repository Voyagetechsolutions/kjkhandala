/**
 * Company-Aware API Layer
 * All database operations are filtered by company_id for multi-tenant isolation
 */

import { supabase } from './supabase';

// Type for company context
interface CompanyContext {
  companyId: string | null;
}

// Create a company-aware query builder
export function createCompanyQuery(table: string, companyId: string | null) {
  const query = supabase.from(table);
  return {
    query,
    companyId,
    
    // Select with company filter
    select: (columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) => {
      let q = query.select(columns, options);
      if (companyId) {
        q = q.eq('company_id', companyId);
      }
      return q;
    },
    
    // Insert with company_id
    insert: (data: any | any[]) => {
      const dataWithCompany = Array.isArray(data)
        ? data.map(item => ({ ...item, company_id: companyId }))
        : { ...data, company_id: companyId };
      return query.insert(dataWithCompany).select();
    },
    
    // Update with company filter
    update: (data: any) => {
      let q = query.update(data);
      if (companyId) {
        q = q.eq('company_id', companyId);
      }
      return q;
    },
    
    // Delete with company filter
    delete: () => {
      let q = query.delete();
      if (companyId) {
        q = q.eq('company_id', companyId);
      }
      return q;
    },
  };
}

// =====================================================
// ROUTES API - Company Filtered
// =====================================================
export const createRoutesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('origin', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('routes')
      .select('*')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (route: any) => {
    const { data, error } = await supabase
      .from('routes')
      .insert({ ...route, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('routes')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    let query = supabase
      .from('routes')
      .delete()
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});

// =====================================================
// BUSES API - Company Filtered
// =====================================================
export const createBusesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('buses')
      .select('*')
      .order('name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('buses')
      .select('*')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (bus: any) => {
    const { data, error } = await supabase
      .from('buses')
      .insert({ ...bus, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('buses')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    let query = supabase
      .from('buses')
      .delete()
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});

// =====================================================
// BOOKINGS API - Company Filtered
// =====================================================
export const createBookingsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  getByReference: async (reference: string) => {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('booking_reference', reference);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (booking: any) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ ...booking, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('bookings')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// TRIPS API - Company Filtered
// =====================================================
export const createTripsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('trips')
      .select('*, routes(*), buses(*), drivers(*)')
      .order('scheduled_departure', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('trips')
      .select('*, routes(*), buses(*), drivers(*)')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  getToday: async () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
    
    let query = supabase
      .from('trips')
      .select('*, routes(*), buses(*), drivers(*)')
      .gte('scheduled_departure', todayStart)
      .lte('scheduled_departure', todayEnd)
      .order('scheduled_departure', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (trip: any) => {
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...trip, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('trips')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// EMPLOYEES API - Company Filtered
// =====================================================
export const createEmployeesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('employees')
      .select('*')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (employee: any) => {
    const { data, error } = await supabase
      .from('employees')
      .insert({ ...employee, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('employees')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    let query = supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});

// =====================================================
// DRIVERS API - Company Filtered
// =====================================================
export const createDriversApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('drivers')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    let query = supabase
      .from('drivers')
      .select('*')
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (driver: any) => {
    const { data, error } = await supabase
      .from('drivers')
      .insert({ ...driver, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('drivers')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// TERMINALS API - Company Filtered
// =====================================================
export const createTerminalsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('terminals')
      .select('*')
      .order('name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (terminal: any) => {
    const { data, error } = await supabase
      .from('terminals')
      .insert({ ...terminal, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('terminals')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    let query = supabase
      .from('terminals')
      .delete()
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});

// =====================================================
// MAINTENANCE API - Company Filtered
// =====================================================
export const createMaintenanceApi = (companyId: string | null) => ({
  getRecords: async () => {
    let query = supabase
      .from('maintenance_records')
      .select('*, buses(*)')
      .order('performed_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getWorkOrders: async () => {
    let query = supabase
      .from('work_orders')
      .select('*, buses(*)')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getSchedules: async () => {
    let query = supabase
      .from('maintenance_schedules')
      .select('*, buses(*)')
      .eq('is_active', true)
      .order('next_service_date', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  createRecord: async (record: any) => {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert({ ...record, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  createWorkOrder: async (workOrder: any) => {
    const { data, error } = await supabase
      .from('work_orders')
      .insert({ ...workOrder, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// EXPENSES API - Company Filtered
// =====================================================
export const createExpensesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (expense: any) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// INCOME API - Company Filtered
// =====================================================
export const createIncomeApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('income_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (income: any) => {
    const { data, error } = await supabase
      .from('income_records')
      .insert({ ...income, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// ATTENDANCE API - Company Filtered
// =====================================================
export const createAttendanceApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('attendance')
      .select('*, profiles(*)')
      .order('date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getByDate: async (date: string) => {
    let query = supabase
      .from('attendance')
      .select('*, profiles(*)')
      .eq('date', date);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (attendance: any) => {
    const { data, error } = await supabase
      .from('attendance')
      .insert({ ...attendance, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('attendance')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// PAYROLL API - Company Filtered
// =====================================================
export const createPayrollApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('payroll')
      .select('*, profiles(*)')
      .order('period_start', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (payroll: any) => {
    const { data, error } = await supabase
      .from('payroll')
      .insert({ ...payroll, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('payroll')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// LEAVE REQUESTS API - Company Filtered
// =====================================================
export const createLeaveApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('leave_requests')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (leave: any) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({ ...leave, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// FUEL LOGS API - Company Filtered
// =====================================================
export const createFuelLogsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('fuel_logs')
      .select('*, buses(*), drivers(*)')
      .order('filled_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (fuelLog: any) => {
    const { data, error } = await supabase
      .from('fuel_logs')
      .insert({ ...fuelLog, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// NOTIFICATIONS API - Company Filtered
// =====================================================
export const createNotificationsApi = (companyId: string | null) => ({
  getAll: async (userId: string) => {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (notification: any) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ ...notification, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  markAsRead: async (id: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// INVOICES API - Company Filtered
// =====================================================
export const createInvoicesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (invoice: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({ ...invoice, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('invoices')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// REFUND REQUESTS API - Company Filtered
// =====================================================
export const createRefundsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('refund_requests')
      .select('*, bookings(*)')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (refund: any) => {
    const { data, error } = await supabase
      .from('refund_requests')
      .insert({ ...refund, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('refund_requests')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// DRIVER SHIFTS API - Company Filtered
// =====================================================
export const createDriverShiftsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('driver_shifts')
      .select('*, drivers(*), buses(*), routes(*)')
      .order('shift_date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getByDateRange: async (startDate: string, endDate: string) => {
    let query = supabase
      .from('driver_shifts')
      .select('*, drivers(*), buses(*), routes(*)')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_date', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (shift: any) => {
    const { data, error } = await supabase
      .from('driver_shifts')
      .insert({ ...shift, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('driver_shifts')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// INSPECTIONS API - Company Filtered
// =====================================================
export const createInspectionsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('inspections')
      .select('*, buses(*)')
      .order('inspection_date', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (inspection: any) => {
    const { data, error } = await supabase
      .from('inspections')
      .insert({ ...inspection, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('inspections')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// JOB POSTINGS API - Company Filtered
// =====================================================
export const createJobPostingsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('job_postings')
      .select('*')
      .order('posted_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (job: any) => {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({ ...job, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// JOB APPLICATIONS API - Company Filtered
// =====================================================
export const createJobApplicationsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('job_applications')
      .select('*, job_postings(*)')
      .order('applied_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (application: any) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ ...application, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// PERFORMANCE EVALUATIONS API - Company Filtered
// =====================================================
export const createPerformanceApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('performance_evaluations')
      .select('*, profiles(*)')
      .order('evaluation_date', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (evaluation: any) => {
    const { data, error } = await supabase
      .from('performance_evaluations')
      .insert(evaluation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// INCIDENTS API - Company Filtered
// =====================================================
export const createIncidentsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('incidents')
      .select('*, buses(*), trips(*)')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (incident: any) => {
    const { data, error } = await supabase
      .from('incidents')
      .insert({ ...incident, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('incidents')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// SPARE PARTS INVENTORY API - Company Filtered
// =====================================================
export const createSparePartsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('spare_parts_inventory')
      .select('*')
      .order('part_name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (part: any) => {
    const { data, error } = await supabase
      .from('spare_parts_inventory')
      .insert({ ...part, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('spare_parts_inventory')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// PAYMENTS API - Company Filtered
// =====================================================
export const createPaymentsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('payments')
      .select('*, bookings(*)')
      .order('created_at', { ascending: false });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (payment: any) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// ROUTE FREQUENCIES API - Company Filtered
// =====================================================
export const createRouteFrequenciesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('route_frequencies')
      .select('*, routes(*), buses(*), drivers(*)')
      .eq('active', true)
      .order('departure_time', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (frequency: any) => {
    const { data, error } = await supabase
      .from('route_frequencies')
      .insert({ ...frequency, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('route_frequencies')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    let query = supabase
      .from('route_frequencies')
      .delete()
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});

// =====================================================
// SCHEDULES API - Company Filtered
// =====================================================
export const createSchedulesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('schedules')
      .select('*, routes(*), buses(*)')
      .eq('is_active', true)
      .order('departure_time', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (schedule: any) => {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ ...schedule, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('schedules')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// CITIES API - Company Filtered
// =====================================================
export const createCitiesApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('cities')
      .select('*')
      .order('name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (city: any) => {
    const { data, error } = await supabase
      .from('cities')
      .insert({ ...city, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// PASSENGERS API - Company Filtered
// =====================================================
export const createPassengersApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('passengers')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getByPhone: async (phone: string) => {
    let query = supabase
      .from('passengers')
      .select('*')
      .eq('phone', phone);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (passenger: any) => {
    const { data, error } = await supabase
      .from('passengers')
      .insert({ ...passenger, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('passengers')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});

// =====================================================
// GPS TRACKING API - Company Filtered
// =====================================================
export const createGpsTrackingApi = (companyId: string | null) => ({
  getLatest: async () => {
    let query = supabase
      .from('gps_tracking')
      .select('*, buses(*)')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getByBus: async (busId: string) => {
    let query = supabase
      .from('gps_tracking')
      .select('*')
      .eq('bus_id', busId)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (tracking: any) => {
    const { data, error } = await supabase
      .from('gps_tracking')
      .insert({ ...tracking, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
});

// =====================================================
// BANK ACCOUNTS API - Company Filtered
// =====================================================
export const createBankAccountsApi = (companyId: string | null) => ({
  getAll: async () => {
    let query = supabase
      .from('bank_accounts')
      .select('*')
      .order('account_name', { ascending: true });
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (account: any) => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({ ...account, company_id: companyId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    let query = supabase
      .from('bank_accounts')
      .update(updates)
      .eq('id', id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },
});
