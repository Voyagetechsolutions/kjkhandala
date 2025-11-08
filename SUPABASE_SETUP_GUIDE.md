# Supabase Setup Guide - KJ Khandala

## STEP 1: Create Supabase Project

1. Go to **https://supabase.com**
2. Sign up or login
3. Click **"New Project"**
4. Fill in:
   - **Project name:** `voyage-onboard-now`
   - **Database password:** Create strong password (save it!)
   - **Region:** Choose closest to you (e.g., `eu-west-1`)
5. Wait 2-3 minutes for initialization

---

## STEP 2: Get Your Credentials

Once project is ready:

1. Go to **Settings → API** (left sidebar)
2. Copy and save these:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon key** (public key, safe for frontend)
   - **service_role key** (secret, keep safe!)

Example:
```
VITE_SUPABASE_URL=https://miejkfzzbxirgpdmffsh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZWprZnp6YnhpcmdwZG1mZnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Mjk2NjUsImV4cCI6MjA3ODEwNTY2NX0.xTbi9JIVwsM6YVssnnL_nkIxbTE41c5TsqSCANjN3yo
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZWprZnp6YnhpcmdwZG1mZnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUyOTY2NSwiZXhwIjoyMDc4MTA1NjY1fQ.mz1_lRkwfYLP6ZaZfkW3_wGiJfpRjLk4byZzhcrSsiU
```

---

## STEP 3: Run SQL Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open file: `SUPABASE_SCHEMA.sql` (in project root)
4. Copy ALL content
5. Paste into SQL Editor
6. Click **"Run"** (top right)
7. Wait for completion (should see "Success" messages)

**What this does:**
- Creates all tables (buses, trips, bookings, payments, etc.)
- Sets up Row-Level Security (RLS) policies
- Creates helper functions
- Enables automatic `updated_at` timestamps

---

## STEP 4: Update Frontend `.env.local`

Create file: `frontend/.env.local`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Do NOT commit this file** (it's in `.gitignore`)

---

## STEP 5: Install Supabase Client

In `frontend/` directory, run:

```bash
npm install @supabase/supabase-js
```

---

## STEP 6: Create Supabase Client Hook

Create file: `frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper to get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## STEP 7: Update Frontend Pages to Use Supabase

### Example: Buses Page

**Before (using backend API):**
```typescript
const { data: buses } = useQuery({
  queryKey: ['buses'],
  queryFn: async () => {
    const response = await api.get('/buses');
    return response.data.data || [];
  },
});
```

**After (using Supabase):**
```typescript
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

const { data: buses } = useQuery({
  queryKey: ['buses'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('registration_number');
    
    if (error) throw error;
    return data || [];
  },
});
```

### Creating a Bus

**Before:**
```typescript
const createMutation = useMutation({
  mutationFn: async (formData) => {
    await api.post('/buses', formData);
  },
});
```

**After:**
```typescript
const createMutation = useMutation({
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
```

---

## STEP 8: Authentication Setup

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

if (error) throw error;

// Create profile after signup
await supabase.from('profiles').insert({
  id: data.user?.id,
  full_name: 'John Doe',
  email: 'user@example.com',
  role: 'CUSTOMER',
  company_id: 'your-company-id',
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

if (error) throw error;
// User is now authenticated
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log(user?.id); // User ID
```

---

## STEP 9: Real-Time Subscriptions (Optional)

Listen to live updates:

```typescript
const subscription = supabase
  .from('trips')
  .on('*', (payload) => {
    console.log('Trip updated:', payload);
    // Update UI
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## STEP 10: Row-Level Security (RLS)

The schema already includes RLS policies. Users can only:
- See their own profile
- See data from their company
- Drivers see only their assigned trips
- Admins see everything

**No additional setup needed** — it's automatic!

---

## Common Queries

### Get all buses for current user's company
```typescript
const { data: buses } = await supabase
  .from('buses')
  .select('*')
  .order('registration_number');
```

### Get trips for a route
```typescript
const { data: trips } = await supabase
  .from('trips')
  .select('*')
  .eq('route_id', routeId)
  .gte('departure_time', new Date().toISOString())
  .order('departure_time');
```

### Get bookings for a trip
```typescript
const { data: bookings } = await supabase
  .from('bookings')
  .select('*')
  .eq('trip_id', tripId)
  .eq('status', 'CONFIRMED');
```

### Create a booking
```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    trip_id: tripId,
    booking_user_id: userId,
    status: 'PENDING',
    total_amount: 150,
    seats: [{ seat_number: 'A1', passenger_name: 'John' }],
  })
  .select();
```

### Update trip status
```typescript
const { data, error } = await supabase
  .from('trips')
  .update({ status: 'DEPARTED' })
  .eq('id', tripId)
  .select();
```

### Delete a booking
```typescript
const { error } = await supabase
  .from('bookings')
  .delete()
  .eq('id', bookingId);
```

---

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` exists in `frontend/` folder
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server: `npm run dev`

### "RLS policy violation"
- User doesn't have permission for that action
- Check their role in `profiles` table
- Verify RLS policies in Supabase SQL Editor

### "Table does not exist"
- SQL schema wasn't run successfully
- Go to SQL Editor → run `SUPABASE_SCHEMA.sql` again
- Check for error messages in output

### "Authentication failed"
- User not found in `auth.users`
- Check email/password are correct
- Verify profile exists in `profiles` table

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run SQL schema
3. ✅ Update `.env.local`
4. ✅ Install `@supabase/supabase-js`
5. ✅ Create `frontend/src/lib/supabase.ts`
6. ✅ Update frontend pages (one by one)
7. ✅ Test authentication
8. ✅ Deploy to production

---

## Support

For issues:
- Check Supabase docs: https://supabase.com/docs
- View logs: Supabase Dashboard → Logs
- Test queries: SQL Editor in Supabase
