# Multi-Passenger Ticket Display Fix

## Problem

The ticket was only showing 1 passenger even though 4 bookings were created. The issue was in how the booking object was structured in `fetchBookingDetails`.

### Root Cause:

```typescript
// ❌ Problem: Mixing firstBooking passenger data with aggregate data
const firstBooking = allBookings[0];

setBooking({
  ...firstBooking,  // ❌ This spreads passenger_name, passenger_phone, seat_number from FIRST booking only
  trips: tripData,
  passengers: allBookings,  // ✅ This has all passengers
  total_amount: totalAmount,
  passenger_count: allBookings.length,
});
```

**What happened:**
- `...firstBooking` spread individual passenger fields (`passenger_name`, `passenger_phone`, `seat_number`) from the **first booking only**
- This created confusion between individual passenger data and aggregate data
- The `passengers` array was correct, but the root-level fields were wrong

---

## Solution

### 1. **Separate Trip Info from Passenger Data** ✅

Don't spread `firstBooking` into the main object. Instead, create a clean structure:

```typescript
// ✅ Clean structure - no mixing of individual and aggregate data
setBooking({
  booking_reference: bookingRef,
  trips: tripData,
  passengers: allBookings.map(b => ({
    passenger_name: b.passenger_name,
    passenger_phone: b.passenger_phone,
    passenger_email: b.passenger_email,
    seat_number: b.seat_number,
    total_amount: parseFloat(b.total_amount),
    booking_status: b.booking_status,
    payment_status: b.payment_status,
  })),
  total_amount: totalAmount,
  passenger_count: allBookings.length,
  payment_status: allBookings.every(b => b.payment_status === 'paid')
    ? 'paid'
    : allBookings.some(b => b.payment_status === 'partial')
    ? 'partial'
    : 'pending',
  booking_status: allBookings.every(b => b.booking_status === 'confirmed')
    ? 'confirmed'
    : 'pending',
  booking_date: allBookings[0].created_at,
});
```

---

### 2. **Aggregate Payment Status** ✅

Calculate overall payment status from all bookings:

```typescript
payment_status: allBookings.every(b => b.payment_status === 'paid')
  ? 'paid'           // All paid
  : allBookings.some(b => b.payment_status === 'partial')
  ? 'partial'        // At least one partial
  : 'pending',       // All pending
```

---

### 3. **Aggregate Booking Status** ✅

Calculate overall booking status:

```typescript
booking_status: allBookings.every(b => b.booking_status === 'confirmed')
  ? 'confirmed'      // All confirmed
  : 'pending',       // At least one pending
```

---

### 4. **Fix WhatsApp Integration** ✅

Updated to send all passenger details:

```typescript
const whatsappTicket = () => {
  if (!booking?.passengers || booking.passengers.length === 0) return;
  
  const firstPassenger = booking.passengers[0];
  const phone = firstPassenger.passenger_phone?.replace(/\D/g, '');
  
  // Build passenger list
  const passengerList = booking.passengers
    .map((p: any, i: number) => `${i + 1}. ${p.passenger_name} - Seat ${p.seat_number}`)
    .join('\n');
  
  const message = `Your booking is confirmed!

Booking Reference: ${booking.booking_reference}

Passengers (${booking.passenger_count}):
${passengerList}

Trip: ${booking.trips?.routes?.origin} → ${booking.trips?.routes?.destination}
Date: ${new Date(booking.trips?.departure_time).toLocaleString()}
Bus: ${booking.trips?.buses?.name || 'TBA'}

Total Amount: P${booking.total_amount?.toFixed(2)}
Payment Status: ${booking.payment_status}

Thank you for choosing Voyage Onboard!`;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
};
```

---

## Before vs After

### ❌ Before:

```typescript
// Booking object structure
{
  ...firstBooking,           // ❌ passenger_name, passenger_phone, seat_number from first booking only
  trips: tripData,
  passengers: allBookings,   // ✅ All passengers (but root fields were wrong)
  total_amount: 600,
  passenger_count: 4,
}

// WhatsApp message
const phone = booking?.passenger_phone;  // ❌ Undefined (no root passenger_phone)
const message = `Passenger: ${booking?.passenger_name}...`;  // ❌ Only first passenger
```

**Result:** Only showed first passenger's data

---

### ✅ After:

```typescript
// Booking object structure
{
  booking_reference: 'VB12345678-1',
  trips: tripData,
  passengers: [                // ✅ Clean passenger array
    { passenger_name: 'John Doe', seat_number: '12', total_amount: 150 },
    { passenger_name: 'Jane Smith', seat_number: '13', total_amount: 150 },
    { passenger_name: 'Bob Johnson', seat_number: '14', total_amount: 150 },
    { passenger_name: 'Alice Brown', seat_number: '15', total_amount: 150 },
  ],
  total_amount: 600,           // ✅ Sum of all
  passenger_count: 4,          // ✅ Count of all
  payment_status: 'paid',      // ✅ Aggregate status
  booking_status: 'confirmed', // ✅ Aggregate status
  booking_date: '2024-11-16T10:30:00Z',
}

// WhatsApp message
const phone = booking.passengers[0].passenger_phone;  // ✅ From passengers array
const passengerList = booking.passengers
  .map((p, i) => `${i + 1}. ${p.passenger_name} - Seat ${p.seat_number}`)
  .join('\n');  // ✅ All passengers listed
```

**Result:** Shows all 4 passengers correctly

---

## Ticket Display

### Passengers Section:

```
Passengers (4)

┌─────────────────────────────────────────────┐
│ John Doe                        Seat 12     │
│ +267 71 123 456                 P 150.00    │
│ john@example.com                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Jane Smith                      Seat 13     │
│ +267 71 234 567                 P 150.00    │
│ jane@example.com                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Bob Johnson                     Seat 14     │
│ +267 71 345 678                 P 150.00    │
│ bob@example.com                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Alice Brown                     Seat 15     │
│ +267 71 456 789                 P 150.00    │
│ alice@example.com                           │
└─────────────────────────────────────────────┘
```

### Payment Summary:

```
Total Amount: P 600.00
Payment Status: paid
Booking Status: confirmed
```

---

## WhatsApp Message Example

```
Your booking is confirmed!

Booking Reference: VB12345678-1

Passengers (4):
1. John Doe - Seat 12
2. Jane Smith - Seat 13
3. Bob Johnson - Seat 14
4. Alice Brown - Seat 15

Trip: Gaborone → Francistown
Date: 11/16/2024, 2:30:00 PM
Bus: BUS-001

Total Amount: P600.00
Payment Status: paid

Thank you for choosing Voyage Onboard!
```

---

## Key Benefits

✅ **Clean Data Structure** - No mixing of individual and aggregate data  
✅ **All Passengers Displayed** - Shows all 4 passengers, not just first  
✅ **Correct Total Amount** - Sum of all passenger fares  
✅ **Aggregate Statuses** - Overall payment and booking status  
✅ **Proper WhatsApp Integration** - Lists all passengers  
✅ **Scalable** - Works for 1-60 passengers dynamically  
✅ **Type Safe** - Explicit passenger array mapping  

---

## Result

✅ **Ticket shows all 4 passengers**  
✅ **Total amount is P 600.00 (4 × P 150.00)**  
✅ **Each passenger has their own seat number**  
✅ **WhatsApp message includes all passengers**  
✅ **Payment status aggregated correctly**  
✅ **No data confusion between individual and group**  

The multi-passenger ticket display is now fully functional! 🎉
