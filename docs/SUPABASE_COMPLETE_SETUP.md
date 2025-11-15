# Supabase Complete Setup - KJ Khandala

## 📋 Overview

You're migrating from Node.js/Prisma backend to **Supabase** for:
- ✅ Database (PostgreSQL)
- ✅ Authentication (Supabase Auth)
- ✅ Real-time updates (Supabase Subscriptions)
- ✅ Row-Level Security (RLS policies)

**No more Node.js backend needed!** Supabase handles everything.

---

## 🚀 QUICK START (5 Steps)

### Step 1: Create Supabase Project (5 min)
```
1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Name: voyage-onboard-now
5. Set database password (save it!)
6. Choose region closest to you
7. Wait 2-3 minutes
```

### Step 2: Get Credentials (2 min)
```
1. Go to Settings → API
2. Copy Project URL (e.g., https://xxxxx.supabase.co)
3. Copy anon key
4. Copy service_role key (keep secret!)
```

### Step 3: Create `.env.local` (1 min)
```
File: frontend/.env.local

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run SQL Schema (2 min)
```
1. Open Supabase SQL Editor
2. Create new query
3. Copy all content from SUPABASE_SCHEMA.sql
4. Click Run
5. Wait for success
```

### Step 5: Install Dependencies (2 min)
```bash
cd frontend
npm install @supabase/supabase-js
```

**Total: ~15 minutes to get started!**

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `SUPABASE_SCHEMA.sql` | Complete database schema |
| `SUPABASE_SETUP_GUIDE.md` | Detailed setup instructions |
| `SUPABASE_IMPLEMENTATION_CHECKLIST.md` | Migration checklist |
| `SUPABASE_MIGRATION_EXAMPLES.md` | Code examples |
| `frontend/src/lib/supabase.ts` | Supabase client library |

---

## 🔐 Authentication

### Sign Up
```typescript
import { signUp } from '@/lib/supabase';

const handleSignUp = async (email, password, fullName) => {
  await signUp(email, password, fullName);
  // Profile created automatically
};
```

### Sign In
```typescript
import { signIn } from '@/lib/supabase';

const handleSignIn = async (email, password) => {
  await signIn(email, password);
  // Session stored automatically
};
```

### Sign Out
```typescript
import { signOut } from '@/lib/supabase';

const handleLogout = async () => {
  await signOut();
};
```

---

## 💾 Common Queries

### Fetch Data
```typescript
const { data, error } = await supabase
  .from('buses')
  .select('*')
  .order('registration_number');
```

### Create Data
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
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('buses')
  .update({ status: 'IN_MAINTENANCE' })
  .eq('id', busId)
  .select();
```

### Delete Data
```typescript
const { error } = await supabase
  .from('buses')
  .delete()
  .eq('id', busId);
```

### Join Related Data
```typescript
const { data, error } = await supabase
  .from('trips')
  .select(`
    *,
    route:routes(*),
    bus:buses(*),
    driver:profiles(*)
  `)
  .order('departure_time');
```

### Real-Time Updates
```typescript
const subscription = supabase
  .from('live_locations')
  .on('INSERT', (payload) => {
    console.log('New location:', payload.new);
  })
  .subscribe();

subscription.unsubscribe(); // Cleanup
```

---

## 🔒 Row-Level Security

**Automatic access control - no manual checks needed:**

- Users see only their company's data
- Drivers see only their assigned trips
- Admins see everything
- All policies already configured!

---

## 📊 Database Tables

**Core tables created:**
- profiles (users)
- companies
- buses
- trips
- bookings
- payment_transactions
- routes
- fuel_records
- maintenance_records
- work_orders
- attendance
- payrolls
- expenses
- driver_assignments
- driver_performance
- live_locations
- manifests
- promo_codes
- system_settings
- notifications
- audit_logs

---

## 🔄 Migration Timeline

| Phase | Time | Tasks |
|-------|------|-------|
| Setup | 15 min | Create project, get credentials, run schema |
| Auth | 30 min | Update login/register pages |
| Admin Pages | 2-3 hours | Migrate each admin page |
| Testing | 1 hour | Test all features |
| Deploy | 30 min | Deploy to production |
| **Total** | **~4 hours** | **Complete migration** |

---

## 🛠️ Troubleshooting

### Missing Credentials
```
✓ Check .env.local exists in frontend/
✓ Verify VITE_SUPABASE_URL is set
✓ Verify VITE_SUPABASE_ANON_KEY is set
✓ Restart: npm run dev
```

### RLS Policy Violation
```
✓ Check user's role in profiles
✓ Verify user's company_id
✓ Check RLS policies in SQL Editor
```

### Table Not Found
```
✓ Run SUPABASE_SCHEMA.sql again
✓ Check for error messages
✓ Verify tables in Tables list
```

### Auth Failed
```
✓ Verify email/password correct
✓ Check user in auth.users
✓ Check profile in profiles table
```

---

## 📚 Resources

- Supabase Docs: https://supabase.com/docs
- JS Client: https://supabase.com/docs/reference/javascript
- Authentication: https://supabase.com/docs/guides/auth
- RLS: https://supabase.com/docs/guides/auth/row-level-security
- Real-Time: https://supabase.com/docs/guides/realtime

---

## ✅ Pre-Launch Checklist

- [ ] All pages migrated to Supabase
- [ ] Authentication working
- [ ] All CRUD operations tested
- [ ] RLS policies verified
- [ ] Real-time updates working
- [ ] Data isolation by company verified
- [ ] No console errors
- [ ] Environment variables set
- [ ] Frontend builds successfully
- [ ] All features tested in production

---

## 🎯 Next Steps

1. **Create Supabase Project** → https://supabase.com
2. **Read SUPABASE_SETUP_GUIDE.md** for detailed instructions
3. **Use SUPABASE_MIGRATION_EXAMPLES.md** for code patterns
4. **Follow SUPABASE_IMPLEMENTATION_CHECKLIST.md** for page migration
5. **Test thoroughly** before deploying

---

## 💡 Pro Tips

- Start with authentication pages first
- Migrate one admin page at a time
- Test Supabase queries in browser console
- Most issues are RLS-related
- Never commit `.env.local` to git
- Use real-time subscriptions for live updates

---

## 🚀 You're Ready!

Everything is set up. Follow the guides and you'll have a fully functional Supabase backend.

**Good luck! 🎉**
