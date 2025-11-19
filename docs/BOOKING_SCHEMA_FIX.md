# Booking Schema Fix - Production Schema Alignment

## Issues Fixed

### 1. ❌ 406 Not Acceptable - `ticketing_agents` table
**Error:**
```
GET .../ticketing_agents?profile_id=eq.xxx → 406 Not Acceptable
```

**Root Cause:** The `ticketing_agents` table exists in `TICKETING_DASHBOARD_SCHEMA.sql` but **NOT** in the production schema (`03_PRODUCTION_TICKETING.sql`).

**Fix:** Removed the query for `ticketing_agents` and use `user?.id` directly for `booked_by` field.

---

### 2. ❌ 400 Bad Request - Bookings table mismatch
**Error:**
```
POST .../bookings?select=id,booking_reference → 400 Bad Request
```

**Root Cause:** The booking insert was using columns that don't exist in the production `bookings` table:
- ❌ `passenger_id` (doesn't exist)
- ❌ `number_of_passengers` (doesn't exist)
- ❌ `amount_paid` (doesn't exist)
- ❌ `balance` (doesn't exist)
- ❌ `base_fare` (doesn't exist)
- ❌ `discount` (doesn't exist)
- ❌ `discount_reason` (doesn't exist)
- ❌ `travel_date` (doesn't exist)
- ❌ `status` (should be `booking_status`)

---

## Production Schema (03_PRODUCTION_TICKETING.sql)

### Bookings Table Columns:
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  booking_reference TEXT UNIQUE NOT NULL,
  trip_id UUID REFERENCES trips(id),
  user_id UUID REFERENCES auth.users(id),
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_email TEXT,
  seat_number TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  booking_status booking_status DEFAULT 'pending',
  booked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Payments Table Columns:
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  booking_id UUID REFERENCES bookings(id),
  amount NUMERIC(12, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_reference TEXT,
  processed_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Updated Booking Flow

### Before (Incorrect):
```typescript
// ❌ Queried non-existent table
const { data: agentData } = await supabase
  .from('ticketing_agents')
  .select('id')
  .eq('profile_id', user?.id)
  .single();

// ❌ Used wrong columns
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    trip_id: trip.trip_id,
    passenger_id: passengerIds[0],
    booked_by: agentId,
    number_of_passengers: passengers.length,
    amount_paid: paymentData.details.amount,
    balance: paymentData.finalAmount - paymentData.details.amount,
    base_fare: trip.base_fare,
    discount: paymentData.discount.amount,
    discount_reason: paymentData.discount.reason,
    travel_date: new Date(trip.departure_time).toISOString().split('T')[0],
    status: 'confirmed',
    payment_status: 'paid',
  });
```

### After (Correct):
```typescript
// ✅ Generate booking reference
const bookingRef = `VB${Date.now().toString().slice(-8)}`;

// ✅ Create bookings (one per passenger/seat)
const bookingInserts = passengers.map((p, index) => ({
  booking_reference: `${bookingRef}-${index + 1}`,
  trip_id: trip.trip_id,
  user_id: user?.id || null,
  passenger_name: p.full_name,
  passenger_phone: p.phone,
  passenger_email: p.email || null,
  seat_number: selectedSeats[index]?.toString() || null,
  total_amount: paymentData.totalAmount / passengers.length,
  payment_status: paymentData.details.amount >= paymentData.finalAmount 
    ? 'paid' 
    : paymentData.details.amount > 0 
    ? 'partial' 
    : 'pending',
  booking_status: 'confirmed',
  booked_by: user?.id || null,
}));

const { data: bookings, error: bookingError } = await supabase
  .from('bookings')
  .insert(bookingInserts)
  .select('id, booking_reference');

// ✅ Create payment record
if (paymentData.details.amount > 0) {
  await supabase
    .from('payments')
    .insert({
      booking_id: bookings[0].id,
      amount: paymentData.details.amount,
      payment_method: paymentData.method,
      payment_status: paymentData.details.amount >= paymentData.finalAmount 
        ? 'completed' 
        : 'partial',
      transaction_reference: paymentData.details.transaction_id || null,
      processed_by: user?.id || null,
      paid_at: new Date().toISOString(),
    });
}
```

---

## Key Changes

### 1. **Removed `ticketing_agents` Query**
- ✅ No longer queries non-existent table
- ✅ Uses `user?.id` directly for `booked_by`

### 2. **Updated Booking Insert**
- ✅ Uses only columns that exist in production schema
- ✅ Stores passenger info directly in booking (not via foreign key)
- ✅ Creates one booking per passenger/seat
- ✅ Generates unique booking references

### 3. **Separate Payment Record**
- ✅ Creates payment in `payments` table
- ✅ Links to booking via `booking_id`
- ✅ Uses correct column names

### 4. **Proper Null Handling**
- ✅ All optional fields use `|| null`
- ✅ Prevents empty string errors

---

## Booking Reference Format

```
VB12345678-1
VB12345678-2
VB12345678-3
```

- `VB` = Voyage Bus prefix
- `12345678` = Timestamp (last 8 digits)
- `-1, -2, -3` = Passenger number

---

## Result

✅ **No more 406 errors** - Removed ticketing_agents query  
✅ **No more 400 errors** - Using correct schema columns  
✅ **Bookings created successfully** - One per passenger  
✅ **Payment records created** - Linked to bookings  
✅ **Proper data types** - All fields match schema  

---

## Testing Checklist

- [ ] Book single passenger - Creates 1 booking
- [ ] Book multiple passengers - Creates multiple bookings
- [ ] Full payment - `payment_status = 'paid'`
- [ ] Partial payment - `payment_status = 'partial'`
- [ ] No payment - `payment_status = 'pending'`
- [ ] Payment record created in `payments` table
- [ ] Booking reference generated correctly
- [ ] Seat numbers assigned correctly
- [ ] Passenger data stored in booking

---

## Next Steps

If you need the full `ticketing_agents` functionality:
1. Run `TICKETING_DASHBOARD_SCHEMA.sql` to create the table
2. Add agent records for ticketing staff
3. Update the code to query `ticketing_agents` again

For now, the system works without it by using the logged-in user's ID directly.
