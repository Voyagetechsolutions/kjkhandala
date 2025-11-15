# 🎯 Ticketing Terminal Dashboard - Complete Upgrade Guide

## Overview

This guide implements a **fully dynamic, real-time Terminal Agent Dashboard** integrated with Supabase, featuring:
- ✅ Real-time data fetching (no mock data)
- ✅ Live updates via Supabase Realtime
- ✅ Modern UI with charts and visualizations
- ✅ Complete ticketing workflow (Sell, Check-In, Find, Payments)
- ✅ Passenger manifest with PDF export
- ✅ Daily reconciliation and reports
- ✅ Terminal status monitoring

---

## 📋 Implementation Steps

### Step 1: Run SQL Schema (REQUIRED)

Execute the SQL file to create all necessary tables, views, and functions:

```bash
# In Supabase SQL Editor, run:
supabase/COMPLETE_10_ticketing_terminal_dashboard.sql
```

**What this creates:**
- ✅ `terminals` table - Terminal/POS management
- ✅ `ticket_alerts` table - Real-time seat alerts
- ✅ `daily_reconciliation` table - End-of-day cash reconciliation
- ✅ `ticketing_dashboard_stats` view - Real-time dashboard metrics
- ✅ `trip_occupancy` view - Live seat availability
- ✅ `payment_summary_today` view - Payment breakdown
- ✅ `passenger_manifest` view - Complete passenger lists
- ✅ Functions for dashboard operations
- ✅ Triggers for automatic updates

---

### Step 2: Install Required Dependencies

```bash
cd frontend
npm install recharts jspdf jspdf-autotable html5-qrcode qrcode.react
```

**Dependencies:**
- `recharts` - Charts and data visualization
- `jspdf` & `jspdf-autotable` - PDF generation
- `html5-qrcode` - QR code scanning
- `qrcode.react` - QR code generation

---

### Step 3: Verify Hooks are Set Up

The following hooks are already created:

**`src/hooks/useTicketingDashboard.ts`:**
- ✅ `useTicketingDashboardStats()` - Dashboard metrics
- ✅ `useTripOccupancy()` - Trip seat availability
- ✅ `usePaymentSummary()` - Payment breakdown
- ✅ `usePassengerManifest(tripId)` - Passenger lists
- ✅ `useTicketAlerts()` - Real-time alerts
- ✅ `useTerminals()` - Terminal management

**`src/hooks/useRealtimeTicketing.ts`:**
- ✅ Real-time subscriptions for bookings, payments, trips, alerts

---

## 🎨 Page-by-Page Implementation

### 1. Ticketing Dashboard (Home)

**File:** `src/pages/ticketing/TicketingDashboard.tsx`

**Current Status:** ✅ Already using hooks

**Features:**
- Real-time metrics (tickets sold, revenue, trips, occupancy)
- Quick actions (Sell Ticket, Check-In, Find Ticket)
- Low seat alerts
- Trip occupancy cards
- Payment breakdown

**Data Sources:**
```typescript
const { data: stats } = useTicketingDashboardStats();
const { data: trips } = useTripOccupancy();
const { data: payments } = usePaymentSummary();
const { data: alerts } = useTicketAlerts();
```

**Metrics Displayed:**
- `stats.tickets_sold_today` - Total tickets sold
- `stats.revenue_today` - Total revenue
- `stats.trips_available_today` - Available trips
- `stats.occupancy_rate_today` - Average occupancy %
- `stats.checked_in_today` - Checked in passengers
- `stats.pending_checkin_today` - Pending check-ins
- `stats.cash_today`, `card_today`, `mobile_money_today` - Payment breakdown

---

### 2. Sell Ticket Page

**File:** `src/pages/ticketing/SellTicket.tsx`

**Current Status:** ✅ Already layout-agnostic

**Workflow:**
1. Select route (origin → destination)
2. Select date
3. Show available trips
4. Select trip and seat
5. Enter passenger details
6. Select payment method
7. Process payment
8. Generate ticket with QR code

**Implementation:**

