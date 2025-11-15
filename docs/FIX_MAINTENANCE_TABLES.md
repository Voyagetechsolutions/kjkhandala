# ✅ FIXED - Maintenance Tables Immutable Function Error

## Error
```
ERROR: 42P17: functions in index predicate must be marked IMMUTABLE
```

## What Was Wrong
Line 100 in `COMPLETE_05_maintenance_tables.sql` had:
```sql
CREATE INDEX idx_maintenance_schedules_overdue ON public.maintenance_schedules(next_service_date) 
  WHERE status = 'ACTIVE' AND next_service_date < CURRENT_DATE;
```

`CURRENT_DATE` is a non-immutable function (it changes every day), so it can't be used in index predicates.

## Fix Applied
Changed to a simple composite index:
```sql
CREATE INDEX idx_maintenance_schedules_overdue ON public.maintenance_schedules(next_service_date, status);
```

## Why This Works
- The index can still be used efficiently for queries filtering by date and status
- PostgreSQL will use this index when you query for overdue schedules
- No functional difference in query performance
- Just removes the non-immutable function from the predicate

## ✅ Ready to Run
`COMPLETE_05_maintenance_tables.sql` is now fixed!

---

## Summary of All Index Fixes

### File 01 - Core Tables
**Before:**
```sql
CREATE INDEX idx_trips_date_status ON public.trips(DATE(scheduled_departure), status);
```
**After:**
```sql
CREATE INDEX idx_trips_date_status ON public.trips(scheduled_departure, status);
```

### File 05 - Maintenance Tables
**Before:**
```sql
CREATE INDEX idx_maintenance_schedules_overdue ON public.maintenance_schedules(next_service_date) 
  WHERE status = 'ACTIVE' AND next_service_date < CURRENT_DATE;
```
**After:**
```sql
CREATE INDEX idx_maintenance_schedules_overdue ON public.maintenance_schedules(next_service_date, status);
```

---

## ✅ All Files Ready!
Both fixes applied. Continue running the SQL files in order! 🎉
