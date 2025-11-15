# 🎨 FRONTEND INTEGRATION GUIDE

## 📋 Overview

This guide shows you exactly which frontend pages to update and how to connect them to the new backend endpoints.

---

## ✅ BACKEND ENDPOINTS READY (80+ endpoints)

All backend routes are implemented and running on `http://localhost:3001/api`

---

## 🔄 FRONTEND PAGES TO UPDATE

### **PRIORITY 1: High-Impact Pages (Previously 404 errors)**

#### 1. **Driver Assignments & Performance**
**Pages to Update:**
- `frontend/src/pages/operations/DriverAssignments.tsx`
- `frontend/src/pages/admin/Drivers.tsx`
- `frontend/src/pages/driver/Performance.tsx`

**New API Endpoints:**
```typescript
// Get assignments
GET /api/driver_assignments
GET /api/driver_assignments/active

// Create assignment
POST /api/driver_assignments
{
  tripId: string;
  driverId: string;
  busId?: string;
}

// Get performance
GET /api/driver_performance?driverId=ID&from=DATE&to=DATE
GET /api/driver_performance/summary
```

**Replace:**
- Remove any Supabase calls
- Use `api.get('/driver_assignments')`
- Update interfaces to match backend response

---

#### 2. **Maintenance Records & Reminders**
**Pages to Update:**
- `frontend/src/pages/maintenance/Records.tsx`
- `frontend/src/pages/maintenance/Reminders.tsx`
- `frontend/src/pages/maintenance/Dashboard.tsx`

**New API Endpoints:**
```typescript
// Records
GET /api/maintenance_records?busId=&type=&status=
POST /api/maintenance_records
PUT /api/maintenance_records/:id
DELETE /api/maintenance_records/:id

// Reminders
GET /api/maintenance_reminders?upcoming=true
POST /api/maintenance_reminders
POST /api/maintenance_reminders/:id/complete
GET /api/maintenance_reminders/status/overdue
```

---

#### 3. **GPS Tracking (Live Tracking)**
**Pages to Update:**
- `frontend/src/pages/tracking/LiveTracking.tsx`
- `frontend/src/pages/operations/Dashboard.tsx`

**New API Endpoints:**
```typescript
// Get dashboard view
GET /api/gps_tracking/dashboard

// Get trip location
GET /api/gps_tracking/location/:tripId

// Post location (driver app)
POST /api/gps_tracking/location
{
  tripId: string;
  busId: string;
  lat: number;
  lng: number;
  speed?: number;
}
```

**WebSocket Integration:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { socket } = useWebSocket();

socket.on('location:update', (data) => {
  // Update map marker
  updateBusLocation(data);
});
```

---

#### 4. **Staff Attendance**
**Pages to Update:**
- `frontend/src/pages/hr/Attendance.tsx`
- `frontend/src/pages/hr/Dashboard.tsx`

**New API Endpoints:**
```typescript
// Check in/out
POST /api/staff_attendance/checkin
POST /api/staff_attendance/checkout

// Get attendance
GET /api/staff_attendance?userId=&from=&to=
GET /api/staff_attendance/my-attendance
GET /api/staff_attendance/today/overview

// Mark attendance (HR)
POST /api/staff_attendance/mark
```

---

#### 5. **Trip Actions (Start, Complete, Cancel)**
**Pages to Update:**
- `frontend/src/pages/driver/MyTrips.tsx`
- `frontend/src/pages/operations/Trips.tsx`
- `frontend/src/pages/admin/Trips.tsx`

**New API Endpoints:**
```typescript
// Trip actions
POST /api/trips/:id/start
POST /api/trips/:id/complete
POST /api/trips/:id/cancel
POST /api/trips/:id/boarding
```

**Add Buttons:**
```tsx
// Driver Dashboard
<Button onClick={() => handleStartTrip(trip.id)}>
  Start Trip
</Button>

<Button onClick={() => handleCompleteTrip(trip.id)}>
  Complete Trip