```typescript
// Fetch available trips
const { data: trips } = useQuery({
  queryKey: ['available-trips', selectedRoute, selectedDate],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        driver:profiles(*)
      `)
      .eq('route_id', selectedRoute)
      .gte('scheduled_departure', selectedDate)
      .lte('scheduled_departure', `${selectedDate}T23:59:59`)
      .eq('status', 'SCHEDULED')
      .gt('available_seats', 0)
      .order('scheduled_departure');
    
    if (error) throw error;
    return data;
  },
  enabled: !!selectedRoute && !!selectedDate
});

// Fetch booked seats for selected trip
const { data: bookedSeats } = useQuery({
  queryKey: ['booked-seats', selectedTrip],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('trip_id', selectedTrip)
      .in('status', ['CONFIRMED', 'CHECKED_IN', 'PENDING']);
    
    if (error) throw error;
    return data.map(b => b.seat_number);
  },
  enabled: !!selectedTrip
});

// Create booking
const createBooking = useMutation({
  mutationFn: async (bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        trip_id: bookingData.tripId,
        seat_number: bookingData.seatNumber,
        passenger_name: bookingData.passengerName,
        passenger_phone: bookingData.passengerPhone,
        passenger_email: bookingData.passengerEmail,
        passenger_id_number: bookingData.passengerIdNumber,
        fare: bookingData.fare,
        discount: bookingData.discount || 0,
        total_amount: bookingData.totalAmount,
        status: 'CONFIRMED',
        payment_status: bookingData.paymentStatus,
        payment_method: bookingData.paymentMethod,
        booked_by: user.id,
        is_online_booking: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Create payment record
    if (bookingData.paymentStatus === 'COMPLETED') {
      await supabase.from('payments').insert([{
        booking_id: data.id,
        amount: bookingData.totalAmount,
        payment_method: bookingData.paymentMethod,
        payment_status: 'COMPLETED',
        processed_by: user.id
      }]);
    }
    
    return data;
  },
  onSuccess: (data) => {
    toast.success(`Ticket ${data.booking_reference} created successfully!`);
    queryClient.invalidateQueries({ queryKey: ['available-trips'] });
    queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
  }
});
```

**UI Enhancements:**
- Visual seat map (grid layout with color coding)
- Multi-step wizard
- QR code generation for ticket
- Print ticket functionality

---

### 3. Check-In Page

**File:** `src/pages/ticketing/CheckIn.tsx`

**Current Status:** ✅ Already layout-agnostic

**Features:**
- QR code scanning
- Manual ticket number entry
- Passenger verification
- Real-time check-in count

**Implementation:**

```typescript
// Check-in mutation using SQL function
const checkInMutation = useMutation({
  mutationFn: async (bookingId: string) => {
    const { data, error } = await supabase
      .rpc('checkin_passenger', {
        p_booking_id: bookingId,
        p_checked_in_by: user.id
      });
    
    if (error) throw error;
    return data;
  },
  onSuccess: (result) => {
    if (result.success) {
      toast.success(`${result.passenger_name} checked in successfully!`);
      queryClient.invalidateQueries({ queryKey: ['ticketing-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-manifest'] });
    } else {
      toast.error(result.error);
    }
  }
});

