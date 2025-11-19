# Trip Search Update - Cities Table Integration

## Changes Made

### 1. Updated TripSearch Step Component
**File:** `frontend/src/pages/booking/steps/TripSearch.tsx`

**Changes:**
- ✅ Now fetches cities from `cities` table instead of extracting from `routes`
- ✅ Cities are sorted alphabetically
- ✅ Proper error handling for city loading
- ✅ Fixed TypeScript issues with Supabase query results

**Query:**
```typescript
const { data, error } = await supabase
  .from('cities')
  .select('name')
  .order('name');
```

---

### 2. Updated SearchTrips Page
**File:** `frontend/src/pages/ticketing/SearchTrips.tsx`

**Changes:**
- ✅ Already fetches cities from `cities` table (was correct)
- ✅ Updated trip search to filter by exact city match
- ✅ Uses `routes!inner` join for efficient filtering
- ✅ Filters at database level instead of post-processing
- ✅ Uses `available_seats` from trips table directly
- ✅ Removed unnecessary `booking_seats` query
- ✅ Fixed Supabase import path to use `@/lib/supabase`

**Updated Query:**
```typescript
const { data, error } = await supabase
  .from('trips')
  .select(`
    id,
    trip_number,
    departure_time,
    arrival_time,
    base_fare,
    status,
    total_seats,
    available_seats,
    routes!inner (origin, destination),
    buses (name, bus_type)
  `)
  .eq('routes.origin', searchParams.origin)
  .eq('routes.destination', searchParams.destination)
  .gte('departure_time', `${searchParams.travel_date}T00:00:00`)
  .lte('departure_time', `${searchParams.travel_date}T23:59:59`)
  .in('status', ['SCHEDULED', 'BOARDING'])
  .gte('available_seats', parseInt(searchParams.passengers))
  .order('departure_time');
```

---

## How It Works Now

### City Selection:
1. **Origin Dropdown:** Populated from `cities` table, sorted alphabetically
2. **Destination Dropdown:** Populated from `cities` table, filtered to exclude selected origin
3. **Real-time Data:** Cities are fetched on component mount

### Trip Search:
1. User selects origin, destination, date, and number of passengers
2. Click "Search Trips" button
3. Query filters trips by:
   - Exact origin city match (via routes table join)
   - Exact destination city match (via routes table join)
   - Date range (00:00:00 to 23:59:59 on selected date)
   - Status (SCHEDULED or BOARDING)
   - Available seats >= requested passengers
4. Results are sorted by departure time
5. Trip cards display with all details

---

## Database Requirements

### Cities Table:
```sql
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Routes Table:
Must have `origin` and `destination` columns that reference city names.

### Trips Table:
Must have:
- `route_id` (foreign key to routes)
- `departure_time` (timestamptz)
- `status` (enum or text)
- `total_seats` (integer)
- `available_seats` (integer)
- `base_fare` (numeric)

---

## Benefits of This Approach

### Performance:
- ✅ **Faster queries** - Filtering at database level
- ✅ **Less data transfer** - Only matching trips returned
- ✅ **No post-processing** - Database does the filtering

### Accuracy:
- ✅ **Exact matches** - No partial string matching
- ✅ **Real-time availability** - Uses `available_seats` from trips table
- ✅ **Consistent data** - Single source of truth for cities

### Maintainability:
- ✅ **Centralized cities** - Easy to add/remove cities
- ✅ **Cleaner code** - Less client-side logic
- ✅ **Better UX** - Faster search results

---

## Testing Checklist

### Cities Loading:
- [ ] Origin dropdown shows all cities from database
- [ ] Destination dropdown shows all cities except selected origin
- [ ] Cities are sorted alphabetically
- [ ] Error message if cities fail to load

### Trip Search:
- [ ] Search button disabled until all fields filled
- [ ] Search shows loading state
- [ ] Results show only trips matching exact origin/destination
- [ ] Results filtered by date correctly
- [ ] Results show only trips with enough available seats
- [ ] Results sorted by departure time
- [ ] "No trips found" message when no results
- [ ] Success toast shows number of trips found

### Trip Display:
- [ ] Trip cards show correct origin/destination
- [ ] Departure/arrival times display correctly
- [ ] Bus name and type shown
- [ ] Available seats count accurate
- [ ] Price displayed correctly
- [ ] Status badge shows correct status

---

## Common Issues & Solutions

### Issue: Cities not loading
**Solution:** 
- Check cities table exists in Supabase
- Verify RLS policies allow SELECT on cities table
- Check console for errors

### Issue: No trips found
**Solution:**
- Verify trips exist for selected route
- Check trip status is SCHEDULED or BOARDING
- Verify departure_time is on selected date
- Check available_seats >= requested passengers
- Verify route origin/destination match city names exactly

### Issue: Wrong trips showing
**Solution:**
- Ensure city names in routes table match cities table exactly (case-sensitive)
- Check route_id foreign key is set correctly on trips
- Verify trips.available_seats is being updated correctly

---

## Future Enhancements

### Planned:
- [ ] Add city search/filter in dropdown
- [ ] Show popular routes
- [ ] Add route suggestions
- [ ] Cache cities for better performance
- [ ] Add city images/descriptions
- [ ] Multi-city/stopover search
- [ ] Flexible date search (±3 days)
- [ ] Price range filter
- [ ] Bus type filter

---

## Related Files

### Components:
- `frontend/src/pages/booking/steps/TripSearch.tsx` - Wizard step
- `frontend/src/pages/ticketing/SearchTrips.tsx` - Standalone page
- `frontend/src/pages/TripSearch.tsx` - Public page (may need update)

### Database:
- `supabase/COMPLETE_10_cities.sql` - Cities table schema
- `supabase/COMPLETE_01_core_tables.sql` - Trips and routes schema

---

## Deployment Notes

### No Database Changes Required:
The cities table should already exist. If not, run:

```sql
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common cities
INSERT INTO cities (name) VALUES
  ('Gaborone'),
  ('Francistown'),
  ('Maun'),
  ('Kasane'),
  ('Palapye'),
  ('Serowe'),
  ('Mahalapye'),
  ('Lobatse')
ON CONFLICT (name) DO NOTHING;
```

### Frontend Deployment:
1. Changes are already made
2. No new dependencies needed
3. Test in development
4. Deploy to production

---

## Summary

✅ **Cities Table Integration:** Both components now use cities table
✅ **Efficient Filtering:** Database-level filtering for better performance
✅ **Exact Matching:** No more partial string matches
✅ **Real-time Availability:** Uses trips.available_seats directly
✅ **Better UX:** Faster searches, accurate results

The trip search functionality is now fully connected to the cities table and provides accurate, efficient trip searching!
