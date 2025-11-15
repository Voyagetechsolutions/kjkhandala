import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  safeInsertMaintenanceRecord,
  fetchMaintenanceRecords,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceTypes,
  MaintenanceRecordInput
} from '@/lib/maintenanceHelpers';

// Fetch valid maintenance types from database
export function useMaintenanceTypes() {
  return useQuery({
    queryKey: ['maintenance-types'],
    queryFn: getMaintenanceTypes,
  });
}

// Fetch active buses for dropdown
export function useActiveBuses() {
  return useQuery({
    queryKey: ['active-buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, number_plate, registration_number, make, model')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch staff/mechanics for performed_by field
export function useMaintenanceStaff() {
  return useQuery({
    queryKey: ['maintenance-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMaintenanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (record: MaintenanceRecordInput) => {
      const result = await safeInsertMaintenanceRecord(record);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast.success('Maintenance record added successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to add maintenance record:', error);
      toast.error(error.message || 'Failed to add maintenance record');
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaintenanceRecordInput> }) => {
      const result = await updateMaintenanceRecord(id, updates);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast.success('Maintenance record updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update maintenance record');
    },
  });
}

export function useDeleteMaintenanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMaintenanceRecord(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast.success('Maintenance record deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete maintenance record');
    },
  });
}

export function useMaintenanceRecords(busId?: string) {
  return useQuery({
    queryKey: ['maintenance-records', busId],
    queryFn: async () => {
      const result = await fetchMaintenanceRecords({ busId });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
  });
}