</Button>

// Operations Dashboard
<Button onClick={() => handleCancelTrip(trip.id)}>
  Cancel Trip
</Button>
```

---

#### 6. **Booking Check-in & Seat Management**
**Pages to Update:**
- `frontend/src/pages/ticketing/CheckIn.tsx`
- `frontend/src/pages/ticketing/Sales.tsx`
- `frontend/src/pages/SeatSelection.tsx`

**New API Endpoints:**
```typescript
// Check-in
POST /api/bookings/:id/checkin

// Seat holds
POST /api/bookings/hold
{
  tripId: string;
  seatNumber: number;
  expiresInMinutes?: number;
}

DELETE /api/bookings/hold/:id

// Available seats
GET /api/bookings/trip/:tripId/available-seats
```

---

#### 7. **Passenger Manifest**
**Pages to Update:**
- `frontend/src/pages/operations/PassengerManifest.tsx`
- `frontend/src/pages/driver/Manifest.tsx`

**New API Endpoints:**
```typescript
// Generate manifest
POST /api/manifests/:tripId/generate

// Get manifest
GET /api/manifests/:tripId

// Export CSV
GET /api/manifests/:tripId/export?format=csv
```

**Add Export Button:**
```tsx
<Button onClick={() => window.open(`/api/manifests/${tripId}/export?format=csv`)}>
  Download CSV
</Button>
```

---

#### 8. **Finance Workflows**
**Pages to Update:**
- `frontend/src/pages/finance/Collections.tsx`
- `frontend/src/pages/finance/Reconciliation.tsx`
- `frontend/src/pages/finance/Expenses.tsx`

**New API Endpoints:**
```typescript
// Collections
POST /api/finance/collections
GET /api/finance/collections?from=&to=

// Reconciliation
POST /api/finance/reconcile/:date
GET /api/finance/reconciliation/:date

// Expense approval
PUT /api/finance/expenses/:id/approve
PUT /api/finance/expenses/:id/reject
GET /api/finance/expenses/pending
```

---

#### 9. **HR Workflows**
**Pages to Update:**
- `frontend/src/pages/hr/Shifts.tsx`
- `frontend/src/pages/hr/Leave.tsx`
- `frontend/src/pages/hr/Payroll.tsx`
- `frontend/src/pages/hr/Documents.tsx`

**New API Endpoints:**
```typescript
// Shifts
POST /api/hr/shifts
GET /api/hr/shifts/:userId

// Leave
POST /api/hr/leave
PUT /api/hr/leave/:id/approve
PUT /api/hr/leave/:id/reject

// Payroll
POST /api/hr/payroll/process
GET /api/hr/payroll/:month

// Documents
POST /api/hr/documents
GET /api/hr/documents/expiring?days=30
```

---

#### 10. **Reports & Analytics**
**Pages to Update:**
- `frontend/src/pages/reports/DailySales.tsx`
- `frontend/src/pages/reports/TripPerformance.tsx`
- `frontend/src/pages/reports/Revenue.tsx`
- `frontend/src/pages/reports/FleetUtilization.tsx`

**New API Endpoints:**
```typescript
// Reports
GET /api/analytics/daily-sales/:date
GET /api/analytics/trip-performance?from=&to=
GET /api/analytics/driver-performance/:id?from=&to=
GET /api/analytics/revenue?from=&to=&routeId=
GET /api/analytics/fleet-utilization?from=&to=
```

---

## 📝 HOW TO UPDATE EACH PAGE

### **Step-by-Step Process:**

1. **Remove Supabase imports:**
```typescript
// ❌ Remove this
import { supabase } from "@/integrations/supabase/client";

// ✅ Add this
import api from "@/lib/api";
```

2. **Update interface to match backend:**
```typescript
// Example: Driver Assignment
interface Assignment {
  id: string;
  tripId: string;
  driverId: string;
  busId?: string;
  driver: {
    firstName: string;
    lastName: string;
  };
  trip: {
    departureDate: Date;
    route: {
      name: string;
    };
  };
}
```

3. **Replace data fetching:**
```typescript
// ❌ Old (Supabase)
const { data, error } = await supabase
  .from('assignments')
  .select('*');

