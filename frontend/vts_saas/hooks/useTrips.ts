import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Trips
export function useTrips(filters?: any) {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => {
      let query = supabase.from('trips').select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key as string, value as any);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: inserted, error } = await supabase.from('trips').insert(data).select().single();
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updated, error } = await supabase.from('trips').update(data).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', variables.id] });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, driverId }: { tripId: string; driverId: string }) => {
      const { data: updated, error } = await supabase
        .from('trips')
        .update({ driver_id: driverId })
        .eq('id', tripId)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// Bookings
export function useBookings(filters?: any) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query = supabase.from('bookings').select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key as string, value as any);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: inserted, error } = await supabase.from('bookings').insert(data).select().single();
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Routes
export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('routes').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('routes').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Buses
export function useBuses(filters?: any) {
  return useQuery({
    queryKey: ['buses', filters],
    queryFn: async () => {
      let query = supabase.from('buses').select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key as string, value as any);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBus(id: string) {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Drivers
export function useDrivers(filters?: any) {
  return useQuery({
    queryKey: ['drivers', filters],
    queryFn: async () => {
      let query = supabase.from('drivers').select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key as string, value as any);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Manifest
export function useManifest(tripId: string) {
  return useQuery({
    queryKey: ['manifest', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manifests')
        .select('*')
        .eq('trip_id', tripId);
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useUpdateManifest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: any }) => {
      // Example: upsert manifest rows for a trip
      const payload = Array.isArray(data) ? data : [data];
      const records = payload.map((row: any) => ({ ...row, trip_id: tripId }));
      const { data: upserted, error } = await supabase.from('manifests').upsert(records).select();
      if (error) throw error;
      return upserted;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manifest', variables.tripId] });
    },
  });
}
