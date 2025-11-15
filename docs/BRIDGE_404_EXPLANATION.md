# 🔍 BRIDGE 404 ERRORS - EXPLANATION & SOLUTION

## The Problem

Frontend is making requests like:
```
GET http://localhost:3001/bridge/drivers → 404
GET http://localhost:3001/bridge/driver_assignments → 404
POST http://localhost:3001/bridge/drivers → 404
```

---

## Why This Happens

### **1. Frontend API Client**
`frontend/src/lib/api.ts` line 10:
```typescript
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/bridge`,  // ← /bridge prefix
  // ...
});
```

So when frontend calls:
```typescript
api.get('/drivers')
```

It becomes:
```
GET http://localhost:3001/bridge/drivers
```

### **2. Backend Bridge Router**
`backend/src/routes/bridge.js` is a **generic CRUD router** that expects:
```javascript
POST /bridge
{
  "table": "drivers",
  "action": "get",
  "where": {}
}
```

**NOT:**
```
GET /bridge/drivers
```

---

## ✅ Solution Options

### **Option A: Use Supabase Directly (Recommended)**

The BusForm already does this correctly:
```typescript
const { data, error } = await supabase.from('buses').insert([data]);
```

**Change all pages to use Supabase instead of the bridge API:**

**Before:**
```typescript
import api from '@/lib/api';

const { data } = await api.get('/drivers');
```

**After:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.from('drivers').select('*');
```

---

### **Option B: Add Specific Routes to Bridge**

Add REST endpoints to `backend/src/routes/bridge.js`:

```javascript
// GET /bridge/drivers
router.get('/drivers', async (req, res) => {
  try {
    const data = await doSelect('drivers');
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

// POST /bridge/drivers
router.post('/drivers', async (req, res) => {
  try {
    const data = await doInsert('drivers', req.body);
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

// GET /bridge/driver_assignments
router.get('/driver_assignments', async (req, res) => {
  try {
    const data = await doSelect('driver_assignments');
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
});

// GET /bridge/driver_performance/summary
router.get('/driver_performance/summary', async (req, res) => {
  try {
    // Custom logic for summary
    const data = await doSelect('driver_performance');
    return ok(res, data);
  } catch (error) {
    return fail(res, error.message, 500);
  }
});
```

---

### **Option C: Remove Bridge, Use Direct Backend Routes**

Change frontend to call backend routes directly:

**Update `frontend/src/lib/api.ts`:**
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // Remove /bridge
  // ...
});
```

**Ensure backend has routes:**
```javascript
// backend/src/server.js
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/driver_assignments', require('./routes/driver_assignments'));
```

---

## 🎯 Recommended Approach

**Use Supabase directly** (Option A) because:

1. ✅ **Already configured** - Supabase client is set up
2. ✅ **Type-safe** - Better TypeScript support
3. ✅ **Real-time** - Can use subscriptions
4. ✅ **RLS** - Row-level security built-in
5. ✅ **No 404s** - Direct database access
6. ✅ **Consistent** - BusForm already uses this pattern

---

## 📋 Migration Steps (Option A)

### **1. Update Pages Using Bridge API**

**Files to update:**
- `pages/operations/DriverOperations.tsx`
- `pages/admin/DriverManagement.tsx`
- All pages importing `from '@/lib/api'`

**Pattern:**

**Before:**
```typescript
import api from '@/lib/api';

const fetchDrivers = async () => {
  const { data } = await api.get('/drivers');
  setDrivers(data);
};
```

**After:**
```typescript
import { supabase } from '@/lib/supabase';

const fetchDrivers = async () => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*');
  
  if (error) throw error;
  setDrivers(data);
};
```

### **2. Update Mutations**

**Before:**
```typescript
const { data } = await api.post('/drivers', newDriver);
```

**After:**
```typescript
const { data, error } = await supabase
  .from('drivers')
  .insert([newDriver])
  .select();

if (error) throw error;
```

### **3. Update Queries with Filters**

**Before:**
```typescript
const { data } = await api.get(`/drivers?status=active`);
```

**After:**
```typescript
const { data, error } = await supabase
  .from('drivers')
  .select('*')
  .eq('status', 'active');

if (error) throw error;
```

---

## ✅ Quick Fix for Now

If you want to keep using the bridge API temporarily, restart the backend:

```bash
cd backend
npm run dev
```

Then verify it's running:
```bash
curl http://localhost:3001/api/health
```

But the 404s will persist because the bridge router doesn't have those specific GET endpoints.

---

## 🚀 Best Practice

**Follow BusForm.tsx pattern** - it's already correct:

```typescript
// BusForm.tsx - CORRECT ✅
const saveMutation = useMutation({
  mutationFn: async (data: any) => {
    if (bus) {
      const { error } = await supabase
        .from('buses')
        .update(data)
        .eq('id', bus.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('buses')
        .insert([data]);
      if (error) throw error;
    }
  },
});
```

**Apply this pattern to all other forms and pages.**

---

## 📊 Summary

| Approach | Pros | Cons |
|----------|------|------|
| **A: Use Supabase** | ✅ No 404s<br>✅ Type-safe<br>✅ Real-time<br>✅ RLS | Need to update pages |
| **B: Add Bridge Routes** | ✅ Keep current code | ❌ Maintenance overhead<br>❌ Duplicate logic |
| **C: Direct Backend** | ✅ REST API | ❌ More backend code<br>❌ No RLS |

**Recommendation: Option A (Use Supabase)**

---

**The BusForm already shows the correct pattern - use Supabase directly!** 🎉
