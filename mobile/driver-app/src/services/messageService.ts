import { supabase } from '../lib/supabase';
import { DriverMessage } from '../types';

export const messageService = {
  // Get messages for driver
  getDriverMessages: async (driverId: string): Promise<DriverMessage[]> => {
    try {
      // Get driver's user_id first
      const { data: driver } = await supabase
        .from('drivers')
        .select('user_id')
        .eq('id', driverId)
        .single();

      if (!driver?.user_id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', driver.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching messages:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error in getDriverMessages:', err);
      return [];
    }
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) console.warn('Error marking message as read:', error);
    } catch (err) {
      console.error('Error in markAsRead:', err);
    }
  },

  // Get unread count
  getUnreadCount: async (driverId: string): Promise<number> => {
    try {
      // Get driver's user_id first
      const { data: driver } = await supabase
        .from('drivers')
        .select('user_id')
        .eq('id', driverId)
        .single();

      if (!driver?.user_id) return 0;

      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', driver.user_id)
        .eq('read', false);

      if (error) return 0;
      return data?.length || 0;
    } catch (err) {
      return 0;
    }
  },
};
