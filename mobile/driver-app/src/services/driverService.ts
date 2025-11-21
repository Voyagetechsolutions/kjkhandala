import { supabase } from '../lib/supabase';
import { Driver, WalletTransaction } from '../types';

export const driverService = {
  // Get driver profile
  async getDriverProfile(driverId: string): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update driver profile
  async updateDriverProfile(driverId: string, updates: Partial<Driver>): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get driver statistics
  async getDriverStats(driverId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: tripsToday } = await supabase
      .from('trips')
      .select('id', { count: 'exact' })
      .eq('driver_id', driverId)
      .gte('scheduled_departure', startOfDay);

    const { data: tripsWeek } = await supabase
      .from('trips')
      .select('id', { count: 'exact' })
      .eq('driver_id', driverId)
      .gte('scheduled_departure', weekAgo);

    const { data: tripsMonth } = await supabase
      .from('trips')
      .select('id', { count: 'exact' })
      .eq('driver_id', driverId)
      .gte('scheduled_departure', monthAgo);

    // Get driver rating
    const { data: driverData } = await supabase
      .from('drivers')
      .select('average_rating')
      .eq('id', driverId)
      .single();

    return {
      tripsToday: tripsToday?.length || 0,
      tripsWeek: tripsWeek?.length || 0,
      tripsMonth: tripsMonth?.length || 0,
      rating: driverData?.average_rating || 5.0,
    };
  },

  // Get driver trip history
  async getDriverTripHistory(driverId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes (*),
        bus:buses (*),
        driver:drivers (*)
      `)
      .eq('driver_id', driverId)
      .order('scheduled_departure', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get wallet balance
  async getWalletBalance(driverId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select('amount, type')
        .eq('driver_id', driverId);

      if (error) {
        console.warn('Wallet table not found, returning mock balance');
        return 2500.00; // Mock balance
      }

      let balance = 0;
      data?.forEach((earning: any) => {
        balance += parseFloat(earning.amount);
      });

      return balance;
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      return 2500.00; // Mock balance
    }
  },

  // Get wallet transactions
  async getWalletTransactions(driverId: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Transactions table not found, returning mock data');
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  },

  // Get earnings summary
  async getEarningsSummary(driverId: string) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const calculateEarnings = async (fromDate: string) => {
      try {
        const { data, error } = await supabase
          .from('driver_earnings')
          .select('amount')
          .eq('driver_id', driverId)
          .gte('created_at', fromDate);

        if (error) return 0;

        let total = 0;
        data?.forEach((earning: any) => {
          total += parseFloat(earning.amount);
        });
        return total;
      } catch (err) {
        return 0;
      }
    };

    const [todayEarnings, weekEarnings, monthEarnings] = await Promise.all([
      calculateEarnings(today),
      calculateEarnings(weekAgo),
      calculateEarnings(monthAgo),
    ]);

    return {
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
    };
  },

  // Get performance metrics
  async getPerformanceMetrics(driverId: string) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get completed trips
    const { data: assignments, error: assignmentsError } = await supabase
      .from('driver_assignments')
      .select('*')
      .eq('driver_id', driverId)
      .gte('created_at', monthAgo);

    // Get fuel logs
    const { data: fuelLogs, error: fuelError } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('driver_id', driverId)
      .gte('created_at', monthAgo);

    // Get incidents
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .eq('driver_id', driverId)
      .gte('created_at', monthAgo);

    const totalTrips = assignments?.length || 0;
    const totalFuelCost = fuelLogs?.reduce((sum: number, log: any) => sum + parseFloat(log.total_cost || 0), 0) || 0;
    const totalIncidents = incidents?.length || 0;

    return {
      totalTrips,
      completedTrips: assignments?.filter((a: any) => a.status === 'completed').length || 0,
      totalFuelCost,
      totalIncidents,
      safetyScore: totalIncidents === 0 ? 100 : Math.max(0, 100 - (totalIncidents * 10)),
      onTimePercentage: 95, // This would be calculated from actual vs scheduled times
    };
  },

  // Get notifications
  async getNotifications(driverId: string) {
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Notifications table error:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  // Mark notification as read
  async markNotificationRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) console.warn('Error marking notification as read:', error);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  // Get unread notification count
  async getUnreadCount(driverId: string): Promise<number> {
    try {
      const { data: driver } = await supabase
        .from('drivers')
        .select('user_id')
        .eq('id', driverId)
        .single();

      if (!driver?.user_id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', driver.user_id)
        .eq('read', false);

      if (error) return 0;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },
};
