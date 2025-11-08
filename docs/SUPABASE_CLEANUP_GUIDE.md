# 🧹 SUPABASE CLEANUP - Complete Migration

## 📊 **SCOPE**

Found **151 Supabase references** across 44 files that need to be cleaned up.

### **Files to Update (Priority Order):**

**Critical (Blocking Errors):**
1. `src/components/Hero.tsx` - 3 matches (fetchRoutes, fetchLocations)
2. `src/pages/admin/SuperAdminDashboard.tsx` - 13 matches
3. `src/pages/admin/PassengerManifest.tsx` - 10 matches
4. `src/pages/admin/ReportsAnalytics.tsx` - 8 matches

**High Priority:**
5. `src/components/admin/UserManagement.tsx` - 6 matches
6. `src/components/dashboard/DepartmentsSection.tsx` - 6 matches
7. `src/components/dashboard/QuickActionsToolbar.tsx` - 6 matches
8. `src/pages/admin/HRManagement.tsx` - 6 matches

**Medium Priority:**
- All other admin pages and components

---

## 🔄 **MIGRATION PATTERN**

### **FROM (Old Supabase):**
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase
  .from('routes')
  .select('*')
  .eq('active', true);
```

### **TO (New API Client):**
```typescript
import api from "@/lib/api";

const response = await api.get('/routes');
const data = response.data;
```

---

## 📝 **CONVERSION RULES**

### **1. SELECT Operations**
```typescript
// OLD
const { data } = await supabase.from('routes').select('*');

// NEW
const response = await api.get('/routes');
const data = response.data;
```

### **2. SELECT with Filters**
```typescript
// OLD
const { data } = await supabase
  .from('routes')
  .select('*')
  .eq('active', true)
  .order('name', { ascending: true });

// NEW
const response = await api.get('/routes?active=true&sort=name');
const data = response.data;
```

### **3. INSERT Operations**
```typescript
// OLD
const { data } = await supabase
  .from('routes')
  .insert([{ name: 'Route 1', origin: 'A', destination: 'B' }]);

// NEW
const response = await api.post('/routes', {
  name: 'Route 1',
  origin: 'A',
  destination: 'B'
});
const data = response.data;
```

### **4. UPDATE Operations**
```typescript
// OLD
const { data } = await supabase
  .from('routes')
  .update({ active: false })
  .eq('id', routeId);

// NEW
const response = await api.put(`/routes/${routeId}`, {
  active: false
});
const data = response.data;
```

### **5. DELETE Operations**
```typescript
// OLD
await supabase.from('routes').delete().eq('id', routeId);

// NEW
await api.delete(`/routes/${routeId}`);
```

### **6. Real-time Subscriptions**
```typescript
// OLD
const subscription = supabase
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'routes' },
    (payload) => console.log(payload)
  )
  .subscribe();

// NEW - Use React Query instead
import { useQuery } from '@tanstack/react-query';

const { data: routes } = useQuery({
  queryKey: ['routes'],
  queryFn: () => api.get('/routes').then(res => res.data),
  refetchInterval: 5000 // Poll every 5 seconds
});
```

---

## 🎯 **QUICK FIX - Hero.tsx**

This is the most critical file causing errors. Here's the fix:

```typescript
// BEFORE
import { supabase } from "@/integrations/supabase/client";

const fetchRoutes = async () => {
  const { data } = await supabase
    .from('routes')
    .select('*')
    .eq('active', true);
  setRoutes(data || []);
};

const fetchLocations = async () => {
  const { data } = await supabase
    .from('booking_offices')
    .select('*')
    .eq('active', true);
  setLocations(data || []);
};

// AFTER
import api from "@/lib/api";

const fetchRoutes = async () => {
  try {
    const response = await api.get('/routes');
    setRoutes(response.data || []);
  } catch (error) {
    console.error('Failed to fetch routes:', error);
    setRoutes([]);
  }
};

const fetchLocations = async () => {
  try {
    const response = await api.get('/booking_offices');
    setLocations(response.data || []);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    setLocations([]);
  }
};
```

---

## 🚀 **IMPLEMENTATION STRATEGY**

### **Phase 1: Critical Files (Do First)**
1. Fix `Hero.tsx` - Stops blocking errors
2. Fix `SuperAdminDashboard.tsx` - Main dashboard
3. Fix `PassengerManifest.tsx` - Booking system
4. Fix `ReportsAnalytics.tsx` - Analytics

### **Phase 2: High Priority**
5. Fix all admin pages
6. Fix all components

### **Phase 3: Cleanup**
7. Remove `src/integrations/supabase/` folder (after all files updated)
8. Remove Supabase imports from package.json

---

## ✅ **VERIFICATION CHECKLIST**

After cleanup:
- [ ] No `import { supabase }` statements in any file
- [ ] No `supabase.from()` calls
- [ ] No `supabase.auth` calls (use AuthContext instead)
- [ ] All data fetching uses `api` client
- [ ] All errors handled with try-catch
- [ ] Browser console has no Supabase errors
- [ ] All API calls work correctly

---

## 📋 **AUTOMATED CLEANUP COMMANDS**

### **Find all Supabase imports:**
```bash
grep -r "from.*supabase" src/ --include="*.tsx" --include="*.ts"
```

### **Find all Supabase method calls:**
```bash
grep -r "supabase\." src/ --include="*.tsx" --include="*.ts"
```

---

## 🎯 **NEXT STEPS**

1. **Start with Hero.tsx** - Fix the most critical file
2. **Test in browser** - Verify no errors
3. **Continue with admin pages** - One at a time
4. **Test each fix** - Ensure API calls work
5. **Final cleanup** - Remove Supabase folder

---

## 💡 **TIPS**

- Use `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- Always wrap in try-catch
- Use React Query for data fetching
- Check backend API endpoints exist
- Test with browser DevTools Network tab

---

## 🎉 **RESULT**

After cleanup:
- ✅ No Supabase dependencies
- ✅ All data from Prisma API
- ✅ Clean, modern codebase
- ✅ Full type safety
- ✅ Better error handling

**Let's get started!** 🚀
