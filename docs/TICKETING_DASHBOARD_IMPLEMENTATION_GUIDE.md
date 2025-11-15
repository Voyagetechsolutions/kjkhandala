# 🎫 TICKETING DASHBOARD - COMPLETE IMPLEMENTATION GUIDE

## Overview
This guide implements a fully dynamic Ticketing Control Panel connected to Supabase with real-time updates. No mock data.

---

## Step 1: Database Schema

### 1.1 Core Tables

```sql
-- Tickets table (bookings)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone_number TEXT,
  email TEXT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_number TEXT,
  fare NUMERIC NOT NULL,
  status TEXT DEFAULT 'booked', -- booked, checked_in, cancelled, no_show
  payment_status TEXT DEFAULT 'unpaid', -- paid, unpaid, refunded
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  terminal_id UUID REFERENCES terminals(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL, -- cash, card, mobile_money, bank_transfer
  reference_number TEXT,
  status TEXT DEFAULT 'completed', -- completed, pending, failed, refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  terminal_id UUID REFERENCES terminals(id)
);

-- Terminals table
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  terminal_code TEXT UNIQUE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS ticket_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- low_seats, overbooked, delayed
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconciliation table
CREATE TABLE IF NOT EXISTS daily_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id UUID REFERENCES terminals(id),
  reconciliation_date DATE NOT NULL,
  expected_cash NUMERIC,
  actual_cash NUMERIC,
  variance NUMERIC,
  notes TEXT,
  reconciled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(terminal_id, reconciliation_date)
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reconciliation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all for authenticated users" ON tickets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON terminals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON ticket_alerts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON daily_reconciliation FOR ALL TO authenticated USING (true);
```

### 1.2 Triggers & Functions

```sql
-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  ticket_prefix TEXT;
  ticket_num TEXT;
BEGIN
  IF NEW.ticket_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  ticket_prefix := 'TKT' || TO_CHAR(NOW(), 'YYYYMMDD');
  ticket_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  NEW.ticket_number := ticket_prefix || '-' || ticket_num;
  
  WHILE EXISTS (SELECT 1 FROM tickets WHERE ticket_number = NEW.ticket_number) LOOP
    ticket_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    NEW.ticket_number := ticket_prefix || '-' || ticket_num;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Update available seats when ticket is sold/cancelled
CREATE OR REPLACE FUNCTION update_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' THEN
    -- Decrease available seats
    UPDATE trips 
    SET available_seats = available_seats - 1
    WHERE id = NEW.trip_id AND available_seats > 0;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
      -- Increase available seats
      UPDATE trips 
      SET available_seats = available_seats + 1
      WHERE id = NEW.trip_id;
    ELSIF OLD.status = 'cancelled' AND NEW.status = 'booked' THEN
      -- Decrease available seats
      UPDATE trips 
      SET available_seats = available_seats - 1
      WHERE id = NEW.trip_id AND available_seats > 0;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'booked' THEN
    -- Increase available seats
    UPDATE trips 
    SET available_seats = available_seats + 1
    WHERE id = OLD.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trip_seats
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_trip_seats();

-- Create low seat alerts
CREATE OR REPLACE FUNCTION create_low_seat_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_seats <= 5 AND NEW.available_seats > 0 THEN
    INSERT INTO ticket_alerts (trip_id, alert_type, message, severity)
    VALUES (
      NEW.id,
      'low_seats',
      'Trip ' || NEW.trip_number || ' has only ' || NEW.available_seats || ' seats remaining',
      CASE 
        WHEN NEW.available_seats <= 2 THEN 'high'
        WHEN NEW.available_seats <= 5 THEN 'medium'
        ELSE 'low'
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_low_seat_alert
AFTER UPDATE ON trips
FOR EACH ROW
WHEN (OLD.available_seats IS DISTINCT FROM NEW.available_seats)
EXECUTE FUNCTION create_low_seat_alert();
```

---

## Step 2: Dashboard Queries & Views

### 2.1 Create Dashboard Views

