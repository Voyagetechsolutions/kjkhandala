// =====================================================
// SUPABASE API CLIENT - Direct Database Access
// Replaces backend API calls with direct Supabase queries
// =====================================================

import { supabase } from './supabase';

// =====================================================
// ROUTES
// =====================================================
export const routesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('origin', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (route: any) => {
    const { data, error } = await supabase
      .from('routes')
      .insert(route)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// =====================================================
// BUSES
// =====================================================
export const busesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (bus: any) => {
    const { data, error } = await supabase
      .from('buses')
      .insert(bus)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('buses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('buses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// =====================================================
// BOOKINGS
// =====================================================
export const bookingsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (booking: any) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// =====================================================
// SCHEDULES (TRIPS)
// =====================================================
export const schedulesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('departure_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  create: async (trip: any) => {
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// =====================================================
// STAFF (EMPLOYEES)
// =====================================================
export const staffApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },
  
  create: async (employee: any) => {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// =====================================================
// MAINTENANCE RECORDS
// =====================================================
export const maintenanceApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .order('performed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};

// Export all APIs
export default {
  routes: routesApi,
  buses: busesApi,
  bookings: bookingsApi,
  schedules: schedulesApi,
  staff: staffApi,
  maintenance: maintenanceApi,
};
