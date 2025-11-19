import { supabase } from '../lib/supabase';
import { Incident } from '../types';

export const incidentService = {
  // Create incident report
  createIncident: async (
    incident: Omit<Incident, 'id' | 'created_at' | 'status'>
  ): Promise<void> => {
    const { error } = await supabase
      .from('incidents')
      .insert({
        ...incident,
        status: 'reported',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Get incidents for driver
  getDriverIncidents: async (driverId: string): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get incidents for trip
  getTripIncidents: async (tripId: string): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Upload incident photo
  uploadIncidentPhoto: async (
    incidentId: string,
    photoUri: string
  ): Promise<string> => {
    const fileName = `incident_${incidentId}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('incidents')
      .upload(fileName, photoUri);

    if (error) throw error;
    return data.path;
  },
};
