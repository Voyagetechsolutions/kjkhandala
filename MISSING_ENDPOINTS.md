# 🔴 MISSING BACKEND ENDPOINTS

These endpoints are being called by the frontend but don't exist in the backend:

## MISSING ROUTES (404 Errors):

1. **`/api/fuel_records`** - Should be under `/api/finance/fuel` or create new route
2. **`/api/maintenance_reminders`** - Should be under `/api/maintenance/reminders`
3. **`/api/gps_tracking`** - Should be under `/api/tracking/gps`
4. **`/api/revenue_summary`** - Should be under `/api/finance/revenue-summary`
5. **`/api/staff`** - Should be under `/api/hr/staff` or `/api/users`
6. **`/api/maintenance_records`** - Should be under `/api/maintenance/records`
7. **`/api/schedules`** - Should be under `/api/trips/schedules` or create separate
8. **`/api/expenses`** - Should be under `/api/finance/expenses`
9. **`/api/staff_attendance`** - Should be under `/api/hr/attendance`
10. **`/api/payroll`** - Should be under `/api/hr/payroll`
11. **`/api/profiles`** - Should be under `/api/users/profiles`
12. **`/api/user_roles`** - Should be under `/api/users/roles`

## SOLUTION:

**Option 1:** Add proxy routes in server.js to redirect calls
**Option 2:** Fix frontend to call correct nested routes
**Option 3:** Create flat route files for these endpoints

I'll use **Option 3** - Create simple route files that the frontend expects.
