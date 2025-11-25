# Remaining Screens Implementation Guide

## ✅ Completed So Far

1. **SearchResultsScreen** - Fully implemented with trip search logic from frontend
2. **SeatSelectionScreen** - Visual seat picker with bus layout (needs minor type fix)

## 🚧 To Implement Next

### 1. PassengerDetailsScreen

**Purpose**: Collect passenger information for each seat

**Features**:
- Form for each passenger (based on selected seats)
- Fields: Full Name, ID/Passport Number, Phone, Email
- Validation for all fields
- Save to BookingContext
- Navigate to Payment

**Key Code Structure**:
```typescript
interface PassengerInfo {
  seatNumber: number;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
}

// For each selected seat, show a passenger form
// Validate all fields before continuing
// Store in BookingContext: setPassengers(passengersList)
```

### 2. PaymentScreen

**Purpose**: Payment summary and method selection

**Features**:
- Booking summary (trips, seats, passengers, total fare)
- Payment method selection:
  - Cash on Arrival
  - Orange Money (Botswana)
  - MyZaka (Botswana)
  - Card Payment
- Create booking in Supabase
- Process payment
- Navigate to Ticket

**Database Operations**:
```typescript
// Create booking
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    user_id: user.id,
    trip_id: selectedTrip.id,
    booking_reference: generateReference(),
    total_fare: calculateTotal(),
    status: 'CONFIRMED',
    payment_method: selectedMethod,
    payment_status: 'PENDING' // or 'PAID' for cash
  })
  .select()
  .single();

// Create passengers
await supabase
  .from('passengers')
  .insert(passengers.map(p => ({
    booking_id: booking.id,
    ...p
  })));

// Create payment record
await supabase
  .from('payments')
  .insert({
    booking_id: booking.id,
    amount: totalFare,
    payment_method: selectedMethod,
    status: paymentStatus
  });
```

### 3. TicketScreen (E-Ticket)

**Purpose**: Display booking confirmation with QR code

**Features**:
- Booking reference number
- QR code (use `react-native-qrcode-svg`)
- Trip details (date, time, route)
- Passenger names and seat numbers
- Payment status
- Download/Share ticket
- Navigate to My Trips

**QR Code Implementation**:
```typescript
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={bookingReference}
  size={200}
  color="#111827"
  backgroundColor="#ffffff"
/>
```

### 4. MyTripsScreen (Full Implementation)

**Purpose**: Display user's bookings

**Features**:
- Fetch bookings from Supabase
- Tabs: Upcoming / Past
- Trip cards with status badges
- View ticket details
- Cancel booking (if allowed)

**Database Query**:
```typescript
const { data: bookings } = await supabase
  .from('bookings')
  .select(`
    *,
    trips (
      *,
      routes (origin, destination),
      buses (name, bus_type)
    ),
    passengers (*),
    payments (*)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### 5. Calendar Date Picker

**Install Package**:
```bash
npm install react-native-calendars
```

**Implementation in HomeScreen**:
```typescript
import { Calendar } from 'react-native-calendars';

<Calendar
  onDayPress={(day) => {
    setSearchForm({ ...searchForm, departureDate: day.dateString });
  }}
  markedDates={{
    [searchForm.departureDate]: {
      selected: true,
      selectedColor: '#2563eb'
    }
  }}
  minDate={new Date().toISOString().split('T')[0]}
  theme={{
    selectedDayBackgroundColor: '#2563eb',
    todayTextColor: '#2563eb',
    arrowColor: '#2563eb',
  }}
/>
```

## 📋 Type Fixes Needed

### BookingContext

Check and update the BookingContext to ensure seat numbers are handled correctly:

```typescript
// In src/context/BookingContext.tsx
selectedSeats: number[] | string[]  // Update type
setSelectedSeats: (seats: number[] | string[]) => void
```

Or convert strings to numbers in SeatSelectionScreen:
```typescript
setSelectedSeats(selectedOutboundSeats.map(s => parseInt(s)))
```

## 🎨 Styling Guidelines

All screens should use:
- **Primary Blue**: `#2563eb`
- **Green**: `#10b981`
- **Red**: `#ef4444`
- **Background**: `#f9fafb`
- **White cards** with shadows
- **Consistent spacing**: 8, 12, 16, 24px
- **Border radius**: 8-12px
- **Icons from** `@expo/vector-icons`

## 🔄 Navigation Flow

```
Home → SearchResults → SeatSelection → PassengerDetails → Payment → Ticket → MyTrips
```

## ✅ Testing Checklist

1. [ ] Search for trips with valid cities and dates
2. [ ] Select outbound trip
3. [ ] Select return trip (if return journey)
4. [ ] Select seats for outbound
5. [ ] Select seats for return (if applicable)
6. [ ] Fill passenger details
7. [ ] Select payment method
8. [ ] Complete booking
9. [ ] View e-ticket with QR code
10. [ ] View booking in My Trips
11. [ ] Test with/without authentication

## 📦 Additional Packages Needed

```bash
npm install react-native-calendars
npm install react-native-qrcode-svg
```

## 🚀 Priority Order

1. **Fix SeatSelectionScreen type issues** (5 min)
2. **Implement PassengerDetailsScreen** (30 min)
3. **Implement PaymentScreen** (45 min)
4. **Implement TicketScreen** (30 min)
5. **Implement MyTripsScreen full version** (30 min)
6. **Add Calendar to HomeScreen** (15 min)
7. **End-to-end testing** (30 min)

Total estimated time: ~3 hours

## 📝 Notes

- All database operations should include proper error handling
- Use loading states for async operations
- Provide user feedback with Alert or Toast
- Validate all user inputs
- Handle edge cases (no internet, API errors, etc.)
- Test on both iOS and Android if possible