// Find booking by reference
const findBooking = async (reference: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      trip:trips(
        *,
        route:routes(*)
      )
    `)
    .eq('booking_reference', reference)
    .single();
  
  if (error) throw error;
  return data;
};
```

**QR Code Scanning:**

```typescript
import { Html5QrcodeScanner } from 'html5-qrcode';

useEffect(() => {
  const scanner = new Html5QrcodeScanner(
    "qr-reader",
    { fps: 10, qrbox: 250 },
    false
  );
  
  scanner.render(
    (decodedText) => {
      // decodedText contains booking reference
      handleCheckIn(decodedText);
      scanner.clear();
    },
    (error) => {
      console.warn(error);
    }
  );
  
  return () => {
    scanner.clear();
  };
}, []);
```

---

### 4. Find Ticket Page

**File:** `src/pages/ticketing/FindTicket.tsx`

**Current Status:** ✅ Already layout-agnostic

**Search Options:**
- Ticket number
- Passenger name
- Phone number
- ID number

**Implementation:**

```typescript
const searchTickets = useQuery({
  queryKey: ['search-tickets', searchTerm, searchType],
  queryFn: async () => {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(
          *,
          route:routes(*)
        )
      `);
    
    switch (searchType) {
      case 'reference':
        query = query.eq('booking_reference', searchTerm);
        break;
      case 'name':
        query = query.ilike('passenger_name', `%${searchTerm}%`);
        break;
      case 'phone':
        query = query.eq('passenger_phone', searchTerm);
        break;
      case 'id':
        query = query.eq('passenger_id_number', searchTerm);
        break;
    }
    
    const { data, error } = await query.order('booking_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: searchTerm.length >= 3
});
```

---

### 5. Payments Page

**File:** `src/pages/ticketing/Payments.tsx`

**Current Status:** ✅ Already layout-agnostic, needs chart enhancement

**Features:**
- Payment breakdown by method
- Transaction history
- Daily reconciliation
- Charts (Pie chart for payment methods)

**Add Charts:**

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PaymentChart = ({ data }) => {
  const chartData = [
    { name: 'Cash', value: data.cash_today, color: '#10b981' },
    { name: 'Card', value: data.card_today, color: '#3b82f6' },
    { name: 'Mobile Money', value: data.mobile_money_today, color: '#f59e0b' }
  ];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

**Reconciliation:**

```typescript
const reconcileMutation = useMutation({
  mutationFn: async (reconciliationData) => {
    const { data, error } = await supabase
      .from('daily_reconciliation')
      .insert([{
        terminal_id: currentTerminal.id,
        agent_id: user.id,
        reconciliation_date: new Date().toISOString().split('T')[0],
        shift_start: shiftStartTime,
        shift_end: new Date(),
        expected_cash: stats.cash_today,
        expected_card: stats.card_today,
        expected_mobile: stats.mobile_money_today,
        expected_total: stats.revenue_today,
        actual_cash: reconciliationData.actualCash,
        actual_card: reconciliationData.actualCard,
        actual_mobile: reconciliationData.actualMobile,
        actual_total: reconciliationData.actualTotal,
        tickets_sold_count: stats.tickets_sold_today,
        notes: reconciliationData.notes,
        is_reconciled: true,
        reconciled_by: user.id,
        reconciled_at: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
});
```

---

### 6. Passenger Manifest Page

**File:** `src/pages/admin/PassengerManifest.tsx`

**Current Status:** Needs PDF export enhancement

**Features:**
- Select trip
- View all passengers
- Check-in status
- Download PDF

**PDF Export:**

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const exportToPDF = (trip, passengers) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('Passenger Manifest', 14, 22);
  
  // Trip details
  doc.setFontSize(12);
  doc.text(`Trip: ${trip.trip_number}`, 14, 32);
  doc.text(`Route: ${trip.route_name}`, 14, 39);
  doc.text(`Date: ${new Date(trip.scheduled_departure).toLocaleDateString()}`, 14, 46);
  doc.text(`Time: ${new Date(trip.scheduled_departure).toLocaleTimeString()}`, 14, 53);
  
  // Passenger table
  autoTable(doc, {
    startY: 60,
    head: [['Seat', 'Name', 'Phone', 'ID Number', 'Status', 'Check-In Time']],
    body: passengers.map(p => [
      p.seat_number,
      p.passenger_name,
      p.passenger_phone,
      p.passenger_id_number || 'N/A',
      p.checkin_status_label,
      p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString() : 'N/A'
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`manifest-${trip.trip_number}.pdf`);
};
```

---

### 7. Reports Page

**File:** `src/pages/ticketing/Reports.tsx`

**Current Status:** ✅ Already layout-agnostic

**Reports Available:**
- Daily Sales Summary
- Payment Breakdown
- Agent Performance
- Route Performance
- No-Show Report
- Check-In Report
- Refund Report
- Audit Log

**Implementation Example:**

```typescript
// Daily Sales Report
const dailySalesReport = useQuery({
  queryKey: ['daily-sales', dateRange],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(
          route:routes(*)
        ),
        payment:payments(*)
      `)
      .gte('booking_date', dateRange.startDate)
      .lte('booking_date', dateRange.endDate)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    
    // Calculate summary
    const summary = {
      totalBookings: data.length,
      totalRevenue: data.reduce((sum, b) => sum + parseFloat(b.total_amount), 0),
      confirmedBookings: data.filter(b => b.status === 'CONFIRMED').length,
      cancelledBookings: data.filter(b => b.status === 'CANCELLED').length,
      averageTicketPrice: data.length > 0 
        ? data.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) / data.length 
        : 0
    };
    
    return { bookings: data, summary };
  }
});
```

---

## 🔄 Real-Time Updates

**Already Implemented in `useRealtimeTicketing.ts`:**

The hook automatically subscribes to changes in:
- ✅ Bookings table
- ✅ Payments table
- ✅ Trips table (seat updates)
- ✅ Ticket alerts

**Usage:**

```typescript
import { useRealtimeTicketing } from '@/hooks/useRealtimeTicketing';

