# Booking Widget & Flow - Complete Implementation ✅

## Summary
Comprehensive booking flow with widget extension, passenger details, seat selection, payment options, and ticket generation.

---

## Phase 1: Booking Widget with Trip Display ✅

### **New Component: BookingWidget.tsx**

**Features:**
- ✅ Search form (From, To, Date, Passengers)
- ✅ Fetches cities from Supabase
- ✅ **Widget extends** when trips are found
- ✅ Displays available trips in expanded section
- ✅ Auto-slides in with animation
- ✅ Trip cards with full details:
  - Departure/Arrival times
  - Duration badge
  - Route information
  - Bus name and type
  - Available seats
  - Price per seat
  - "Select Trip" button
- ✅ Scrollable results (max-height with overflow)
- ✅ Loading states
- ✅ Empty state message
- ✅ Responsive design

**File Created:** `frontend/src/components/BookingWidget.tsx`

**Updated:** `frontend/src/components/NewHero.tsx` - Now uses BookingWidget

---

## Phase 2: Enhanced Passenger Details ✅

### **Updated: PassengerDetails.tsx**

**New Fields Added:**
1. **Personal Information:**
   - Title (Mr, Mrs, Miss, Ms, Dr)
   - Full Name
   - Gender (Male, Female, Other)

2. **Contact Details:**
   - Email *
   - Mobile *
   - Alternate Number

3. **Identification:**
   - ID Type (Omang, Passport, Driver's License, Other)
   - ID Number *

4. **Emergency Contact:**
   - Emergency Contact Name *
   - Emergency Contact Phone *

5. **Address Information:**
   - Country *
   - Physical Address * (Textarea)

**Features:**
- ✅ Organized in sections with headers
- ✅ Border separators between sections
- ✅ Icons for each section
- ✅ "Copy contact info to all" button
- ✅ All required fields marked with *
- ✅ Validation on all inputs
- ✅ Professional layout

**File Updated:** `frontend/src/pages/booking/steps/PassengerDetails.tsx`

---

## Phase 3: Seat Selection (Next Step)

### **Requirements:**
- Connect to ticketing dashboard seat selection
- Real-time seat availability
- Prevent double booking
- Visual seat map
- Selected seats highlight
- Seat numbers display

### **Integration Points:**
- Uses same `SeatSelection.tsx` component
- Connects to `bookings` table
- Updates `available_seats` in real-time
- Locks seats during booking process

---

## Phase 4: Payment Options (Next Step)

### **Two Payment Methods:**

#### 1. **Payment at Office**
- Reserve tickets online
- Pay at physical office
- **Reservation Rules:**
  - Tickets held until 2 hours before departure
  - Auto-cancel if not paid
  - Send reservation confirmation email
  - Include office locations
  - Payment deadline clearly stated

#### 2. **Online Payment**
- Immediate payment processing
- Payment gateway integration
- Instant confirmation
- Generate ticket immediately

### **Payment Step Updates Needed:**
- Add payment method selection
- Office payment flow
- Reservation system
- Auto-cancellation logic (2 hours before departure)
- Email notifications

---

## Phase 5: Ticket Generation (Next Step)

### **Requirements:**
- Same ticket format as ticketing dashboard
- QR code for verification
- Passenger details
- Trip information
- Seat numbers
- Payment status
- Booking reference
- Terms & conditions

### **Ticket Features:**
- PDF download
- Email delivery
- Print option
- Mobile-friendly view
- QR code scanning at check-in

---

## Booking Flow Steps

```
1. Search Trips (Widget extends)
   ↓
2. Select Trip
   ↓
3. Passenger Details (Enhanced form)
   ↓
4. Seat Selection (Visual seat map)
   ↓
5. Payment Method Selection
   ├─→ Pay at Office (Reservation)
   └─→ Pay Online (Immediate)
   ↓
6. Ticket Generation
   ↓
7. Confirmation & Download
```

---

## Database Schema Updates Needed

### **Bookings Table - Add Fields:**
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_title VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_gender VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_country VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50); -- 'online' or 'office'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_reservation BOOLEAN DEFAULT FALSE;
```

### **New Table: Seat Reservations**
```sql
CREATE TABLE IF NOT EXISTS seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  seat_number VARCHAR(10) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  reserved_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'reserved', -- 'reserved', 'confirmed', 'expired', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, seat_number, status)
);

