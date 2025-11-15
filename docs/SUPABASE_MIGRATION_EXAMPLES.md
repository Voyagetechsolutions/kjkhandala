# Supabase Migration Examples

## Converting Pages from Backend API to Supabase

### Example 1: FleetManagement - Fetch Buses

**BEFORE (Backend API):**
```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function FleetManagement() {
  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return response.data.data || [];
    },
  });

  return (
    <div>
      {buses?.map(bus => (
        <div key={bus.id}>{bus.registration_number}</div>
      ))}
    </div>
  );
}
```

**AFTER (Supabase):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function FleetManagement() {
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

  return (
    <div>
      {buses?.map(bus => (
        <div key={bus.id}>{bus.registration_number}</div>
      ))}
    </div>
  );
}
```

---

### Example 2: Create Bus

**BEFORE (Backend API):**
```typescript
const createMutation = useMutation({
  mutationFn: async (formData: any) => {
    await api.post('/buses', formData);
  },
  onSuccess: () => {
    toast.success('Bus created successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  },
});
```

**AFTER (Supabase):**
```typescript
const createMutation = useMutation({
  mutationFn: async (formData: any) => {
    const { data, error } = await supabase
      .from('buses')
      .insert([{
        registration_number: formData.registration_number,
        make: formData.make,
        model: formData.model,
        capacity: formData.capacity,
        company_id: userCompanyId,
      }])
      .select();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success('Bus created successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  },
});
```

---

### Example 3: Update Bus

**BEFORE (Backend API):**
```typescript
const updateMutation = useMutation({
  mutationFn: async (formData: any) => {
    await api.put(`/buses/${editingId}`, formData);
  },
  onSuccess: () => {
    toast.success('Bus updated successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
    setEditing(null);
  },
});
```

**AFTER (Supabase):**
```typescript
const updateMutation = useMutation({
  mutationFn: async (formData: any) => {
    const { data, error } = await supabase
      .from('buses')
      .update({
        registration_number: formData.registration_number,
        make: formData.make,
        model: formData.model,
        capacity: formData.capacity,
      })
      .eq('id', editingId)
      .select();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success('Bus updated successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
    setEditing(null);
  },
});
```

---

### Example 4: Delete Bus

**BEFORE (Backend API):**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    await api.delete(`/buses/${id}`);
  },
  onSuccess: () => {
    toast.success('Bus deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  },
});
```

**AFTER (Supabase):**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('buses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  onSuccess: () => {
    toast.success('Bus deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['buses'] });
  },
});
```

---

### Example 5: Complex Query with Filters

**BEFORE (Backend API):**
```typescript
const { data: bookings } = useQuery({
  queryKey: ['bookings', tripId, status],
  queryFn: async () => {
    const response = await api.get(`/bookings?trip_id=${tripId}&status=${status}`);
    return response.data.data || [];
  },
});
```

**AFTER (Supabase):**
```typescript
const { data: bookings } = useQuery({
  queryKey: ['bookings', tripId, status],
  queryFn: async () => {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', tripId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
});
```

---

### Example 6: Join with Related Data

**BEFORE (Backend API):**
```typescript
const { data: trips } = useQuery({
  queryKey: ['trips'],
  queryFn: async () => {
    const response = await api.get('/trips');
    return response.data.data || [];
  },
});
```

**AFTER (Supabase):**
```typescript
const { data: trips } = useQuery({
  queryKey: ['trips'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        bus:buses(*),
        driver:profiles(*)
      `)
      .order('departure_time', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
});
```

---

### Example 7: Real-Time Updates

**BEFORE (Backend API + WebSocket):**
```typescript
useEffect(() => {
  if (!socket) return;
  
  socket.on('location:update', (data: any) => {
    console.log('Location update:', data);
  });

  return () => {
    socket.off('location:update');
  };
}, [socket]);
```

**AFTER (Supabase Real-Time):**
```typescript
useEffect(() => {
  const subscription = supabase
    .from('live_locations')
    .on('INSERT', (payload) => {
      console.log('New location:', payload.new);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

### Example 8: Sign Up

**BEFORE (Backend API):**
```typescript
const handleSignUp = async (email, password, fullName) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  localStorage.setItem('token', response.data.token);
};
```

**AFTER (Supabase):**
```typescript
import { signUp } from '@/lib/supabase';

const handleSignUp = async (email, password, fullName) => {
  await signUp(email, password, fullName);
};
```

---

### Example 9: Sign In

**BEFORE (Backend API):**
```typescript
const handleSignIn = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  localStorage.setItem('token', response.data.token);
  navigate('/dashboard');
};
```

**AFTER (Supabase):**
```typescript
import { signIn } from '@/lib/supabase';

const handleSignIn = async (email, password) => {
  await signIn(email, password);
  navigate('/dashboard');
};
```

---

## Key Differences

| Aspect | Backend API | Supabase |
|--------|------------|----------|
| **Query** | `api.get('/endpoint')` | `supabase.from('table').select()` |
| **Insert** | `api.post('/endpoint', data)` | `supabase.from('table').insert([data])` |
| **Update** | `api.put('/endpoint/:id', data)` | `supabase.from('table').update(data).eq('id', id)` |
| **Delete** | `api.delete('/endpoint/:id')` | `supabase.from('table').delete().eq('id', id)` |
| **Auth** | Manual JWT | Supabase Auth (automatic) |
| **Real-Time** | WebSocket | Supabase Subscriptions |
| **Joins** | Backend handles | Use `.select('*, relation(*)')` |
| **Filtering** | Query params | `.eq()`, `.gt()`, `.lt()` |

---

## Migration Checklist

For each page:

1. Import Supabase: `import { supabase } from '@/lib/supabase';`
2. Replace all `api.get()` with `supabase.from().select()`
3. Replace all `api.post()` with `supabase.from().insert()`
4. Replace all `api.put()` with `supabase.from().update()`
5. Replace all `api.delete()` with `supabase.from().delete()`
6. Add `company_id` to all inserts
7. Test CRUD operations
8. Remove old `api` imports

---

## Common Gotchas

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

---

## Testing

After migrating a page, test in browser console:

```typescript
// Test fetch
const { data } = await supabase.from('buses').select();
console.log('Fetched:', data);

// Test create
const { data: created } = await supabase
  .from('buses')
  .insert([{ registration_number: 'TEST', company_id: myCompanyId }])
  .select();
console.log('Created:', created);

// Test update
const { data: updated } = await supabase
  .from('buses')
  .update({ registration_number: 'TEST2' })
  .eq('id', created[0].id)
  .select();
console.log('Updated:', updated);

// Test delete
const { error } = await supabase
  .from('buses')
  .delete()
  .eq('id', created[0].id);
console.log('Deleted:', !error);
```
