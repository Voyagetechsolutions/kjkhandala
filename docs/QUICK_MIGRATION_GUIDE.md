# 🚀 QUICK MIGRATION GUIDE - Bridge API to Supabase

## Step-by-Step for Each File

### **Step 1: Change Import**

**Find:**
```typescript
import api from '@/lib/api';
```

**Replace with:**
```typescript
import { supabase } from '@/lib/supabase';
```

---

### **Step 2: Update useQuery**

**Find:**
```typescript
const { data: itemsData, isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const response = await api.get('/items');
    return response.data;
  },
});

const items = itemsData?.items || [];
```

**Replace with:**
```typescript
const { data: items = [], isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
});
```

---

### **Step 3: Update useMutation (Create)**

**Find:**
```typescript
const createMutation = useMutation({
  mutationFn: async (newItem) => {
    const response = await api.post('/items', newItem);
    return response.data;
  },
});
```

**Replace with:**
```typescript
const createMutation = useMutation({
  mutationFn: async (newItem) => {
    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select();
    
    if (error) throw error;
    return data;
  },
});
```

---

### **Step 4: Update useMutation (Update)**

**Find:**
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, updates }) => {
    const response = await api.put(`/items/${id}`, updates);
    return response.data;
  },
});
```

**Replace with:**
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  },
});
```

---

### **Step 5: Update useMutation (Delete)**

**Find:**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id) => {
    await api.delete(`/items/${id}`);
  },
});
```

**Replace with:**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
});
```

---

## 📋 Common Table Names

| Old API Endpoint | Supabase Table |
|------------------|----------------|
| `/drivers` | `drivers` |
| `/trips` | `trips` |
| `/buses` | `buses` |
| `/routes` | `routes` |
| `/bookings` | `bookings` |
| `/passengers` | `passengers` |
| `/employees` | `employees` |
| `/work_orders` | `work_orders` |
| `/maintenance_schedules` | `maintenance_schedules` |
| `/incidents` | `incidents` |
| `/expenses` | `expenses` |
| `/income` | `income` |
| `/payroll` | `payroll` |
| `/attendance` | `attendance` |
| `/leave_requests` | `leave_requests` |

---

## 🔍 Advanced Queries

### **Filter by Status:**
```typescript
const { data, error } = await supabase
  .from('drivers')
  .select('*')
  .eq('status', 'active');
```

### **Multiple Filters:**
```typescript
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('status', 'scheduled')
  .gte('scheduled_departure', new Date().toISOString());
```

### **Join Tables:**
```typescript
const { data, error } = await supabase
  .from('trips')
  .select(`
    *,
    driver:drivers(id, full_name, phone),
    bus:buses(id, number_plate, model),
    route:routes(id, origin, destination)
  `);
```

### **Count Records:**
```typescript
const { count, error } = await supabase
  .from('drivers')
  .select('*', { count: 'exact', head: true });
```

### **Pagination:**
```typescript
const { data, error } = await supabase
  .from('drivers')
  .select('*')
  .range(0, 9)  // First 10 records
  .order('full_name');
```

### **Search:**
```typescript
const { data, error } = await supabase
  .from('drivers')
  .select('*')
  .ilike('full_name', `%${searchTerm}%`);
```

---

## ✅ Checklist for Each File

- [ ] Change import from `@/lib/api` to `@/lib/supabase`
- [ ] Update all `api.get()` to Supabase `select()`
- [ ] Update all `api.post()` to Supabase `insert()`
- [ ] Update all `api.put()` to Supabase `update()`
- [ ] Update all `api.delete()` to Supabase `delete()`
- [ ] Add error handling (`if (error) throw error`)
- [ ] Update data destructuring
- [ ] Test the page

---

## 🎯 Example: Complete File Migration

**Before:**
```typescript
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DriversPage() {
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get('/drivers');
      return response.data;
    },
  });

  const drivers = driversData?.drivers || [];

  const createMutation = useMutation({
    mutationFn: async (newDriver) => {
      await api.post('/drivers', newDriver);
    },
  });

  return <div>{/* UI */}</div>;
}
```

**After:**
```typescript
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function DriversPage() {
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newDriver) => {
      const { error } = await supabase
        .from('drivers')
        .insert([newDriver]);
      
      if (error) throw error;
    },
  });

  return <div>{/* UI */}</div>;
}
```

---

**Apply this pattern to all 56 files and you're done!** 🎉
