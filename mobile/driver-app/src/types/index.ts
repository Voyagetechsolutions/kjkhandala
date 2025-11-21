// Database types
export interface Driver {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  license_number: string;
  license_expiry: string;
  phone: string;
  emergency_contact: string;
  emergency_phone: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  trip_number: string;
  route_id: string;
  bus_id: string;
  driver_id: string;
  conductor_id?: string;
  departure_time: string;
  arrival_time: string;
  status: 'NOT_STARTED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
  total_seats: number;
  available_seats: number;
  price: number;
  created_at: string;
  updated_at: string;
  // Relations
  route?: Route;
  bus?: Bus;
  driver?: Driver;
  conductor?: any;
}

export interface Route {
  id: string;
  route_number: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_duration: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Bus {
  id: string;
  registration_number: string;
  bus_type: string;
  seating_capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  trip_id: string;
  user_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_id_number: string;
  seat_number: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  check_in_status: 'not_boarded' | 'boarded' | 'no_show';
  luggage: boolean;
  amount: number;
  created_at: string;
  // Relations
  trip?: Trip;
}

export interface TripInspection {
  id: string;
  trip_id: string;
  driver_id: string;
  inspection_type: 'pre_trip' | 'post_trip';
  // Exterior
  tyres_condition: 'good' | 'fair' | 'poor';
  lights_working: boolean;
  mirrors_condition: 'good' | 'damaged';
  body_damage?: string;
  windows_condition: 'good' | 'cracked' | 'broken';
  // Engine & Fluids
  engine_temperature: 'normal' | 'high' | 'low';
  oil_level: 'full' | 'low' | 'critical';
  coolant_level: 'full' | 'low' | 'critical';
  battery_condition: 'good' | 'weak' | 'dead';
  // Interior
  seats_condition: 'good' | 'damaged';
  seat_belts_working: boolean;
  ac_working: boolean;
  floor_condition: 'clean' | 'dirty' | 'damaged';
  cleanliness_rating: number;
  // Safety
  fire_extinguisher_present: boolean;
  fire_extinguisher_expiry?: string;
  first_aid_present: boolean;
  emergency_exit_working: boolean;
  warning_triangle_present: boolean;
  // Additional
  defects?: string;
  photos?: string[];
  has_critical_issues: boolean;
  odometer_reading?: number;
  fuel_level?: number;
  notes?: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  trip_id: string;
  driver_id: string;
  fuel_station: string;
  litres: number;
  price_per_litre: number;
  total_cost: number;
  odometer_reading: number;
  payment_method: 'company_card' | 'cash' | 'account';
  receipt_photo?: string;
  comments?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Incident {
  id: string;
  trip_id: string;
  driver_id: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  injuries_reported?: string;
  witnesses?: string;
  police_involved: boolean;
  police_report_number?: string;
  incident_time: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  photos?: string[];
  videos?: string[];
  need_assistance?: boolean;
  assistance_type?: string;
  status: 'reported' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface TripTimeline {
  id: string;
  trip_id: string;
  event_type: 'depart_depot' | 'arrive_pickup' | 'depart_pickup' | 'arrive_destination' | 'completed';
  location_lat?: number;
  location_lng?: number;
  delay_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface DriverMessage {
  id: string;
  driver_id: string;
  sender_id: string;
  message_type: 'general' | 'trip_update' | 'schedule_change' | 'announcement' | 'alert' | 'urgent';
  title: string;
  subject: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  driver_id: string;
  transaction_type: 'daily_allowance' | 'fuel_allowance' | 'trip_earning' | 'bonus' | 'deduction' | 'advance' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'paid';
  trip_id?: string;
  created_at: string;
}

export interface PassengerCheckin {
  id: string;
  booking_id: string;
  trip_id: string;
  driver_id: string;
  check_in_method: 'qr_scan' | 'manual';
  check_in_time: string;
  notes?: string;
  created_at: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  TripsList: undefined;
  TripDetails: { tripId: string };
  PassengerManifest: { tripId: string };
  QRScanner: { tripId: string };
  ManualCheckin: { tripId: string; bookingId: string };
  PreTripInspection: { tripId: string };
  PostTripInspection: { tripId: string };
  FuelLog: { tripId: string };
  IncidentReport: { tripId: string };
  LiveTracking: { tripId: string };
  MessagesList: undefined;
  MessageDetail: { messageId: string };
  TripTimeline: { tripId: string };
  Wallet: undefined;
  Profile: undefined;
  ProfileMain: undefined;
  PersonalInfo: undefined;
  LicenseDetails: undefined;
  TripHistory: undefined;
  PerformanceStats: undefined;
  Notifications: undefined;
  Settings: undefined;
  HelpSupport: undefined;
};
