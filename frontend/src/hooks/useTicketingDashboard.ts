import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTicketingDashboardStats() {
  return useQuery({
    queryKey: ['ticketing-dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticketing_dashboard_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTripOccupancy() {
  return useQuery({
    queryKey: ['trip-occupancy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_occupancy')
        .select('*')
        .order('scheduled_departure');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: ['payment-summary-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_summary_today')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function usePassengerManifest(tripId?: string) {
  return useQuery({
    queryKey: ['passenger-manifest', tripId],
    queryFn: async () => {
      let query = supabase
        .from('passenger_manifest')
        .select('*');
      
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useTicketAlerts() {
  return useQuery({
    queryKey: ['ticket-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // Check for alerts every 15 seconds
  });
}

export function useTerminals() {
  return useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('terminals')
        .select('*')
        .eq('is_active', true)
        .order('terminal_name');
      
      if (error) throw error;
      return data;
    },
  });
}
