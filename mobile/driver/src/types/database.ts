// Database types matching Supabase schema

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  driver_id: string;
  bus_id: string;
  route_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Driver;
  bus?: Bus;
  route?: Route;
}

export interface Bus {
  id: string;
  bus_number: string;
  registration_number: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
}

export interface Route {
  id: string;
  route_number: string;
  route_name: string;
  origin: string;
  destination: string;
  distance_km?: number;
  created_at: string;
}

export interface Trip {
  id: string;
  shift_id: string;
  trip_number: string;
  route_id: string;
  scheduled_departure: string;
  actual_departure?: string;
  scheduled_arrival?: string;
  actual_arrival?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  passengers_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  shift?: Shift;
  route?: Route;
}

export interface Manifest {
  id: string;
  trip_id: string;
  passenger_name: string;
  seat_number: string;
  booking_reference?: string;
  checked_in: boolean;
  check_in_time?: string;
  status: 'booked' | 'boarded' | 'no_show' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  driver_id: string;
  trip_id?: string;
  shift_id?: string;
  type: 'mechanical' | 'passenger' | 'road' | 'accident' | 'other';
  description: string;
  photo_url?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface TripLog {
  id: string;
  trip_id: string;
  event: 'departure' | 'arrival' | 'stop' | 'delay' | 'incident' | 'note';
  timestamp: string;
  note?: string;
  location?: string;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  created_at: string;
  synced: boolean;
  synced_at?: string;
  error?: string;
}
