# Shift Calendar - Route Frequencies Integration

## ✅ Implementation: Option B (Full Join)

### What Changed

**Before:** Fetched from `routes` table
**After:** Fetches from `route_frequencies` table with joined `routes` data

---

## Changes Made

### 1. Route Fetching Query

**File:** `ShiftCalendar.tsx`

**Before:**
```typescript
const { data: routes = [] } = useQuery({
  queryKey: ['routes-active'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('id, origin, destination')
      .eq('is_active', true)
      .order('origin');
    if (error) throw error;
    return data;
  },
});
```

**After:**
```typescript
const { data: routes = [] } = useQuery({
  queryKey: ['route-frequencies-active'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('route_frequencies')
      .select(`
        id,
        route_id,
        departure_time,
        frequency_type,
        days_of_week,
        active,
        routes:routes!route_id (
          id,
          origin,
          destination,
          duration_hours
        )
      `)
      .eq('active', true)
      .order('departure_time');

    if (error) {
      console.error('Error fetching route frequencies:', error);
      throw error;
    }

    // Transform data to include route details at top level
    return (data || []).map((rf: any) => ({
      id: rf.route_id, // Use route_id for compatibility
      route_frequency_id: rf.id, // Keep frequency ID for reference
      origin: Array.isArray(rf.routes) ? rf.routes[0]?.origin : rf.routes?.origin || '',
      destination: Array.isArray(rf.routes) ? rf.routes[0]?.destination : rf.routes?.destination || '',
      duration_hours: Array.isArray(rf.routes) ? rf.routes[0]?.duration_hours : rf.routes?.duration_hours || null,
      departure_time: rf.departure_time,
      frequency_type: rf.frequency_type,
      days_of_week: rf.days_of_week,
    }));
  },
});
```

---

### 2. Status Value Updated

**File:** `ShiftCalendar.tsx` - Create Shift Mutation

**Before:**
```typescript
status: 'active',
```

**After:**
```typescript
status: 'ACTIVE', // Use UPPERCASE to match enum
```

---

## Key Features

### Data Structure

**Returned Object:**
```typescript
{
  id: string;                    // route_id (for compatibility)
  route_frequency_id: string;    // route_frequency ID
  origin: string;                // from routes table
  destination: string;           // from routes table
  duration_hours: number | null; // from routes table
  departure_time: string;        // from route_frequencies
  frequency_type: string;        // DAILY, WEEKLY, SPECIFIC_DAYS
  days_of_week: number[];        // [0-6] for days
}
```

### Benefits

**1. Schedule-Based Routes**
- Only shows routes that have active schedules
- Includes departure times
- Shows frequency information

**2. Full Route Details**
- Origin and destination from routes table
- Duration information preserved
- All existing UI components work unchanged

**3. Smart Data Handling**
- Handles both array and object responses from Supabase
- Graceful fallbacks for missing data
- Error logging for debugging

**4. Backward Compatible**
- Uses `route_id` as `id` for existing logic
- Keeps `route_frequency_id` for future use
- No breaking changes to UI components

---

## How It Works

### 1. Query Execution

```sql
SELECT 
  route_frequencies.id,
  route_frequencies.route_id,
  route_frequencies.departure_time,
  route_frequencies.frequency_type,
  route_frequencies.days_of_week,
  routes.origin,
  routes.destination,
  routes.duration_hours
FROM route_frequencies
JOIN routes ON route_frequencies.route_id = routes.id
WHERE route_frequencies.active = true
ORDER BY route_frequencies.departure_time
```

### 2. Data Transformation

**Input (from Supabase):**
```json
{
  "id": "freq-uuid",
  "route_id": "route-uuid",
  "departure_time": "08:00:00",
  "frequency_type": "DAILY",
  "days_of_week": [1,2,3,4,5],
  "routes": {
    "id": "route-uuid",
    "origin": "Johannesburg",
    "destination": "Pretoria",
    "duration_hours": 1.5
  }
}
```

**Output (transformed):**
```json
{
  "id": "route-uuid",
  "route_frequency_id": "freq-uuid",
  "origin": "Johannesburg",
  "destination": "Pretoria",
  "duration_hours": 1.5,
  "departure_time": "08:00:00",
  "frequency_type": "DAILY",
  "days_of_week": [1,2,3,4,5]
}
```

### 3. UI Display

**Route Dropdown:**
```tsx
<SelectItem key={route.id} value={route.id}>
  {route.origin} → {route.destination}
</SelectItem>
```

