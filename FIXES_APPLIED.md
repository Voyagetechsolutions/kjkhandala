# Fixes Applied - Nov 25, 2025

## 1. ✅ Assign Bus Page - Fully Implemented

### Admin Version (`frontend/src/pages/admin/AssignBus.tsx`)
**Status**: COMPLETE

**Features**:
- Standalone page (no tripId parameter needed)
- Shows all upcoming trips in table format
- Fetches buses from `buses` table
- Smart auto-assignment logic using `assign_bus()` RPC
- Manual bus selection with dialog
- Search functionality
- Summary cards (Total Trips, Unassigned, Available Buses)

**Key Functions**:
- `fetchTrips()` - Gets upcoming scheduled trips
- `fetchBuses()` - Gets active buses from database
- `autoAssignBus()` - Automated assignment using RPC function
- `assignBusToTrip()` - Manual assignment

### Operations Version
**Status**: NEEDS COPY
- Copy admin version to `frontend/src/pages/operations/AssignBus.tsx`
- Update navigation paths from `/admin/` to `/operations/`

---

## 2. ⏳ Trip Scheduling Page Fixes

### Issues to Fix:
1. **Trips Today not showing** - Need to check date filtering logic
2. **Upcoming Trips not showing** - Need to fix query
3. **Calendar should show route_frequencies** - Update TripCalendar component
4. **Remove Live Status tab** - Delete entire tab

### Files to Modify:
- `frontend/src/pages/admin/TripScheduling.tsx`
- `frontend/src/components/trips/TripCalendar.tsx`

---

## 3. ⏳ Fix Admin/Operations Switching Bug

### Issue:
When clicking "Driver Shifts" or "Trip Management" in admin sidebar, it switches to operations layout.

### Root Cause:
`TripScheduling.tsx` uses this logic:
```typescript
const location = useLocation();
const isOperationsRoute = location.pathname.startsWith('/operations');
const Layout = isOperationsRoute ? OperationsLayout : AdminLayout;
```

This causes the layout to switch based on URL, but the sidebar links are correct.

### Solution:
Remove dynamic layout switching from shared pages. Each dashboard should have its own page component or use a fixed layout.

---

## Next Steps:

1. Copy AssignBus to operations
2. Remove "Live Status" tab from TripScheduling
3. Fix trips display logic
4. Update TripCalendar to use route_frequencies
5. Fix layout switching bug
