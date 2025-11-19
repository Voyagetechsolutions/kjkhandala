import { supabase } from '../lib/supabase';
import { FuelLog } from '../types';

export const fuelService = {
  // Create fuel log
  createFuelLog: async (
    fuelLog: Omit<FuelLog, 'id' | 'created_at' | 'status'>
  ): Promise<void> => {
    const { error } = await supabase
      .from('fuel_logs')
      .insert({
        ...fuelLog,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Get fuel logs for driver
  getDriverFuelLogs: async (driverId: string): Promise<FuelLog[]> => {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get fuel logs for trip
  getTripFuelLogs: async (tripId: string): Promise<FuelLog[]> => {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Upload receipt photo
  uploadReceipt: async (
    driverId: string,
    photoUri: string
  ): Promise<string> => {
    const fileName = `receipt_${driverId}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('fuel_receipts')
      .upload(fileName, photoUri);

    if (error) throw error;
    return data.path;
  },
};
