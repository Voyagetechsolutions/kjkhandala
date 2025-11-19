import { supabase } from '../lib/supabase';
import { DriverMessage } from '../types';

export const messageService = {
  // Get messages for driver
  getDriverMessages: async (driverId: string): Promise<DriverMessage[]> => {
    const { data, error } = await supabase
      .from('driver_messages')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<void> => {
    const { error } = await supabase
      .from('driver_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  },

  // Get unread count
  getUnreadCount: async (driverId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('driver_messages')
      .select('id', { count: 'exact' })
      .eq('driver_id', driverId)
      .eq('is_read', false);

    if (error) throw error;
    return data?.length || 0;
  },
};