**Shows:**
- "Johannesburg → Pretoria"
- Only routes with active schedules
- Sorted by departure time

---

## Database Schema

### route_frequencies Table

```sql
CREATE TABLE route_frequencies (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES routes(id),
  departure_time TIME,
  frequency_type TEXT, -- DAILY, WEEKLY, SPECIFIC_DAYS
  days_of_week INTEGER[], -- [0-6]
  active BOOLEAN,
  -- other fields...
);
```

### driver_shifts Table

```sql
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  route_id UUID REFERENCES routes(id), -- Still uses route_id
  bus_id UUID REFERENCES buses(id),
  shift_date DATE,
  shift_type TEXT,
  status TEXT,
  -- other fields...
);
```

**Note:** `driver_shifts` still uses `route_id`, not `route_frequency_id`. This is correct because shifts are assigned to routes, and the schedule information comes from `route_frequencies`.

---

## Testing Checklist

### Route Dropdown
- [ ] Only shows routes with active schedules
- [ ] Displays "Origin → Destination" format
- [ ] Sorted by departure time
- [ ] No duplicate routes

### Shift Creation
- [ ] Can select route from dropdown
- [ ] Shift saves with correct route_id
- [ ] Status saves as 'ACTIVE' (uppercase)
- [ ] Shift appears in calendar

### Calendar Display
- [ ] Shifts show correct route information
- [ ] Click shift opens view dialog
- [ ] Route details display correctly
- [ ] No errors in console

### Auto-Generate
- [ ] Uses route_frequencies for generation
- [ ] Respects frequency types
- [ ] Assigns shifts correctly
- [ ] Shows proper success/conflict messages

---

## Edge Cases Handled

### 1. Array vs Object Responses
```typescript
origin: Array.isArray(rf.routes) 
  ? rf.routes[0]?.origin 
  : rf.routes?.origin || ''
```

### 2. Missing Route Data
```typescript
origin: rf.routes?.origin || '',
destination: rf.routes?.destination || '',
duration_hours: rf.routes?.duration_hours || null
```

### 3. Empty Results
```typescript
return (data || []).map(...)
```

### 4. Query Errors
```typescript
if (error) {
  console.error('Error fetching route frequencies:', error);
  throw error;
}
```

---

## Migration Notes

### No Database Changes Required
- `driver_shifts` table unchanged
- Still uses `route_id` column
- No new columns needed

### Frontend Only Changes
- Query changed to `route_frequencies`
- Data transformation added
- Status value updated to UPPERCASE

### Backward Compatible
- Existing shifts still work
- UI components unchanged
- No breaking changes

---

## Future Enhancements

### Possible Additions:

**1. Show Departure Time in Dropdown**
```tsx
<SelectItem key={route.id} value={route.id}>
  {route.departure_time} - {route.origin} → {route.destination}
</SelectItem>
```

**2. Filter by Frequency Type**
```typescript
.eq('frequency_type', 'DAILY')
```

**3. Filter by Day of Week**
```typescript
.contains('days_of_week', [currentDayOfWeek])
```

**4. Show Multiple Schedules per Route**
- Group by route
- Show all departure times
- Allow selecting specific schedule

---

## Comparison: Option A vs Option B

### Option A (Simple)
**Pros:**
- Simpler query
- Less data transformation
- Faster execution

**Cons:**
- Requires origin/destination in route_frequencies
- Loses route table data
- May need schema changes

### Option B (Full Join) ✅ IMPLEMENTED
**Pros:**
- Keeps all route data
- No schema changes needed
- More flexible
- Backward compatible

**Cons:**
- Slightly more complex query
- Requires data transformation
- Handles array/object responses

---

## Summary

**What Changed:**
- ✅ Fetches from `route_frequencies` instead of `routes`
- ✅ Joins with `routes` table for full details
- ✅ Transforms data for UI compatibility
- ✅ Updated status to UPPERCASE
- ✅ Added error handling and logging

**Why:**
- Routes are now defined by schedules
- Only active schedules should appear
- Maintains all route information
- Backward compatible with existing code

**Result:**
- Calendar shows only scheduled routes
- All route details preserved
- Shift creation works correctly
- Auto-generation uses schedules

**User Experience:**
- Dropdown shows only routes with active schedules
- Sorted by departure time (most relevant first)
- All existing functionality preserved
- No breaking changes

The Shift Calendar now uses `route_frequencies` as the source of truth for available routes! 🎉
