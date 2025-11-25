# Assign Bus - Quick Reference Card

## 🚀 Quick Start

### Deploy Database Function
```powershell
.\scripts\deploy-assign-bus.ps1
```

### Test Function
```sql
SELECT * FROM assign_bus();
```

### Navigate to Page
```
/admin/assign-bus?tripId=<trip-id>
/operations/assign-bus?tripId=<trip-id>
```

---

## 📍 Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/assign-bus` | `AssignBus.tsx` | Admin bus assignment |
| `/operations/assign-bus` | `AssignBus.tsx` | Operations bus assignment |

---

## 🔧 API Reference

### Supabase RPC Call
```typescript
const { data, error } = await supabase.rpc("assign_bus");
// Returns: { bus_id, registration, last_trip_date, total_trips }
```

### Assign Bus to Trip
```typescript
const { error } = await supabase
  .from("trips")
  .update({ bus_id: busId })
  .eq("id", tripId);
```

### Fetch Available Buses
```typescript
const { data } = await supabase
  .from("buses")
  .select("*")
  .eq("status", "active")
  .eq("is_in_maintenance", false)
  .eq("is_available", true);
```

---

## 🎨 UI Components

### Import Statement
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Bus, TrendingUp, Calendar } from "lucide-react";
```

### Navigation
```typescript
import { useNavigate, useSearchParams } from "react-router-dom";

const navigate = useNavigate();
const [searchParams] = useSearchParams();
const tripId = searchParams.get("tripId");
```

---

## 🔗 Integration Snippets

### Add Button to Trip Table
```tsx
<Button
  onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
  disabled={trip.bus_id !== null}
>
  <Bus className="w-4 h-4 mr-2" />
  {trip.bus_id ? "Reassign" : "Assign"}
</Button>
```

### Show Current Assignment
```tsx
{trip.bus_id ? (
  <span>Current: {trip.bus?.registration}</span>
) : (
  <span>No bus assigned</span>
)}
```

### Auto-Assign on Trip Creation
```typescript
// Get recommendation
const { data } = await supabase.rpc("assign_bus");

// Assign to trip
if (data?.[0]) {
  await supabase
    .from("trips")
    .update({ bus_id: data[0].bus_id })
    .eq("id", tripId);
}
```

---

## 🗂️ File Locations

```
voyage-onboard-now/
├── supabase/
│   ├── functions/operations/
│   │   └── assign_bus.sql
│   └── migrations/
│       └── 025_assign_bus_function.sql
├── frontend/src/
│   └── pages/
│       ├── admin/
│       │   └── AssignBus.tsx
│       └── operations/
│           └── AssignBus.tsx
├── docs/
│   ├── ASSIGN_BUS_FEATURE.md
│   ├── ASSIGN_BUS_INTEGRATION.md
│   ├── ASSIGN_BUS_SUMMARY.md
│   └── ASSIGN_BUS_QUICK_REFERENCE.md
└── scripts/
    └── deploy-assign-bus.ps1
```

---

## 🐛 Debug Commands

### Check Function Exists
```sql
SELECT * FROM pg_proc WHERE proname = 'assign_bus';
```

### Test Function Output
```sql
SELECT * FROM assign_bus();
```

### Check Available Buses
```sql
SELECT id, registration, status, is_in_maintenance, is_available
FROM buses
WHERE status = 'active'
  AND is_in_maintenance = false
  AND is_available = true;
```

### Check Trip Exists
```sql
SELECT * FROM trips WHERE id = '<trip-id>';
```

### View Bus Usage Stats
```sql
SELECT 
  b.registration,
  COUNT(t.id) as total_trips,
  MAX(t.trip_date) as last_trip
