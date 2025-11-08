# ✅ SUPABASE CLEANUP - HERO.TSX FIXED

## 🎯 **CRITICAL FILE FIXED**

### **Hero.tsx - COMPLETE** ✅

**Changes Made:**
- ✅ Removed `import { supabase } from "@/integrations/supabase/client"`
- ✅ Added `import api from "@/lib/api"`
- ✅ Fixed `fetchRoutes()` - Now uses `api.get('/routes')`
- ✅ Fixed `fetchLocations()` - Now uses `api.get('/routes')`
- ✅ Added proper error handling with try-catch
- ✅ Removed Supabase `.from().select().eq()` chains

**Before:**
```typescript
const { data, error } = await supabase
  .from("routes")
  .select("id, origin, destination, route_type")
  .eq("active", true)
  .order("origin");
```

**After:**
```typescript
const response = await api.get('/routes');
setRoutes(response.data || []);
```

---

## 🚀 **NEXT STEPS**

### **Remaining Files to Fix (150+ references)**

**Priority 1 - Critical (Do Next):**
1. `src/pages/admin/SuperAdminDashboard.tsx` - 13 matches
2. `src/pages/admin/PassengerManifest.tsx` - 10 matches
3. `src/pages/admin/ReportsAnalytics.tsx` - 8 matches

**Priority 2 - High:**
4. `src/components/admin/UserManagement.tsx` - 6 matches
5. `src/components/dashboard/DepartmentsSection.tsx` - 6 matches
6. `src/components/dashboard/QuickActionsToolbar.tsx` - 6 matches
7. `src/pages/admin/HRManagement.tsx` - 6 matches

**Priority 3 - Medium:**
- All other admin pages and components

---

## 📋 **AUTOMATED CLEANUP SCRIPT**

To speed up the cleanup, use this pattern for each file:

```typescript
// 1. Replace import
- import { supabase } from "@/integrations/supabase/client";
+ import api from "@/lib/api";

// 2. Replace SELECT queries
- const { data } = await supabase.from('table').select('*');
+ const response = await api.get('/table');
+ const data = response.data;

// 3. Replace INSERT
- await supabase.from('table').insert([...]);
+ await api.post('/table', {...});

// 4. Replace UPDATE
- await supabase.from('table').update({...}).eq('id', id);
+ await api.put(`/table/${id}`, {...});

// 5. Replace DELETE
- await supabase.from('table').delete().eq('id', id);
+ await api.delete(`/table/${id}`);

// 6. Add error handling
+ try {
+   // API call
+ } catch (error) {
+   console.error('Error:', error);
+ }
```

---

## 🎊 **CURRENT STATUS**

### **✅ COMPLETED:**
- Hero.tsx - Fixed and ready
- AuthContext.tsx - Already fixed
- API client - Ready to use
- Backend - Running on port 3001
- Frontend - Running on port 8080

### **⏳ REMAINING:**
- 43 more files with Supabase references
- ~150 more Supabase API calls to replace

---

## 💡 **TIPS FOR CLEANUP**

1. **Use Find & Replace** in VS Code:
   - Find: `supabase.from\('(\w+)'\).select\('(.+?)'\)`
   - Replace: `api.get('/$1')`

2. **Test Each File** after fixing:
   - Open browser DevTools
   - Check Network tab for API calls
   - Verify no Supabase errors

3. **Use React Query** for data fetching:
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   
   const { data: routes } = useQuery({
     queryKey: ['routes'],
     queryFn: () => api.get('/routes').then(res => res.data)
   });
   ```

---

## 🎯 **VERIFICATION**

After fixing each file:
- [ ] No `import { supabase }` statements
- [ ] No `supabase.from()` calls
- [ ] No `supabase.auth` calls
- [ ] All data fetching uses `api` client
- [ ] All errors handled with try-catch
- [ ] Browser console has no Supabase errors
- [ ] API calls work correctly

---

## 📞 **NEED HELP?**

See `SUPABASE_CLEANUP_GUIDE.md` for:
- Complete conversion patterns
- Code examples
- Best practices
- Troubleshooting

---

## 🎉 **RESULT**

After cleanup:
- ✅ No Supabase dependencies
- ✅ All data from Prisma API
- ✅ Clean, modern codebase
- ✅ Full type safety
- ✅ Better error handling
- ✅ Production-ready system

**Let's finish the cleanup!** 🚀
