# Supabase Implementation Checklist

## Phase 1: Setup (Do First)

- [ ] **Create Supabase Project**
  - Go to https://supabase.com
  - Create new project named `voyage-onboard-now`
  - Save database password
  - Wait for initialization

- [ ] **Get Credentials**
  - Go to Settings → API
  - Copy Project URL
  - Copy anon key
  - Copy service_role key (keep secret!)

- [ ] **Create `.env.local`**
  - Location: `frontend/.env.local`
  - Add:
    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

- [ ] **Run SQL Schema**
  - Open Supabase SQL Editor
  - Create new query
  - Copy all content from `SUPABASE_SCHEMA.sql`
  - Run it
  - Verify no errors

- [ ] **Install Dependencies**
  - Run: `npm install @supabase/supabase-js`
  - In `frontend/` directory

---

## Phase 2: Frontend Migration (Do Sequentially)

### Step 1: Update Authentication Pages

- [ ] **Login Page** (`frontend/src/pages/auth/Login.tsx`)
  ```typescript
  import { signIn } from '@/lib/supabase';
  
  const handleLogin = async (email, password) => {
    await signIn(email, password);
    // Redirect to dashboard
  };
  ```

- [ ] **Register Page** (`frontend/src/pages/auth/Register.tsx`)
  ```typescript
  import { signUp } from '@/lib/supabase';
  
  const handleRegister = async (email, password, fullName) => {
    await signUp(email, password, fullName);
    // Redirect to login
  };
  ```

- [ ] **Logout Button**
  ```typescript
  import { signOut } from '@/lib/supabase';
  
  const handleLogout = async () => {
    await signOut();
    // Redirect to login
  };
  ```

### Step 2: Update Admin Pages (One by One)

#### FleetManagement.tsx
- [ ] Replace `api.get('/buses')` with Supabase query
- [ ] Replace `api.post('/buses', ...)` with Supabase insert
- [ ] Replace `api.put('/buses/:id', ...)` with Supabase update
- [ ] Replace `api.delete('/buses/:id')` with Supabase delete
- [ ] Test: Create, read, update, delete buses

#### DriverManagement.tsx
- [ ] Replace driver queries with Supabase
- [ ] Replace driver mutations with Supabase
- [ ] Test: Manage drivers

#### TripScheduling.tsx
- [ ] Replace trip queries with Supabase
- [ ] Replace trip mutations with Supabase
- [ ] Test: Schedule trips

#### Bookings.tsx
- [ ] Replace booking queries with Supabase
- [ ] Replace booking mutations with Supabase
- [ ] Test: Create bookings

#### FinanceManagement.tsx
- [ ] Replace payment queries with Supabase
- [ ] Replace expense queries with Supabase
- [ ] Test: View finances

#### HRManagement.tsx
- [ ] Replace staff queries with Supabase
- [ ] Replace attendance queries with Supabase
- [ ] Replace payroll queries with Supabase
- [ ] Test: Manage HR

#### MaintenanceManagement.tsx
- [ ] Replace maintenance queries with Supabase
- [ ] Replace work order queries with Supabase
- [ ] Test: Manage maintenance

#### LiveTracking.tsx
- [ ] Replace location queries with Supabase
- [ ] Add real-time subscription for live updates
- [ ] Test: View live tracking

#### PassengerManifest.tsx
- [ ] Replace manifest queries with Supabase
- [ ] Replace manifest generation with Supabase
- [ ] Test: Generate manifests

#### OfficesAdmin.tsx
- [ ] Replace office queries with Supabase
- [ ] Replace office mutations with Supabase
- [ ] Test: Manage offices

#### ReportsAnalytics.tsx
- [ ] Replace report queries with Supabase
- [ ] Test: View reports

---

## Phase 3: Testing

### Authentication Tests
- [ ] User can sign up
- [ ] User can sign in
- [ ] User can sign out
- [ ] User profile is created on signup
- [ ] User can view their profile
- [ ] Unauthorized users cannot access admin pages

### Data CRUD Tests
- [ ] Create bus → appears in list
- [ ] Update bus → changes reflect
- [ ] Delete bus → removed from list
- [ ] Same for: drivers, trips, bookings, routes, etc.

### RLS Tests
- [ ] User can only see their company's data
- [ ] Drivers can only see their assigned trips
- [ ] Admins can see all data
- [ ] Users cannot modify other company's data

### Real-Time Tests
- [ ] Live location updates appear instantly
- [ ] Booking status changes reflect immediately
- [ ] Trip status changes propagate

---

## Phase 4: Deployment

- [ ] Remove `.env.local` from git (already in `.gitignore`)
- [ ] Set environment variables in deployment platform:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Build frontend: `npm run build`
- [ ] Deploy to production
- [ ] Test all features in production

---

## Common Supabase Patterns

### Query Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) throw error;
return data;
```

### Insert Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert([{ field: value }])
  .select();

if (error) throw error;
return data;
```

### Update Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .update({ field: newValue })
  .eq('id', id)
  .select();

if (error) throw error;
return data;
```

### Delete Pattern
```typescript
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);

if (error) throw error;
```

### Real-Time Subscription
```typescript
const subscription = supabase
  .from('table_name')
  .on('*', (payload) => {
    console.log('Change:', payload);
    // Update UI
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## Troubleshooting Guide

### Issue: "Missing Supabase credentials"
**Solution:**
1. Check `.env.local` exists in `frontend/`
2. Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart dev server: `npm run dev`

### Issue: "RLS policy violation"
**Solution:**
1. Check user's role in `profiles` table
2. Verify user belongs to correct company
3. Check RLS policies in Supabase SQL Editor
4. Ensure user has permission for that action

### Issue: "Table does not exist"
**Solution:**
1. Go to Supabase SQL Editor
2. Run `SUPABASE_SCHEMA.sql` again
3. Check for error messages
4. Verify all tables appear in "Tables" list

### Issue: "Authentication failed"
**Solution:**
1. Verify email/password are correct
2. Check user exists in `auth.users`
3. Verify profile exists in `profiles` table
4. Check email is confirmed (if email verification enabled)

### Issue: "Data not updating"
**Solution:**
1. Check RLS policies allow update
2. Verify user has correct role
3. Check browser console for errors
4. Verify data was actually sent to Supabase

---

## Files Created

- ✅ `SUPABASE_SCHEMA.sql` - Complete database schema
- ✅ `SUPABASE_SETUP_GUIDE.md` - Setup instructions
- ✅ `frontend/src/lib/supabase.ts` - Supabase client
- ✅ `SUPABASE_IMPLEMENTATION_CHECKLIST.md` - This file

---

## Next Actions

1. **Create Supabase Project** (5 minutes)
2. **Run SQL Schema** (2 minutes)
3. **Create `.env.local`** (1 minute)
4. **Install dependencies** (2 minutes)
5. **Update authentication pages** (30 minutes)
6. **Update admin pages one by one** (2-3 hours)
7. **Test everything** (1 hour)
8. **Deploy** (30 minutes)

**Total Time: ~4 hours**

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Real-Time: https://supabase.com/docs/guides/realtime