-- Index for quick lookups
CREATE INDEX idx_seat_reservations_trip ON seat_reservations(trip_id);
CREATE INDEX idx_seat_reservations_expires ON seat_reservations(expires_at);
```

---

## Routes to Add

```typescript
// In App.tsx
<Route path="/book/passenger-details" element={<PassengerDetailsPage />} />
<Route path="/book/seat-selection" element={<SeatSelectionPage />} />
<Route path="/book/payment" element={<PaymentPage />} />
<Route path="/book/confirmation" element={<ConfirmationPage />} />
<Route path="/book/ticket/:bookingId" element={<TicketPage />} />
```

---

## Session Storage Flow

```typescript
// After trip selection
sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
sessionStorage.setItem('passengerCount', passengers.toString());

// After passenger details
sessionStorage.setItem('passengerDetails', JSON.stringify(passengers));

// After seat selection
sessionStorage.setItem('selectedSeats', JSON.stringify(seats));

// After payment
sessionStorage.setItem('bookingId', bookingId);
sessionStorage.setItem('paymentMethod', method);
```

---

## Email Notifications Needed

### **1. Reservation Confirmation (Office Payment)**
```
Subject: Ticket Reservation Confirmed - Pay by [Deadline]

Your tickets have been reserved!
Booking Reference: [REF]
Trip: [Origin] → [Destination]
Date: [Date]
Seats: [Seats]

IMPORTANT: Please pay at any of our offices before [Deadline]
Your reservation will be automatically cancelled if not paid.

Office Locations:
- [List of offices with addresses]
```

### **2. Payment Confirmation (Online Payment)**
```
Subject: Payment Confirmed - Your Tickets

Payment successful!
Booking Reference: [REF]
Amount Paid: P [Amount]

Your tickets are attached to this email.
Please present your ticket or QR code at check-in.
```

### **3. Reservation Expiry Warning**
```
Subject: Reminder: Pay for Your Reservation

Your reservation expires in 2 hours!
Booking Reference: [REF]

Please visit our office to complete payment.
```

---

## Auto-Cancellation System

### **Background Job Needed:**
```typescript
// Run every 15 minutes
async function cancelExpiredReservations() {
  const now = new Date();
  
  // Find expired reservations
  const { data: expired } = await supabase
    .from('bookings')
    .select('*')
    .eq('is_reservation', true)
    .eq('payment_status', 'pending')
    .lt('reservation_expires_at', now.toISOString());
  
  for (const booking of expired) {
    // Cancel booking
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        payment_status: 'cancelled'
      })
      .eq('id', booking.id);
    
    // Release seats
    await supabase
      .from('seat_reservations')
      .update({ status: 'expired' })
      .eq('booking_id', booking.id);
    
    // Send cancellation email
    await sendEmail(booking.passenger_email, 'reservationCancelled', booking);
  }
}
```

---

## Testing Checklist

### **Widget & Search:**
- [ ] Widget displays on homepage
- [ ] Search form validation works
- [ ] Cities load from database
- [ ] Search finds correct trips
- [ ] Widget extends smoothly
- [ ] Trip cards display all info
- [ ] "Select Trip" navigates correctly

### **Passenger Details:**
- [ ] All fields display correctly
- [ ] Validation works on required fields
- [ ] "Copy to all" button works
- [ ] Data persists between steps
- [ ] Mobile responsive

### **Seat Selection:**
- [ ] Seat map displays correctly
- [ ] Available/booked seats show properly
- [ ] Can select multiple seats
- [ ] Prevents double booking
- [ ] Real-time updates

### **Payment:**
- [ ] Both payment methods available
- [ ] Office payment creates reservation
- [ ] Online payment processes correctly
- [ ] Reservation expiry set correctly
- [ ] Emails sent

### **Ticket:**
- [ ] Ticket generates correctly
- [ ] QR code displays
- [ ] PDF download works
- [ ] Email delivery works
- [ ] Matches ticketing dashboard format

---

## Status: 🚧 IN PROGRESS

### ✅ Completed:
1. Booking Widget with trip display
2. Enhanced Passenger Details form
3. Widget extension animation
4. Trip search and display

### 🚧 Next Steps:
1. Update PaymentStep.tsx for office payment option
2. Add reservation system
3. Implement auto-cancellation
4. Update ticket generation
5. Add email notifications
6. Create background job for expiry
7. Test complete flow

---

## Files Modified/Created:

### Created:
- `frontend/src/components/BookingWidget.tsx` ✅

### Modified:
- `frontend/src/components/NewHero.tsx` ✅
- `frontend/src/pages/booking/steps/PassengerDetails.tsx` ✅

### To Modify:
- `frontend/src/pages/booking/steps/PaymentStep.tsx`
- `frontend/src/pages/booking/steps/SeatSelection.tsx`
- `frontend/src/pages/booking/steps/BookingConfirmation.tsx`
- `frontend/src/App.tsx` (add routes)

### To Create:
- Database migration for new fields
- Email templates
- Background job for auto-cancellation
- Ticket generation service

---

**Ready for next phase: Payment options and seat selection!** 🎯