// ✅ New (Backend API)
const response = await api.get('/driver_assignments');
const assignments = response.data.data; // Note the .data.data
```

4. **Replace mutations:**
```typescript
// ❌ Old (Supabase)
await supabase.from('assignments').insert(data);

// ✅ New (Backend API)
await api.post('/driver_assignments', data);
```

5. **Update error handling:**
```typescript
try {
  const response = await api.post('/endpoint', data);
  toast({ title: "Success!" });
} catch (error: any) {
  toast({
    variant: "destructive",
    title: "Error",
    description: error.response?.data?.error || "Failed to save"
  });
}
```

6. **Add loading states:**
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get('/endpoint');
    setData(response.data.data);
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 TESTING CHECKLIST

For each updated page:

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Create form submits successfully
- [ ] Edit form updates correctly
- [ ] Delete function works
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Error messages display properly
- [ ] Data persists after refresh

---

## 🚀 QUICK START EXAMPLE

**File:** `frontend/src/pages/operations/DriverAssignments.tsx`

```typescript
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Assignment {
  id: string;
  tripId: string;
  driver: {
    firstName: string;
    lastName: string;
  };
  trip: {
    departureDate: Date;
    route: {
      name: string;
      origin: string;
      destination: string;
    };
  };
  bus: {
    registrationNumber: string;
  };
}

export default function DriverAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/driver_assignments');
      setAssignments(response.data.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch assignments"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (tripId: string) => {
    if (!confirm("Unassign driver from this trip?")) return;

    try {
      await api.delete(`/driver_assignments/${tripId}`);
      toast({ title: "Driver unassigned successfully" });
      fetchAssignments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to unassign"
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Assignments</h1>
      
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {assignment.driver.firstName} {assignment.driver.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {assignment.trip.route.origin} → {assignment.trip.route.destination}
                </p>
                <p className="text-sm">
                  Bus: {assignment.bus.registrationNumber}
                </p>
                <p className="text-sm">
                  Departure: {new Date(assignment.trip.departureDate).toLocaleString()}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnassign(assignment.tripId)}
              >
                Unassign
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 CUSTOMIZATION AREAS

### **1. Payroll Calculations**
**File:** `backend/src/routes/hr.js` (line ~714)

```javascript
// Current: Basic calculation
const baseSalary = 5000; // ← Change this
const dailyRate = baseSalary / 22; // ← Adjust working days

// Add your custom logic:
const baseSalary = employee.baseSalary || 5000;
const allowances = calculateAllowances(employee);
const deductions = calculateDeductions(employee);
const grossSalary = baseSalary + allowances - deductions;
```

### **2. Pricing Logic**
**File:** `backend/src/routes/bookings.js`

```javascript
// Add dynamic pricing based on demand, season, route, etc.
const calculatePrice = (trip, seatNumber) => {
  let basePrice = trip.route.basePrice;
  
  // Peak hours
  const hour = new Date(trip.departureDate).getHours();
  if (hour >= 6 && hour <= 9) basePrice *= 1.2;
  
  // Window seats premium
  if (isWindowSeat(seatNumber)) basePrice *= 1.1;
  
  return basePrice;
};
```

### **3. Business Rules**
**File:** Various route files

- Driver working hours limits
- Bus maintenance intervals
- Leave approval rules
- Expense approval thresholds
- Fuel efficiency targets

---

## 🎊 NEXT ACTIONS

1. ✅ **Start with Priority 1 pages** (previously showing 404s)
2. ✅ **Test each page** after updating
3. ✅ **Customize business logic** as needed
4. ✅ **Add validation** on frontend forms
5. ✅ **Improve UX** with loading states and error messages

---

**All backend endpoints are ready and waiting! Let's connect the frontend! 🚀**
