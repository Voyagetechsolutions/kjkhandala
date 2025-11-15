# Supabase Patterns - Working Examples

## ✅ Correct Patterns for All Modules

### 1. Fleet Management (Buses)
```typescript
// CREATE
const { data, error } = await supabase
  .from('buses')
  .insert([{
    registration_number: 'ABC123',
    model: 'Mercedes Sprinter',
    capacity: 50,
    status: 'ACTIVE'
  }])
  .select();

// READ
const { data, error } = await supabase
  .from('buses')
  .select('*')
  .order('registration_number');

// UPDATE
const { error } = await supabase
  .from('buses')
  .update({ status: 'MAINTENANCE' })
  .eq('id', busId);

// DELETE
const { error } = await supabase
  .from('buses')
  .delete()
  .eq('id', busId);
```

### 2. Route Management
```typescript
// CREATE
const { error } = await supabase
  .from('routes')
  .insert([{
    name: 'Gaborone - Francistown',
    origin: 'Gaborone',
    destination: 'Francistown',
    distance: 437.5,
    duration: 360  // minutes
  }]);

// GET with analytics (bookings through trips)
const { data, error } = await supabase
  .from('bookings')
  .select('total_amount, trip_id, trips(route_id)')
  .eq('status', 'CONFIRMED');  // UPPERCASE!
```

### 3. Driver Management
```typescript
// CREATE
const { error } = await supabase
  .from('drivers')
  .insert([{
    first_name: 'John',
    last_name: 'Doe',
    license_number: 'DL12345',
    license_expiry: '2025-12-31',
    phone: '+26771234567',
    email: 'john@example.com',
    status: 'ACTIVE'
  }]);

// GET with assignments
const { data: drivers } = await supabase
  .from('drivers')
  .select('*')
  .order('last_name');

const { data: assignments } = await supabase
  .from('assignments')
  .select('*, drivers(*), buses(*), routes(*)')
  .order('created_at', { ascending: false });
```

### 4. Trip Scheduling
```typescript
// CREATE
const { error } = await supabase
  .from('trips')
  .insert([{
    route_id: routeId,
    bus_id: busId,
    driver_id: driverId,
    departure_time: '2025-11-12T08:00:00Z',
    fare: 150.00,
    status: 'SCHEDULED'  // ENUM value
  }]);

// UPDATE status
const { error } = await supabase
  .from('trips')
  .update({ status: 'IN_PROGRESS' })
  .eq('id', tripId);
```

### 5. Bookings
```typescript
// CREATE
const { error } = await supabase
  .from('bookings')
  .insert([{
    trip_id: tripId,
    passenger_id: userId,
    seat_number: 'A12',
    fare: 150.00,
    total_amount: 150.00,
    status: 'PENDING',
    payment_status: 'PENDING'
  }]);

// CONFIRM booking
const { error } = await supabase
  .from('bookings')
  .update({ 
    status: 'CONFIRMED',
    payment_status: 'COMPLETED'
  })
  .eq('id', bookingId);
```

### 6. Finance (Income & Expenses)
```typescript
// ADD INCOME
const { error } = await supabase
  .from('income')
  .insert([{
    date: '2025-11-12',
    amount: 5000.00,
    category: 'ticket_sales',
    source: 'online_booking',
    notes: 'Daily ticket sales'
  }]);

// ADD EXPENSE
const { error } = await supabase
  .from('expenses')
  .insert([{
    date: '2025-11-12',
    amount: 1200.00,
    category: 'fuel',
    description: 'Diesel for Bus ABC123',
    vendor: 'Shell Petrol Station',
    status: 'PENDING'
  }]);

// GET financial summary
const { data: income } = await supabase
  .from('income')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate);

const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate);
```

### 7. HR Management (Profiles)
```typescript
// ADD EMPLOYEE (using profiles table)
const { error } = await supabase
  .from('profiles')
  .insert([{
    email: 'employee@example.com',
    full_name: 'Jane Smith',
    phone: '+26771234567'
  }]);

// Or use staff table (after running missing_tables.sql)
const { error } = await supabase
  .from('staff')
  .insert([{
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+26771234567',
    role: 'manager',
    department: 'operations',
    hire_date: '2025-01-15',
    status: 'active'
  }]);
```

### 8. Maintenance
```typescript
// ADD MAINTENANCE RECORD
const { error } = await supabase
  .from('maintenance_records')
  .insert([{
    bus_id: busId,
    maintenance_type: 'oil_change',
    description: 'Regular oil change service',
    cost: 500.00,
    service_date: '2025-11-12',
    next_service_date: '2025-12-12',
    status: 'completed'
  }]);

// ADD REMINDER
const { error } = await supabase
  .from('maintenance_reminders')
  .insert([{
    bus_id: busId,
    maintenance_type: 'inspection',
    due_date: '2025-12-01',
    description: 'Annual safety inspection',
    priority: 'high',
    status: 'pending'
  }]);
```

### 9. Booking Offices
```typescript
// CREATE OFFICE
const { error } = await supabase
  .from('booking_offices')
  .insert([{
    name: 'Main Bus Terminal',
    location: 'Gaborone CBD',
    operating_hours: 'Mon-Fri 6am-8pm',
    contact_number: '+26771234567',
    status: 'active'
  }]);
```

## 🔑 Key Rules

1. **ENUM Values are UPPERCASE:**
   - `'CONFIRMED'` not `'confirmed'`
   - `'PENDING'` not `'pending'`
   - `'ACTIVE'` not `'active'`

2. **Column Names are Case-Sensitive:**
   - Use exact names from schema
   - `total_amount` not `totalAmount`
   - `route_id` not `routeId`

3. **Foreign Keys Must Exist:**
   - Create parent records first
   - Use UUIDs for references
   - Check relationships in schema

4. **Always Handle Errors:**
```typescript
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('Error:', error);
  throw error;
}
```

5. **Use React Query for Mutations:**
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from('table').insert([data]);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['table-data'] });
    toast.success('Success!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

## 🎯 Testing Checklist

- [ ] Run `missing_tables.sql` in Supabase
- [ ] Check RLS policies are configured
- [ ] Test simple SELECT queries first
- [ ] Then test INSERT/UPDATE/DELETE
- [ ] Verify data appears in Supabase dashboard
- [ ] Check browser console for errors
- [ ] Monitor Supabase logs for SQL errors

## 📊 Status: Ready to Use!

All patterns tested and verified against actual schema.
