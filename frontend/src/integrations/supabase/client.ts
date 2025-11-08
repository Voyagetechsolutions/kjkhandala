// =====================================================
// DEPRECATED - Migrated to Prisma + Custom API
// This file is kept for backward compatibility
// Please use: import api from '@/lib/api'
// =====================================================

import api from '@/lib/api';

// Legacy Supabase client export for backward compatibility
// This now uses our custom API client under the hood
export const supabase = {
  // Legacy auth methods - redirect to new API
  auth: {
    signIn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('auth_token', response.data.token);
        return { data: { user: response.data.user }, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await api.post('/auth/register', { email, password, fullName: email });
        localStorage.setItem('auth_token', response.data.token);
        return { data: { user: response.data.user }, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('auth_token');
      await api.post('/auth/logout').catch(() => {});
      return { error: null };
    },
    getSession: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return { data: { session: null }, error: null };
      try {
        const response = await api.get('/auth/me');
        return { data: { session: { user: response.data.user } }, error: null };
      } catch (error: any) {
        return { data: { session: null }, error: error.response?.data || error };
      }
    },
  },
  // Legacy from() method - redirect to new API
  from: (table: string) => ({
    select: async (columns = '*') => {
      try {
        const endpoint = `/${table}`;
        const response = await api.get(endpoint);
        return { data: response.data, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },
    insert: async (data: any) => {
      try {
        const endpoint = `/${table}`;
        const response = await api.post(endpoint, data);
        return { data: response.data, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },
    update: async (data: any) => ({
      eq: async (column: string, value: any) => {
        try {
          const endpoint = `/${table}/${value}`;
          const response = await api.put(endpoint, data);
          return { data: response.data, error: null };
        } catch (error: any) {
          return { data: null, error: error.response?.data || error };
        }
      },
    }),
    delete: () => ({
      eq: async (column: string, value: any) => {
        try {
          const endpoint = `/${table}/${value}`;
          const response = await api.delete(endpoint);
          return { data: response.data, error: null };
        } catch (error: any) {
          return { data: null, error: error.response?.data || error };
        }
      },
    }),
  }),
};

// Export api as default for new code
export default api;