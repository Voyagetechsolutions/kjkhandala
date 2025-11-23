# 🎨 Shift System Integration - Dashboard Style Guide

## ✅ Old Files Removed

The MUI-based shift management files have been removed:
- ❌ `frontend/src/pages/operations/ShiftCalendar.tsx`
- ❌ `frontend/src/pages/operations/RouteSchedules.tsx`
- ❌ `frontend/src/pages/operations/DriverShifts.tsx`
- ❌ `frontend/src/components/operations/AutoGenerateShifts.tsx`

---

## 🎯 Dashboard Style Requirements

Your existing dashboard uses:

### **UI Components** (shadcn/ui)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

### **Icons** (Lucide React)
```typescript
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  User, 
  Bus, 
  MapPin, 
  Clock,
  Edit,
  Trash2 
} from 'lucide-react';
```

### **Data Fetching** (React Query)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['shifts'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('driver_shifts')
      .select('*');
    if (error) throw error;
    return data;
  },
});
```

### **Notifications** (Sonner)
```typescript
import { toast } from 'sonner';

toast.success('Shift created successfully');
toast.error('Failed to create shift');
```

### **Layout**
```typescript
import OperationsLayout from '@/components/operations/OperationsLayout';

export default function ShiftCalendar() {
  return (
    <OperationsLayout>
      {/* Your content */}
    </OperationsLayout>
  );
}
```

### **Styling** (Tailwind CSS)
```typescript
<div className="space-y-6">
  <div className="flex justify-between items-center">
    <h1 className="text-3xl font-bold">Shift Calendar</h1>
    <Button><Plus className="h-4 w-4 mr-2" />Add Shift</Button>
  </div>
  
  <div className="grid gap-4 md:grid-cols-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Shifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">24</p>
      </CardContent>
    </Card>
  </div>
</div>
```

---

## 📋 Pages to Create

### **1. Shift Calendar** (`/operations/shifts/calendar`)

**Purpose:** Visual calendar view of driver assignments

**Features:**
- Monthly/weekly calendar grid
- Click date to add shift
- Show driver-route assignments per day
- Auto-generate shifts button
- Summary cards (total shifts, active drivers, assigned routes)

**Data Source:**
```typescript
// Use Supabase RPC function
const { data } = await supabase.rpc('get_shift_calendar', {
  p_start_date: '2025-11-01',
  p_end_date: '2025-11-30'
});
```

---

### **2. Route Schedules** (`/operations/shifts/schedules`)

**Purpose:** Manage automated route schedules

**Features:**
- List of route frequencies
- Add/edit schedule dialog
- Days of week selector (checkboxes)
- Time picker for departure
- Frequency type dropdown (daily, weekly, custom)
- Summary cards (total schedules, active routes)

**Data Source:**
```typescript
const { data } = await supabase
  .from('route_frequencies')
  .select(`
    *,
    routes (
      origin,
      destination,
      distance_km
    )
  `)
  .eq('active', true);
```

---

### **3. Driver Shifts List** (`/operations/shifts`)

**Purpose:** List view of all shifts with filters

**Features:**
- Table with driver, route, date, bus, status
- Filter by date range, driver, status
- Search by driver name or route
- Edit/delete shift actions
- Summary cards (upcoming, active, completed)

**Data Source:**
```typescript
const { data } = await supabase
  .from('driver_shifts')
  .select(`
    *,
    drivers (full_name),
    routes (origin, destination),
    buses (registration_number)
  `)
  .order('shift_date', { ascending: false });
```

---

## 🎨 Example Page Structure

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, User, Bus } from 'lucide-react';
import { toast } from 'sonner';

export default function ShiftCalendar() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch shifts
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_shifts')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Create shift mutation
  const createMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const { error } = await supabase
        .from('driver_shifts')
        .insert(shiftData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift created successfully');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create shift');
    },
  });

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shift Calendar</h1>
            <p className="text-muted-foreground">
              Manage driver shift assignments
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{shifts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          {/* More cards... */}
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>November 2025</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendar implementation */}
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
```

---

## 🔌 Backend Integration

All pages should use the existing backend API routes:

```typescript
// Get calendar data
GET /api/shifts/calendar?start=2025-11-01&end=2025-11-30

// Get driver shifts
GET /api/shifts/driver/:driverId?start=2025-11-01&end=2025-11-30

// Create shift
POST /api/shifts
{
  "driver_id": "uuid",
  "route_id": "uuid",
  "bus_id": "uuid",
  "shift_date": "2025-11-25"
}

// Auto-generate shifts
POST /api/shifts/auto-generate
{
  "start_date": "2025-11-25",
  "end_date": "2025-12-01",
  "route_ids": ["uuid1", "uuid2"]
}
```

---

## ✅ Checklist

- [ ] Create `ShiftCalendar.tsx` with dashboard style
- [ ] Create `RouteSchedules.tsx` with dashboard style
- [ ] Create `DriverShifts.tsx` with dashboard style
- [ ] Use shadcn/ui components (not MUI)
- [ ] Use Lucide icons (not MUI icons)
- [ ] Use React Query for data fetching
- [ ] Use Sonner for toast notifications
- [ ] Wrap in `OperationsLayout`
- [ ] Use Tailwind CSS classes
- [ ] Follow existing dashboard patterns
- [ ] Test with Supabase backend
- [ ] Add to routing in `App.tsx`

---

**The shift management system should look and feel exactly like the rest of your dashboard!** 🎨
