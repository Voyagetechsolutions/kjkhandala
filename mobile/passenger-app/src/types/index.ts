// Passenger App Types - Aligned with Database Schema

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_hours: number;
  price?: number;
}

export interface Bus {
  id: string;
  registration_number: string;
  model: string;
  capacity: number;
}

export interface Trip {
  id: string;
  route_id: string;
  bus_id: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  available_seats: number;
  price: number;
  routes?: Route;
  buses?: Bus;
}

export interface Booking {
  id: string;
  trip_id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  seat_number: string;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  trips?: Trip;
}

export interface Passenger {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
}

export interface SavedPassenger {
  id: string;
  fullName: string;
  idNumber: string;
  relationship: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}