```sql
-- Ticketing Dashboard Stats
CREATE OR REPLACE VIEW ticketing_dashboard_stats AS
SELECT
  -- Today's metrics
  (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE) as tickets_sold_today,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as revenue_today,
  (SELECT COUNT(*) FROM trips WHERE DATE(scheduled_departure) = CURRENT_DATE AND status IN ('SCHEDULED', 'BOARDING')) as trips_available_today,
  (SELECT COUNT(*) FROM tickets WHERE status = 'checked_in' AND DATE(checked_in_at) = CURRENT_DATE) as passengers_checked_in_today,
  
  -- Overall metrics
  (SELECT COALESCE(AVG((total_seats - available_seats)::NUMERIC / NULLIF(total_seats, 0) * 100), 0) 
   FROM trips 
   WHERE DATE(scheduled_departure) = CURRENT_DATE) as avg_occupancy_rate,
  
  (SELECT COUNT(*) FROM ticket_alerts WHERE is_read = false) as unread_alerts;

-- Trip Occupancy View
CREATE OR REPLACE VIEW trip_occupancy AS
SELECT
  t.id,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.total_seats,
  t.available_seats,
  (t.total_seats - t.available_seats) as seats_sold,
  ROUND(((t.total_seats - t.available_seats)::NUMERIC / NULLIF(t.total_seats, 0) * 100), 2) as occupancy_percentage,
  t.status,
  b.name as bus_name,
  d.full_name as driver_name
FROM trips t
JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE DATE(t.scheduled_departure) = CURRENT_DATE
ORDER BY t.scheduled_departure;

-- Payment Summary View
CREATE OR REPLACE VIEW payment_summary_today AS
SELECT
  method,
  COUNT(*) as transaction_count,
  COALESCE(SUM(amount), 0) as total_amount
FROM payments
WHERE DATE(created_at) = CURRENT_DATE
  AND status = 'completed'
GROUP BY method;

-- Passenger Manifest View
CREATE OR REPLACE VIEW passenger_manifest AS
SELECT
  tk.id as ticket_id,
  tk.ticket_number,
  tk.passenger_name,
  tk.phone_number,
  tk.seat_number,
  tk.status,
  tk.payment_status,
  tk.checked_in_at,
  t.trip_number,
  r.name as route_name,
  r.origin,
  r.destination,
  t.scheduled_departure,
  t.scheduled_arrival,
  b.name as bus_name
FROM tickets tk
JOIN trips t ON tk.trip_id = t.id
JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
ORDER BY t.scheduled_departure, tk.seat_number;
```

---

## Step 3: React Query Hooks

### 3.1 Dashboard Stats Hook

```typescript
// hooks/useTicketingDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTicketingDashboardStats() {
  return useQuery({
    queryKey: ['ticketing-dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticketing_dashboard_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTripOccupancy() {
  return useQuery({
    queryKey: ['trip-occupancy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_occupancy')
        .select('*')
        .order('scheduled_departure');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: ['payment-summary-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_summary_today')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function usePassengerManifest(tripId?: string) {
  return useQuery({
    queryKey: ['passenger-manifest', tripId],
    queryFn: async () => {
      let query = supabase
        .from('passenger_manifest')
        .select('*');
      
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}

export function useTicketAlerts() {
  return useQuery({
    queryKey: ['ticket-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // Check for alerts every 15 seconds
  });
}
```

### 3.2 Ticket Operations Hooks

