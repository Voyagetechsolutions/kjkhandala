import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SellTicketData {
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  trip_id: string;
  seat_number: string;
  fare: number;
  payment_method: string;
  terminal_id?: string;
}

export function useSellTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketData: SellTicketData) => {
      // Get trip details to calculate total amount
      const { data: trip } = await supabase
        .from('trips')
        .select('fare')
        .eq('id', ticketData.trip_id)
        .single();
      
      const totalAmount = ticketData.fare || trip?.fare || 0;
      
      // Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          trip_id: ticketData.trip_id,
          seat_number: ticketData.seat_number,
          passenger_name: ticketData.passenger_name,
          passenger_phone: ticketData.passenger_phone,
          passenger_email: ticketData.passenger_email,
          fare: ticketData.fare,
          total_amount: totalAmount,
          status: 'CONFIRMED',
          payment_status: 'COMPLETED',
          payment_method: ticketData.payment_method,
          terminal_id: ticketData.terminal_id,
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          amount: totalAmount,
          payment_method: ticketData.payment_method,
          payment_status: 'COMPLETED',
          terminal_id: ticketData.terminal_id,
        }]);
      
      if (paymentError) throw paymentError;
      
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary-today'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
      toast.success('Ticket sold successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sell ticket');
    },
  });
}

export function useCheckInPassenger() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          check_in_time: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      toast.success('Passenger checked in successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in passenger');
    },
  });
}

export function useCancelTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'CANCELLED',
          payment_status: 'REFUNDED',
        })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update payment status
      await supabase
        .from('payments')
        .update({ payment_status: 'REFUNDED' })
        .eq('booking_id', bookingId);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
      toast.success('Ticket cancelled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel ticket');
    },
  });
}

export function useFindTicket() {
  return useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            trip_number,
            scheduled_departure,
            route:routes(name, origin, destination)
          )
        `)
        .or(`booking_reference.ilike.%${searchQuery}%,passenger_name.ilike.%${searchQuery}%,passenger_phone.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('ticket_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
    },
  });
}
