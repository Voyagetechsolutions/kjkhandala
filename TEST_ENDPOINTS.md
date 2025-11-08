# 🧪 ENDPOINT TESTING GUIDE

## Quick Test Commands

### 1. Driver Assignments
```bash
# Get all assignments
curl http://localhost:3001/api/driver_assignments \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get active assignments
curl http://localhost:3001/api/driver_assignments/active \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 2. Driver Performance
```bash
# Get driver performance
curl "http://localhost:3001/api/driver_performance?driverId=DRIVER_ID&from=2025-01-01&to=2025-01-31" \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get performance summary
curl http://localhost:3001/api/driver_performance/summary \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 3. Maintenance Records
```bash
# Get all records
curl http://localhost:3001/api/maintenance_records \
  -H "Cookie: authToken=YOUR_TOKEN"

# Create record
curl -X POST http://localhost:3001/api/maintenance_records \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "busId": "BUS_ID",
    "type": "SERVICE",
    "description": "Regular maintenance",
    "date": "2025-01-07",
    "cost": 500
  }'
```

### 4. Maintenance Reminders
```bash
# Get upcoming reminders
curl "http://localhost:3001/api/maintenance_reminders?upcoming=true" \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get overdue
curl http://localhost:3001/api/maintenance_reminders/status/overdue \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 5. GPS Tracking
```bash
# Get dashboard
curl http://localhost:3001/api/gps_tracking/dashboard \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get trip location
curl http://localhost:3001/api/gps_tracking/location/TRIP_ID \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 6. Staff Attendance
```bash
# Check in
curl -X POST http://localhost:3001/api/staff_attendance/checkin \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat": 12.34, "lng": 56.78}'

# Get today's overview
curl http://localhost:3001/api/staff_attendance/today/overview \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 7. Trip Actions
```bash
# Start trip
curl -X POST http://localhost:3001/api/trips/TRIP_ID/start \
  -H "Cookie: authToken=YOUR_TOKEN"

# Complete trip
curl -X POST http://localhost:3001/api/trips/TRIP_ID/complete \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Trip completed successfully"}'
```

### 8. Booking Check-in
```bash
# Check in passenger
curl -X POST http://localhost:3001/api/bookings/BOOKING_ID/checkin \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get available seats
curl http://localhost:3001/api/bookings/trip/TRIP_ID/available-seats
```

### 9. Manifests
```bash
# Generate manifest
curl -X POST http://localhost:3001/api/manifests/TRIP_ID/generate \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get manifest
curl http://localhost:3001/api/manifests/TRIP_ID \
  -H "Cookie: authToken=YOUR_TOKEN"

# Export CSV
curl http://localhost:3001/api/manifests/TRIP_ID/export?format=csv \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -o manifest.csv
```

### 10. Finance
```bash
# Record collection
curl -X POST http://localhost:3001/api/finance/collections \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "source": "Cash sales",
    "date": "2025-01-07"
  }'

# Run reconciliation
curl -X POST http://localhost:3001/api/finance/reconcile/2025-01-07 \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get pending expenses
curl http://localhost:3001/api/finance/expenses/pending \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### 11. HR
```bash
# Create shift
curl -X POST http://localhost:3001/api/hr/shifts \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "shiftType": "MORNING",
    "startTime": "2025-01-08T08:00:00Z",
    "endTime": "2025-01-08T16:00:00Z",
    "date": "2025-01-08"
  }'

# Submit leave request
curl -X POST http://localhost:3001/api/hr/leave \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "ANNUAL",
    "startDate": "2025-01-10",
    "endDate": "2025-01-12",
    "reason": "Vacation"
  }'

# Process payroll
curl -X POST http://localhost:3001/api/hr/payroll/process \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 1,
    "year": 2025
  }'
```

### 12. Analytics
```bash
# Daily sales
curl http://localhost:3001/api/analytics/daily-sales/2025-01-07 \
  -H "Cookie: authToken=YOUR_TOKEN"

# Trip performance
curl "http://localhost:3001/api/analytics/trip-performance?from=2025-01-01&to=2025-01-31" \
  -H "Cookie: authToken=YOUR_TOKEN"

# Revenue report
curl "http://localhost:3001/api/analytics/revenue?from=2025-01-01&to=2025-01-31" \
  -H "Cookie: authToken=YOUR_TOKEN"

# Fleet utilization
curl "http://localhost:3001/api/analytics/fleet-utilization?from=2025-01-01&to=2025-01-31" \
  -H "Cookie: authToken=YOUR_TOKEN"
```

---

## 🎯 TEST FROM BROWSER CONSOLE

Open DevTools (F12) on http://localhost:8080 and run:

```javascript
// Login first to get token
// Then test any endpoint:

// Example: Get driver assignments
fetch('http://localhost:3001/api/driver_assignments', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Example: Check in
fetch('http://localhost:3001/api/staff_attendance/checkin', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lat: 12.34, lng: 56.78 })
})
  .then(r => r.json())
  .then(console.log);

// Example: Get analytics
fetch('http://localhost:3001/api/analytics/daily-sales/2025-01-07', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);
```

---

## ✅ Expected Responses

All endpoints return JSON in this format:

### Success:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error:
```json
{
  "error": "Error message"
}
```

---

## 🚨 Common Issues

### 1. 401 Unauthorized
- You're not logged in
- Token expired
- Solution: Login at http://localhost:8080/auth

### 2. 403 Forbidden
- You don't have permission for this action
- Solution: Login as admin or appropriate role

### 3. 404 Not Found
- Endpoint doesn't exist
- Check URL spelling
- Make sure backend is running

### 4. 500 Internal Server Error
- Backend crashed
- Check backend terminal for error logs
- Usually missing required fields or database error

---

## 📊 Quick Health Check

```bash
# Check if backend is running
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"2025-01-07T..."}
```

---

**All endpoints are ready for testing! 🎯**
