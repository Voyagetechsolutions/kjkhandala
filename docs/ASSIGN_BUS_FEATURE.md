# Assign Bus Feature

## Overview
The Assign Bus feature provides intelligent bus assignment for trips using a smart recommendation system that optimizes fleet utilization.

## Features

### ✅ Smart Bus Recommendation
- **Least-Used Algorithm**: Automatically recommends the bus with the lowest trip count
- **Idle Time Priority**: Breaks ties by selecting buses that have been idle the longest
- **Real-Time Data**: Uses live trip and bus availability data

### ✅ Bus Filtering
- Only shows **active** buses
- Excludes buses in **maintenance**
- Filters for **available** buses only

### ✅ Visual Indicators
- **Green highlight** for recommended bus
- **Trip statistics** (total trips, last trip date)
- **Bus details** (registration, model, capacity, mileage)

### ✅ User Experience
- **Trip context** displayed at top of page
- **One-click assignment** with confirmation
- **Loading states** for all async operations
- **Toast notifications** for success/error feedback
- **Automatic redirect** after successful assignment

## Usage

### For Admin Dashboard
Navigate to: `/admin/assign-bus?tripId=<trip-id>`

### For Operations Dashboard
Navigate to: `/operations/assign-bus?tripId=<trip-id>`

### From Trip Management
Add a button to your trip management page:
```tsx
<Button onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}>
  Assign Bus
</Button>
```

## Technical Implementation

### Database Function
**Function Name**: `assign_bus()`

**Returns**:
- `bus_id` (uuid)
- `registration` (text)
- `last_trip_date` (date)
- `total_trips` (bigint)

**Logic**:
1. Filters active, available, non-maintenance buses
2. Left joins with trips table to count usage
3. Orders by trip count (ASC) and last trip date (NULLS FIRST)
4. Returns top result

### Frontend Components

**Location**:
- `/frontend/src/pages/admin/AssignBus.tsx`
- `/frontend/src/pages/operations/AssignBus.tsx`

**Key Functions**:
- `fetchBuses()` - Loads all available buses
- `fetchRecommendedBus()` - Calls RPC function for recommendation
- `fetchTripDetails()` - Loads trip context
- `assignBusToTrip()` - Updates trip with selected bus

### Routes
```tsx
// Admin
<Route path="/admin/assign-bus" element={<AssignBus />} />

// Operations
<Route path="/operations/assign-bus" element={<OperationsAssignBus />} />
```

## Database Schema Requirements

### Required Tables
- `buses` - Must have: id, registration, status, is_in_maintenance, is_available
- `trips` - Must have: id, bus_id, trip_date

### Required Columns (Optional but Recommended)
- `buses.model` - Bus model/type
- `buses.capacity` - Seating capacity
- `buses.total_mileage` - Odometer reading
- `routes.origin_city` - Trip origin
- `routes.destination_city` - Trip destination

## Installation

### 1. Apply Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly
psql -d your_database -f supabase/migrations/025_assign_bus_function.sql
```

### 2. Verify Function
```sql
SELECT * FROM assign_bus();
```

### 3. Test in Frontend
Navigate to `/admin/assign-bus?tripId=<valid-trip-id>`

## API Reference

### Supabase RPC Call
```typescript
const { data, error } = await supabase.rpc("assign_bus");
```

### Update Trip Assignment
```typescript
const { error } = await supabase
  .from("trips")
  .update({ 
    bus_id: busId,
    updated_at: new Date().toISOString()
  })
  .eq("id", tripId);
```

## UI Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` - shadcn/ui
- `Button` - shadcn/ui
- `toast` - shadcn/ui
- `Loader2`, `Bus`, `TrendingUp`, `Calendar`, `AlertCircle` - lucide-react icons

## Error Handling

### Missing Trip ID
- Shows error toast
- Redirects to trip management page

### No Available Buses
- Displays empty state with helpful message
- Shows icon and explanation

### Assignment Failure
- Shows error toast with retry option
- Logs error to console
- Does not redirect (allows retry)

## Best Practices

### When to Use
- ✅ Assigning buses to newly created trips
- ✅ Reassigning buses after maintenance
- ✅ Optimizing fleet utilization
- ✅ Balancing wear across fleet

### When NOT to Use
- ❌ Emergency replacements (use manual override)
- ❌ Specific customer requests (use manual selection)
- ❌ Special event buses (use manual assignment)

## Future Enhancements

### Potential Improvements
1. **Multi-criteria scoring**: Consider fuel efficiency, maintenance schedule
2. **Route compatibility**: Match bus type to route requirements
3. **Driver preferences**: Consider driver-bus familiarity
4. **Predictive maintenance**: Avoid buses near service intervals
5. **Capacity matching**: Recommend based on expected passenger count
6. **Historical performance**: Factor in on-time performance by bus

## Troubleshooting

### Function Returns No Results
**Cause**: No buses meet availability criteria
**Solution**: Check bus statuses, maintenance flags, and availability flags

### Assignment Fails
**Cause**: Trip already has a bus or permission issue
**Solution**: Verify trip exists and user has update permissions

### Recommended Bus Not Showing
**Cause**: RPC function error or no buses available
**Solution**: Check browser console and Supabase logs

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database function exists: `SELECT * FROM pg_proc WHERE proname = 'assign_bus';`
3. Test function directly in Supabase SQL editor
4. Review Supabase logs for RPC errors

## License
Part of Voyage BMS - Bus Management System
