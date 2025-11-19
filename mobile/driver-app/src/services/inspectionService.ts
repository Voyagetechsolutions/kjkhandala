import { supabase } from '../lib/supabase';
import { TripInspection } from '../types';

export const inspectionService = {
  // Create pre-trip inspection
  createPreTripInspection: async (
    inspection: Omit<TripInspection, 'id' | 'created_at'>
  ): Promise<void> => {
    const { error } = await supabase
      .from('trip_inspections')
      .insert({
        ...inspection,
        inspection_type: 'pre_trip',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Create post-trip inspection
  createPostTripInspection: async (
    inspection: Omit<TripInspection, 'id' | 'created_at'>
  ): Promise<void> => {
    const { error } = await supabase
      .from('trip_inspections')
      .insert({
        ...inspection,
        inspection_type: 'post_trip',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Get inspections for a trip
  getTripInspections: async (tripId: string): Promise<TripInspection[]> => {
    const { data, error } = await supabase
      .from('trip_inspections')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Check if pre-trip inspection exists
  hasPreTripInspection: async (tripId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('trip_inspections')
      .select('id')
      .eq('trip_id', tripId)
      .eq('inspection_type', 'pre_trip')
      .single();

    return !!data && !error;
  },

  // Upload inspection photos
  uploadInspectionPhoto: async (
    tripId: string,
    photoUri: string
  ): Promise<string> => {
    const fileName = `inspection_${tripId}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('inspections')
      .upload(fileName, photoUri);

    if (error) throw error;
    return data.path;
  },
};