FROM buses b
LEFT JOIN trips t ON t.bus_id = b.id
WHERE b.status = 'active'
GROUP BY b.id, b.registration
ORDER BY COUNT(t.id) ASC;
```

---

## ⚡ Common Tasks

### Add to Existing Page
1. Import: `import { useNavigate } from "react-router-dom";`
2. Hook: `const navigate = useNavigate();`
3. Button: `<Button onClick={() => navigate(\`/admin/assign-bus?tripId=${id}\`)}>Assign</Button>`

### Handle Assignment Success
```typescript
toast({
  title: "Success",
  description: "Bus assigned successfully!",
});
navigate("/admin/trips");
```

### Handle Assignment Error
```typescript
toast({
  title: "Error",
  description: "Failed to assign bus",
  variant: "destructive",
});
```

---

## 📊 Data Flow

```
User clicks "Assign Bus"
    ↓
Navigate to /admin/assign-bus?tripId=X
    ↓
Page loads → Fetch trip details
    ↓
Fetch available buses
    ↓
Call assign_bus() RPC → Get recommendation
    ↓
Display buses with recommendation highlighted
    ↓
User clicks "Assign This Bus"
    ↓
Update trips table with bus_id
    ↓
Show success toast
    ↓
Redirect to /admin/trips
```

---

## 🎯 Key Features

- ✅ Smart recommendation (least-used bus)
- ✅ Visual highlight (green card)
- ✅ Trip context display
- ✅ One-click assignment
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Auto-redirect
- ✅ Empty state handling
- ✅ Responsive design

---

## 🔐 Permissions Required

### Database
- `authenticated` role needs:
  - `SELECT` on `buses` table
  - `SELECT` on `trips` table
  - `UPDATE` on `trips` table
  - `EXECUTE` on `assign_bus()` function

### Frontend
- User must be logged in
- User must have access to admin/operations routes

---

## 📱 Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| Mobile | Single column, stacked cards |
| Tablet | 2-column grid for buses |
| Desktop | 3-column grid for buses |

---

## 🎨 Color Palette

| Element | Color |
|---------|-------|
| Recommended Bus | `bg-gradient-to-br from-green-50 to-emerald-50` |
| Recommended Border | `border-green-500` |
| Trip Details | `bg-blue-50/50 border-blue-200` |
| Primary Button | `bg-green-600 hover:bg-green-700` |
| Empty State Icon | `text-muted-foreground` |

---

## 📦 Dependencies

```json
{
  "react": "^19.1.0",
  "react-router-dom": "^6.x",
  "@supabase/supabase-js": "^2.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

---

## 🚨 Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| No trip ID | Missing `?tripId=` in URL | Add tripId parameter |
| Function not found | Migration not applied | Run `supabase db push` |
| No buses available | All buses assigned/maintenance | Check bus statuses |
| Assignment failed | Permission or constraint issue | Check RLS policies |

---

## ⚙️ Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Client
```typescript
import { supabase } from "@/lib/supabase";
```

---

## 📈 Performance Tips

1. **Index buses table**: `CREATE INDEX idx_buses_availability ON buses(status, is_in_maintenance, is_available);`
2. **Cache recommendations**: Store in state, refresh on interval
3. **Lazy load bus details**: Only fetch when needed
4. **Debounce search**: If adding search functionality

---

## 🔄 Refresh Data

### Manual Refresh
```typescript
const refreshData = () => {
  fetchBuses();
  fetchRecommendedBus();
  fetchTripDetails();
};
```

### Real-time Updates
```typescript
useEffect(() => {
  const channel = supabase
    .channel("bus-updates")
    .on("postgres_changes", 
      { event: "*", schema: "public", table: "buses" },
      () => refreshData()
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, []);
```

---

## 📚 Documentation Links

- **Feature Docs**: `docs/ASSIGN_BUS_FEATURE.md`
- **Integration Guide**: `docs/ASSIGN_BUS_INTEGRATION.md`
- **Summary**: `docs/ASSIGN_BUS_SUMMARY.md`
- **This File**: `docs/ASSIGN_BUS_QUICK_REFERENCE.md`

---

## ✅ Deployment Checklist

- [ ] Run migration: `.\scripts\deploy-assign-bus.ps1`
- [ ] Test function: `SELECT * FROM assign_bus();`
- [ ] Test admin page: `/admin/assign-bus?tripId=<id>`
- [ ] Test operations page: `/operations/assign-bus?tripId=<id>`
- [ ] Add buttons to trip management pages
- [ ] Train staff on new feature
- [ ] Monitor for errors in first week

---

## 🎓 Training Points

1. **Purpose**: Optimize fleet utilization by assigning least-used buses
2. **Access**: Admin and Operations dashboards
3. **Process**: Click "Assign Bus" → Review recommendation → Confirm
4. **Recommendation**: Green card shows best choice
5. **Override**: Can select any available bus if needed
6. **Confirmation**: Always confirms before assignment
7. **Feedback**: Toast notification on success/error

---

**Last Updated**: Nov 24, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
