import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtimeTicketing() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Subscribe to booking changes
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
          queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
        }
      )
      .subscribe();
    
    // Subscribe to payment changes
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payment-summary-today'] });
          queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
        }
      )
      .subscribe();
    
    // Subscribe to trip changes
    const tripsChannel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
        }
      )
      .subscribe();
    
    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
        }
      )
      .subscribe();
    
    return () => {
      bookingsChannel.unsubscribe();
      paymentsChannel.unsubscribe();
      tripsChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, [queryClient]);
}
