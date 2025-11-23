# Fix All Ambiguous Foreign Key Errors

## Problem
Multiple components have `PGRST201` errors due to ambiguous foreign key relationships when querying with joins.

## Files Already Fixed ✅
1. ✅ `RouteFrequencyManager.tsx` - Manual joins implemented
2. ✅ `BookingWidget.tsx` - Manual joins implemented  
3. ✅ `SearchTrips.tsx` - Manual joins implemented
4. ✅ `TripScheduling.tsx` - Changed to `!` syntax

## Files Still Need Fixing ⚠️

### 1. `pages/ticketing/ReservedTickets.tsx` (Line 35-42)
**Current:**
```typescript
routes:route_id (origin, destination),
buses:bus_id (name, registration_number)
```

**Fix:** Change to:
```typescript
routes!route_id (origin, destination),
buses!bus_id (name, registration_number)
```

---

### 2. `pages/operations/LiveTracking.tsx` (Line 132-139)
**Current:**
```typescript
routes:route_id (origin, destination),
buses:bus_id (registration_number, name)
```

**Fix:** Change to:
```typescript
routes!route_id (origin, destination),
buses!bus_id (registration_number, name)
```

---

### 3. `pages/operations/AutomatedTripManagement.tsx` (Line 26-28)
**Current:**
```typescript
routes:route_id (origin, destination, duration_hours),
buses:bus_id (registration_number, model, capacity),
drivers:driver_id (full_name, phone)
```

**Fix:** Change to:
```typescript
routes!route_id (origin, destination, duration_hours),
buses!bus_id (registration_number, model, capacity),
drivers!driver_id (full_name, phone)
```

---

### 4. `pages/admin/DriverManagement.tsx` (Line 50-51)
**Current:**
```typescript
routes:route_id (origin, destination),
drivers:driver_id (id, full_name)
```

**Fix:** Change to:
```typescript
routes!route_id (origin, destination),
drivers!driver_id (id, full_name)
```

---

### 5. `components/trips/TripCalendar.tsx` (Line 41-43)
**Current:**
```typescript
routes:route_id (id, origin, destination, duration_hours),
buses:bus_id (id, registration_number, model),
drivers:driver_id (id, full_name, phone)
```

**Fix:** Change to:
```typescript
routes!route_id (id, origin, destination, duration_hours),
buses!bus_id (id, registration_number, model),
drivers!driver_id (id, full_name, phone)
```

---

## Quick Fix Pattern

**Find and Replace:**
- Find: `routes:route_id`
- Replace: `routes!route_id`

- Find: `buses:bus_id`
- Replace: `buses!bus_id`

- Find: `drivers:driver_id`
- Replace: `drivers!driver_id`

**OR** use manual joins like in `RouteFrequencyManager.tsx` if the `!` syntax still fails.

---

## Why This Happens

PostgREST gets confused when:
1. Multiple tables have foreign keys to the same table (e.g., `trips.bus_id` and `route_frequencies.bus_id` both reference `buses`)
2. You use the alias syntax `buses:bus_id` which is ambiguous

**Solution:**
- Use `buses!bus_id` to explicitly specify the foreign key column
- OR fetch data separately and join manually in JavaScript

---

## Verification

After fixing, check browser console for:
- ❌ No more `PGRST201` errors
- ✅ Data loads successfully
- ✅ No "Could not embed" messages
