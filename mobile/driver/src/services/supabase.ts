import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Custom storage adapter using SecureStore for tokens
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for common queries
export const driverQueries = {
  // Get driver profile by user ID
  async getDriverProfile(userId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get driver shifts
  async getDriverShifts(driverId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('shifts')
      .select(`
        *,
        bus:buses(*),
        route:routes(*)
      `)
      .eq('driver_id', driverId)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get trips for a shift
  async getShiftTrips(shiftId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        shift:shifts(*)
      `)
      .eq('shift_id', shiftId)
      .order('scheduled_departure', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get passenger manifest for a trip
  async getTripManifest(tripId: string) {
    const { data, error } = await supabase
      .from('manifest')
      .select('*')
      .eq('trip_id', tripId)
      .order('seat_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Update shift status
  async updateShiftStatus(shiftId: string, status: string) {
    const { data, error } = await supabase
      .from('shifts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update trip status
  async updateTripStatus(tripId: string, status: string, updates: any = {}) {
    const { data, error } = await supabase
      .from('trips')
      .update({ 
        status, 
        ...updates,
        updated_at: new Date().toISOString() 
      })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check in passenger
  async checkInPassenger(manifestId: string) {
    const { data, error } = await supabase
      .from('manifest')
      .update({
        checked_in: true,
        check_in_time: new Date().toISOString(),
        status: 'boarded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', manifestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create trip log
  async createTripLog(tripLog: {
    trip_id: string;
    event: string;
    timestamp: string;
    note?: string;
    location?: string;
  }) {
    const { data, error } = await supabase
      .from('trip_logs')
      .insert(tripLog)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create issue report
  async createIssue(issue: {
    driver_id: string;
    trip_id?: string;
    shift_id?: string;
    type: string;
    description: string;
    photo_url?: string;
    severity: string;
  }) {
    const { data, error } = await supabase
      .from('issues')
      .insert({
        ...issue,
        status: 'reported',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload issue photo
  async uploadIssuePhoto(file: Blob, fileName: string) {
    const { data, error } = await supabase.storage
      .from('issue-photos')
      .upload(`${Date.now()}-${fileName}`, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('issue-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },
};
