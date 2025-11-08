export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_hours: number;
  base_price: number;
}

export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  bus_type: string;
  amenities?: string[];
}

export interface Schedule {
  id: string;
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  price: number;
  route?: Route;
  bus?: Bus;
}

export interface Booking {
  id: string;
  user_id: string;
  schedule_id: string;
  seat_numbers: string[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_reference: string;
  created_at: string;
  schedule?: Schedule;
}

export interface Passenger {
  name: string;
  id_number: string;
  phone: string;
  seat_number: string;
}
