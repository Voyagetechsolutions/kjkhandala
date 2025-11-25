export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  duration_hours: number;
}

export interface Bus {
  id: string;
  name: string;
  registration_number: string;
  bus_type: string;
  seating_capacity: number;
}

export interface Trip {
  id: string;
  trip_number: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  fare: number;
  status: string;
  total_seats: number;
  available_seats: number;
  route: {
    origin: string;
    destination: string;
  };
  bus: {
    name: string;
    bus_type: string;
  };
  is_projected?: boolean;
}

export interface Booking {
  id: string;
  booking_reference: string;
  trip_id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  seat_number: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_method: 'office' | 'card' | 'mobile';
  payment_status: 'pending' | 'completed' | 'failed';
  qr_code: string;
  created_at: string;
  trip?: Trip;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
}

export interface SearchParams {
  from: string;
  to: string;
  travelDate: string;
  returnDate?: string;
  passengers: number;
  tripType: 'one-way' | 'return';
}

export interface LoyaltyAccount {
  id: string;
  customer_id: string;
  total_points: number;
  lifetime_points: number;
  tier: 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  account_id: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  description: string;
  booking_id?: string;
  created_at: string;
}

export interface LoyaltyRule {
  id: string;
  company_id?: string;
  points_per_pula: number;
  redemption_rate: number;
  tier_rules: {
    silver: { min_points: number; benefits: string[] };
    gold: { min_points: number; benefits: string[] };
    platinum: { min_points: number; benefits: string[] };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyDashboard {
  id: string;
  customer_id: string;
  email: string;
  customer_name: string;
  total_points: number;
  lifetime_points: number;
  tier: 'silver' | 'gold' | 'platinum';
  member_since: string;
  updated_at: string;
  total_transactions: number;
  total_earned: number;
  total_redeemed: number;
  points_to_next_tier: number;
  next_tier: 'silver' | 'gold' | 'platinum';
}

export interface RedeemPointsResponse {
  success: boolean;
  error?: string;
  points_redeemed?: number;
  discount_amount?: number;
  remaining_points?: number;
  available_points?: number;
  requested_points?: number;
}
