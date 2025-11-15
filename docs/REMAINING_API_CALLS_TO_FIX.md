# Remaining API Calls to Fix - Complete List

## 🚨 Critical: These files still use fetch() to localhost:3001

All these need to be replaced with direct Supabase calls.

### Priority 1: Settings Pages (User Profile & Company)

#### 1. **settings/Profile.tsx**
```typescript
// CURRENT (404 errors):
fetch('http://localhost:3001/api/users/profile')
fetch('http://localhost:3001/api/users/password')
fetch('http://localhost:3001/api/users/profile/photo')

// REPLACE WITH:
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

const { error } = await supabase
  .from('profiles')
  .update({ full_name, phone, email })
  .eq('id', userId);

// For password: use Supabase Auth
await supabase.auth.updateUser({ password: newPassword });
```

#### 2. **settings/Company.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/settings/company')

// REPLACE WITH:
const { data, error } = await supabase
  .from('company_settings')  // Create this table
  .select('*')
  .single();
```

#### 3. **settings/NotificationSettings.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/users/notification-preferences')

// REPLACE WITH:
const { data, error } = await supabase
  .from('notification_preferences')  // Create this table
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Priority 2: Maintenance Pages

#### 4. **maintenance/Preventive.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/maintenance/preventive')

// REPLACE WITH:
const { data, error } = await supabase
  .from('maintenance_records')
  .select('*, buses(*)')
  .eq('maintenance_type', 'preventive')
  .order('service_date', { ascending: false });

// INSERT:
const { error } = await supabase
  .from('maintenance_records')
  .insert([{
    bus_id: busId,
    maintenance_type: 'preventive',
    description: description,
    cost: cost,
    service_date: new Date().toISOString(),
    status: 'scheduled'
  }]);
```

#### 5. **maintenance/Parts.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/maintenance/parts')

// REPLACE WITH:
const { data, error } = await supabase
  .from('maintenance_parts')  // Create this table
  .select('*')
  .order('name');

// INSERT:
const { error } = await supabase
  .from('maintenance_parts')
  .insert([{
    name: partName,
    part_number: partNumber,
    quantity: quantity,
    unit_price: unitPrice,
    supplier: supplier,
    minimum_stock: minStock
  }]);
```

#### 6. **maintenance/Breakdowns.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/maintenance/breakdowns')

// REPLACE WITH:
const { data, error } = await supabase
  .from('incidents')  // Use existing incidents table
  .select('*, buses(*), drivers(*)')
  .eq('type', 'breakdown')
  .order('created_at', { ascending: false });

// INSERT:
const { error } = await supabase
  .from('incidents')
  .insert([{
    bus_id: busId,
    driver_id: driverId,
    type: 'breakdown',
    severity: severity,
    description: description,
    location: location,
    status: 'OPEN'
  }]);
```

### Priority 3: Reports Pages

#### 7. **reports/DailySales.tsx**
```typescript
// CURRENT:
fetch(`http://localhost:3001/api/reports/daily-sales/${date}`)

// REPLACE WITH:
const { data, error } = await supabase
  .from('bookings')
  .select('total_amount, payment_status, created_at')
  .gte('booking_date', `${date}T00:00:00Z`)
  .lt('booking_date', `${date}T23:59:59Z`)
  .eq('payment_status', 'COMPLETED');

// Calculate totals:
const totalSales = data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
```

#### 8. **reports/DriverPerformance.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/users?role=DRIVER')
fetch(`http://localhost:3001/api/reports/driver-performance/${driverId}`)

// REPLACE WITH:
const { data: drivers } = await supabase
  .from('drivers')
  .select('*')
  .eq('status', 'ACTIVE')
  .order('last_name');

// Performance data:
const { data: trips } = await supabase
  .from('trips')
  .select('*, incidents(*)')
  .eq('driver_id', driverId)
  .gte('departure_time', startDate)
  .lte('departure_time', endDate);
```

#### 9. **reports/TripPerformance.tsx**
```typescript
// CURRENT:
fetch(`http://localhost:3001/api/reports/trip-performance?startDate=${startDate}&endDate=${endDate}`)

// REPLACE WITH:
const { data, error } = await supabase
  .from('trips')
  .select('*, routes(*), buses(*), bookings(*)')
  .gte('departure_time', startDate)
  .lte('departure_time', endDate)
  .order('departure_time', { ascending: false });
```

### Priority 4: HR Pages

#### 10. **hr/Shifts.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/hr/shifts')

// REPLACE WITH:
const { data, error } = await supabase
  .from('staff_shifts')  // Create this table
  .select('*, staff(*)')
  .order('shift_date', { ascending: false });
```

#### 11. **hr/Attendance.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/hr/attendance')

// REPLACE WITH:
const { data, error } = await supabase
  .from('staff_attendance')
  .select('*, staff(*)')
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false });
```

#### 12. **hr/Payroll.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/hr/payroll')

// REPLACE WITH:
const { data, error } = await supabase
  .from('staff_payroll')
  .select('*, staff(*)')
  .order('pay_period', { ascending: false });
```

### Priority 5: Tracking

#### 13. **tracking/LiveMap.tsx**
```typescript
// CURRENT:
fetch('http://localhost:3001/api/tracking/buses')

// REPLACE WITH:
const { data, error } = await supabase
  .from('bus_locations')  // Create this table for GPS tracking
  .select('*, buses(*)')
  .order('timestamp', { ascending: false });

// OR use Supabase Realtime:
const channel = supabase
  .channel('bus-locations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bus_locations'
  }, (payload) => {
    console.log('Location update:', payload);
  })
  .subscribe();
```

## 📋 Additional Tables Needed

Create these tables in Supabase:

```sql
-- Company settings
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance parts
CREATE TABLE maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_number TEXT,
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  minimum_stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff shifts
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  shift_type TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bus locations (for GPS tracking)
CREATE TABLE bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Action Plan

1. **Run the additional tables SQL** in Supabase
2. **Start with Settings pages** (most critical for users)
3. **Then Maintenance pages** (high usage)
4. **Then Reports pages** (read-only, easier)
5. **Then HR pages**
6. **Finally Tracking** (may need Realtime setup)

## ✅ Testing Checklist

For each page:
- [ ] Remove all `fetch('http://localhost:3001/...` calls
- [ ] Replace with `supabase.from('table')...` calls
- [ ] Test INSERT operations
- [ ] Test SELECT/READ operations
- [ ] Test UPDATE operations
- [ ] Test DELETE operations
- [ ] Verify data appears in Supabase dashboard
- [ ] Check browser console for errors

## 🚀 Expected Result

After fixing all these:
- ❌ No more 404 errors
- ✅ All forms save successfully
- ✅ All data loads from Supabase
- ✅ Real-time updates work
- ✅ Application fully functional