export default function TicketingDashboard() {
  // Enable real-time updates
  useRealtimeTicketing();
  
  // ... rest of component
}
```

---

## 🎨 UI Enhancements

### Color Coding

```typescript
// Seat availability colors
const getSeatColor = (available: number, total: number) => {
  const percentage = (available / total) * 100;
  if (percentage === 0) return 'bg-red-500';
  if (percentage <= 20) return 'bg-orange-500';
  if (percentage <= 50) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Status badges
const getStatusBadge = (status: string) => {
  const variants = {
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'CHECKED_IN': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'NO_SHOW': 'bg-gray-100 text-gray-800'
  };
  return variants[status] || 'bg-gray-100 text-gray-800';
};
```

---

## ✅ Testing Checklist

### Database Setup
- [ ] Run `COMPLETE_10_ticketing_terminal_dashboard.sql`
- [ ] Verify all tables created
- [ ] Verify all views created
- [ ] Verify all functions created
- [ ] Test triggers are working

### Dashboard
- [ ] Metrics show real data (not 0)
- [ ] Real-time updates work
- [ ] Alerts appear for low seats
- [ ] Charts render correctly

### Sell Ticket
- [ ] Can select route and date
- [ ] Available trips show correctly
- [ ] Seat map displays booked/available seats
- [ ] Booking creates successfully
- [ ] QR code generates
- [ ] Payment records correctly

### Check-In
- [ ] QR scanner works
- [ ] Manual entry works
- [ ] Validates payment status
- [ ] Prevents double check-in
- [ ] Updates dashboard stats

### Payments
- [ ] Payment breakdown shows correctly
- [ ] Charts display
- [ ] Reconciliation works
- [ ] Variance calculates correctly

### Manifest
- [ ] Trip selection works
- [ ] Passenger list displays
- [ ] PDF export works
- [ ] Check-in status accurate

---

## 🚀 Deployment

1. **Run SQL migrations:**
   ```sql
   -- In Supabase SQL Editor
   \i COMPLETE_10_ticketing_terminal_dashboard.sql
   ```

2. **Install dependencies:**
   ```bash
   npm install recharts jspdf jspdf-autotable html5-qrcode qrcode.react
   ```

3. **Test locally:**
   ```bash
   npm run dev
   ```

4. **Deploy:**
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

---

## 📊 Expected Results

After implementation:
- ✅ Dashboard shows live metrics
- ✅ Tickets sold counter updates in real-time
- ✅ Revenue tracks accurately
- ✅ Seat availability updates automatically
- ✅ Alerts appear for low seats
- ✅ Check-in process is seamless
- ✅ Reports generate dynamically
- ✅ PDF exports work
- ✅ No mock data anywhere

---

**Status:** 🟢 **READY FOR IMPLEMENTATION**

All SQL schemas, hooks, and real-time subscriptions are in place. Follow the page-by-page guide to enhance each component with the features described above.

**Last Updated:** November 13, 2025 - 2:35 AM
