# Supabase Quick Reference Card

## 🚀 Setup (15 minutes)

```bash
# 1. Create project at https://supabase.com
# 2. Copy credentials from Settings → API
# 3. Create frontend/.env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# 4. Run SQL schema in Supabase SQL Editor
# Copy SUPABASE_SCHEMA.sql and run it

# 5. Install client
cd frontend && npm install @supabase/supabase-js
```

---

## 🔐 Authentication

```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/supabase';

// Sign up
await signUp('user@example.com', 'password', 'John Doe');

// Sign in
await signIn('user@example.com', 'password');

// Sign out
await signOut();

// Get current user
const user = await getCurrentUser();
```

---

## 📊 CRUD Operations

### SELECT (Read)
```typescript
// Fetch all
const { data } = await supabase.from('buses').select('*');

// With filter
const { data } = await supabase
  .from('buses')
  .select('*')
  .eq('status', 'ACTIVE');

// With order
const { data } = await supabase
  .from('buses')
  .select('*')
  .order('registration_number');

// With limit
const { data } = await supabase
  .from('buses')
  .select('*')
  .limit(10);

// With joins
const { data } = await supabase
  .from('trips')
  .select('*, bus:buses(*), driver:profiles(*)');
```

### INSERT (Create)
```typescript
const { data, error } = await supabase
  .from('buses')
  .insert([{
    registration_number: 'ABC123',
    make: 'Volvo',
    capacity: 50,
    company_id: userProfile.company_id,
  }])
  .select();

if (error) throw error;
```

### UPDATE (Modify)
```typescript
const { data, error } = await supabase
  .from('buses')
  .update({ status: 'IN_MAINTENANCE' })
  .eq('id', busId)
  .select();

if (error) throw error;
```

### DELETE (Remove)
```typescript
const { error } = await supabase
  .from('buses')
  .delete()
  .eq('id', busId);

if (error) throw error;
```

---

## 🔍 Filtering

```typescript
.eq('status', 'ACTIVE')
.neq('status', 'DELETED')
.gt('capacity', 40)
.gte('capacity', 40)
.lt('capacity', 60)
.lte('capacity', 60)
.in('status', ['ACTIVE', 'IDLE'])
.like('registration_number', '%ABC%')
.is('deleted_at', null)
.not('deleted_at', 'is', null)
```

---

## 📍 Ordering & Pagination

```typescript
// Order ascending
.order('registration_number', { ascending: true })

// Order descending
.order('created_at', { ascending: false })

// Pagination
.range(0, 9) // Items 0-9
.range(10, 19) // Items 10-19
```

---

## 🔄 Real-Time Subscriptions

```typescript
// Listen to inserts
const subscription = supabase
  .from('live_locations')
  .on('INSERT', (payload) => {
    console.log('New:', payload.new);
  })
  .subscribe();

// Listen to updates
const subscription = supabase
  .from('trips')
  .on('UPDATE', (payload) => {
    console.log('Updated:', payload.new);
  })
  .subscribe();

// Listen to deletes
const subscription = supabase
  .from('buses')
  .on('DELETE', (payload) => {
    console.log('Deleted:', payload.old);
  })
  .subscribe();

// Listen to all changes
const subscription = supabase
  .from('bookings')
  .on('*', (payload) => {
    console.log('Change:', payload);
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## 🎯 React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Fetch with React Query
const { data: buses } = useQuery({
  queryKey: ['buses'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('*');
    if (error) throw error;
    return data;
  },
});

// Mutate with React Query
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async (formData) => {
    const { data, error } = await supabase
      .from('buses')
      .insert([formData])
      .select();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  },
});

mutation.mutate({ registration_number: 'ABC123', capacity: 50 });
```

---

## 🔒 Row-Level Security

**Already configured! Users automatically see only:**
- Their own profile
- Their company's data
- Data they have permission to access

**No manual permission checks needed!**

---

## ⚠️ Common Mistakes

### ❌ Forgetting company_id
```typescript
// WRONG
await supabase.from('buses').insert({ registration_number: 'ABC' });

// RIGHT
await supabase.from('buses').insert({
  registration_number: 'ABC',
  company_id: userProfile.company_id
});
```

### ❌ Not handling errors
```typescript
// WRONG
const { data } = await supabase.from('buses').select();

// RIGHT
const { data, error } = await supabase.from('buses').select();
if (error) throw error;
```

### ❌ Forgetting .select() on mutations
```typescript
// WRONG
await supabase.from('buses').insert([data]);

// RIGHT
await supabase.from('buses').insert([data]).select();
```

### ❌ Using wrong filter method
```typescript
// WRONG
.where('trip_id', tripId)

// RIGHT
.eq('trip_id', tripId)
```

---

## 🧪 Testing in Browser Console

```typescript
import { supabase } from '@/lib/supabase';

// Test fetch
const { data } = await supabase.from('buses').select();
console.log(data);

// Test create
const { data: created } = await supabase
  .from('buses')
  .insert([{ registration_number: 'TEST', company_id: 'your-id' }])
  .select();
console.log(created);

// Test update
const { data: updated } = await supabase
  .from('buses')
  .update({ registration_number: 'TEST2' })
  .eq('id', created[0].id)
  .select();
console.log(updated);

// Test delete
const { error } = await supabase
  .from('buses')
  .delete()
  .eq('id', created[0].id);
console.log('Deleted:', !error);
```

---

## 📋 Main Tables

| Table | Purpose |
|-------|---------|
| profiles | Users with roles |
| companies | Multi-tenant companies |
| buses | Fleet vehicles |
| trips | Trip schedules |
| bookings | Passenger bookings |
| payment_transactions | Payments |
| routes | Trip routes |
| fuel_records | Fuel consumption |
| maintenance_records | Bus maintenance |
| work_orders | Maintenance work |
| attendance | Staff attendance |
| payrolls | Salary records |
| expenses | Company expenses |
| live_locations | GPS tracking |
| manifests | Passenger manifests |

---

## 🔗 Useful Links

- Supabase Docs: https://supabase.com/docs
- JS Client API: https://supabase.com/docs/reference/javascript
- Authentication: https://supabase.com/docs/guides/auth
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Real-Time: https://supabase.com/docs/guides/realtime

---

## 💡 Pro Tips

1. Always add company_id to inserts for RLS
2. Always check for errors after queries
3. Use .select() on mutations to get returned data
4. Use real-time subscriptions instead of polling
5. Test in console before writing full code
6. Keep .env.local secret - never commit it
7. Use React Query for caching and refetching

---

## 🚀 You're Ready!

Print this card and keep it handy while migrating!