```typescript
// hooks/useTicketOperations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useSellTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketData: {
      passenger_name: string;
      phone_number: string;
      email?: string;
      trip_id: string;
      seat_number?: string;
      fare: number;
      payment_method: string;
      terminal_id?: string;
    }) => {
      // Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          passenger_name: ticketData.passenger_name,
          phone_number: ticketData.phone_number,
          email: ticketData.email,
          trip_id: ticketData.trip_id,
          seat_number: ticketData.seat_number,
          fare: ticketData.fare,
          status: 'booked',
          payment_status: 'paid',
          terminal_id: ticketData.terminal_id,
        }])
        .select()
        .single();
      
      if (ticketError) throw ticketError;
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          ticket_id: ticket.id,
          amount: ticketData.fare,
          method: ticketData.payment_method,
          status: 'completed',
          terminal_id: ticketData.terminal_id,
        }]);
      
      if (paymentError) throw paymentError;
      
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary-today'] });
      toast.success('Ticket sold successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sell ticket');
    },
  });
}

export function useCheckInPassenger() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      toast.success('Passenger checked in successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in passenger');
    },
  });
}

export function useCancelTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
      toast.success('Ticket cancelled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel ticket');
    },
  });
}

export function useFindTicket() {
  return useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          trip:trips(
            trip_number,
            scheduled_departure,
            route:routes(name, origin, destination)
          )
        `)
        .or(`ticket_number.ilike.%${searchQuery}%,passenger_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });
}
```

---

## Step 4: Realtime Subscriptions

```typescript
// hooks/useRealtimeTicketing.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtimeTicketing() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Subscribe to ticket changes
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
        }
      )
      .subscribe();
    
    // Subscribe to payment changes
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payment-summary-today'] });
          queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
        }
      )
      .subscribe();
    
    // Subscribe to trip changes
    const tripsChannel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trip-occupancy'] });
        }
      )
      .subscribe();
    
    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-alerts'] });
        }
      )
      .subscribe();
    
    return () => {
      ticketsChannel.unsubscribe();
      paymentsChannel.unsubscribe();
      tripsChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, [queryClient]);
}
```

---

## Step 5: Component Structure

### 5.1 Main Dashboard Component

```typescript
// pages/ticketing/TicketingDashboard.tsx
import { useTicketingDashboardStats, useTripOccupancy, usePaymentSummary, useTicketAlerts } from '@/hooks/useTicketingDashboard';
import { useRealtimeTicketing } from '@/hooks/useRealtimeTicketing';

export default function TicketingDashboard() {
  const { data: stats } = useTicketingDashboardStats();
  const { data: trips } = useTripOccupancy();
  const { data: payments } = usePaymentSummary();
  const { data: alerts } = useTicketAlerts();
  
  // Enable realtime updates
  useRealtimeTicketing();
  
  return (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tickets Sold Today"
          value={stats?.tickets_sold_today || 0}
          icon={<Ticket />}
        />
        <MetricCard
          title="Revenue Today"
          value={`$${stats?.revenue_today || 0}`}
          icon={<DollarSign />}
        />
        <MetricCard
          title="Trips Available"
          value={stats?.trips_available_today || 0}
          icon={<Bus />}
        />
        <MetricCard
          title="Avg Occupancy"
          value={`${stats?.avg_occupancy_rate?.toFixed(1) || 0}%`}
          icon={<Users />}
        />
      </div>
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Alerts */}
      {alerts && alerts.length > 0 && <AlertsSection alerts={alerts} />}
      
      {/* Trip Occupancy */}
      <TripOccupancyTable trips={trips || []} />
      
      {/* Payment Summary */}
      <PaymentSummaryCard payments={payments || []} />
    </div>
  );
}
```

---

## Step 6: Deployment Checklist

### 6.1 SQL Scripts to Run (in order)

1. ✅ Create tables (tickets, payments, terminals, ticket_alerts, daily_reconciliation)
2. ✅ Create triggers (generate_ticket_number, update_trip_seats, create_low_seat_alert)
3. ✅ Create views (ticketing_dashboard_stats, trip_occupancy, payment_summary_today, passenger_manifest)
4. ✅ Enable RLS policies

### 6.2 Frontend Setup

1. ✅ Create hooks folder with all query hooks
2. ✅ Implement realtime subscriptions
3. ✅ Build dashboard components
4. ✅ Add forms for selling tickets, check-in, etc.
5. ✅ Test all mutations and queries

---

## ✅ Result

- **Real-time dashboard** with live metrics
- **Dynamic trip occupancy** tracking
- **Payment reconciliation** with method breakdown
- **Passenger manifest** with check-in status
- **Low seat alerts** automatically generated
- **Ticket operations** (sell, check-in, cancel, find)
- **No mock data** - all connected to Supabase

**Ready to implement!** 🚀
