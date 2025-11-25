# ✅ Database Column Names Fixed

## Issue
The app was crashing with:
```
ERROR {"code": "42703", "message": "column trips.departure_time does not exist"}
```

## Root Cause
Code was using incorrect column names:
- ❌ `departure_time` → ✅ `scheduled_departure`
- ❌ `arrival_time` → ✅ `scheduled_arrival`

## Files Fixed

### 1. Type Definitions
- `src/types/index.ts` - Updated Trip interface

### 2. Services
- `src/services/tripService.ts` - All queries updated
- `src/services/automationService.ts` - Report generation updated

### 3. Screens
- `src/screens/trips/TripDetailsScreen.tsx` - All date displays
- `src/screens/shifts/ShiftsScreen.tsx` - Shift filtering and display
- `src/screens/profile/TripHistoryScreen.tsx` - History display

### 4. Components
- `src/components/TripCard.tsx` - Time display

## Changes Made

### Before:
```typescript
trip.departure_time
trip.arrival_time
```

### After:
```typescript
trip.scheduled_departure
trip.scheduled_arrival
```

## Database Schema (Correct)
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  scheduled_departure TIMESTAMPTZ NOT NULL,
  scheduled_arrival TIMESTAMPTZ NOT NULL,
  -- other columns...
);
```

## All References Updated ✅
- Type interfaces
- Database queries
- Date formatting
- Filtering logic
- Display components

The app should now work correctly with your Supabase schema!
