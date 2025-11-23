# 🚀 Auto-Generate Driver Shifts - Complete Implementation

## Overview
Production-ready system to automatically assign drivers, buses, and conductors to trips with conflict detection and smart scheduling.

---

## 📁 Files Created

### Backend
1. **`backend/src/services/shiftGenerationService.ts`**
   - Core business logic for shift generation
   - Conflict detection algorithm
   - Resource assignment logic
   - Statistics calculation

2. **`backend/src/routes/shiftGeneration.ts`**
   - API endpoints for shift generation
   - Preview and confirm endpoints
   - Statistics endpoint

3. **`backend/src/database/shiftGenerationQueries.sql`**
   - PostgreSQL functions for efficient queries
   - Bulk insert operations
   - Conflict checking functions

### Frontend
4. **`web/src/components/operations/AutoGenerateShifts.tsx`**
   - React UI component
   - Date and route selection
   - Preview dialog with statistics
   - Confirmation workflow

---

## 🔧 How It Works

### 1. User Input
```typescript
{
  selectedDate: "2025-11-22",
  selectedRoutes: ["route-uuid-1", "route-uuid-2"],
  maxHoursPerDriver: 10,
  prioritizeExperienced: true
}
```

### 2. Data Fetching
System fetches:
- ✅ All trips for selected date and routes
- ✅ Available drivers (not already assigned)
- ✅ Available buses (not already assigned)
- ✅ Available conductors (not already assigned)

### 3. Assignment Algorithm

#### Priority Sorting
```typescript
// Drivers sorted by:
1. Rating (if prioritizeExperienced = true)
2. Assigned hours (least hours first)
3. Availability
```

#### For Each Trip:
```
1. Check if trip already has assignments → Skip if yes
2. Calculate trip duration in hours
3. Find available driver:
   - Not exceeding max hours
   - No time conflicts
   - Valid license
4. Find available bus:
   - Sufficient capacity
   - No time conflicts
   - Active status
5. Find available conductor (optional):
   - No time conflicts
   - Active status
6. Create assignment or mark as conflict
```

#### Conflict Detection
```typescript
// Overlap check formula:
new_start < existing_end AND existing_start < new_end
```

### 4. Preview Generation
Returns:
```typescript
{
  preview: ShiftAssignment[],
  stats: {
    total_trips: 50,
    assigned: 45,
    conflicts: 2,
    no_driver: 2,
    no_bus: 1
  }
}
```

### 5. Confirmation
- Saves only successfully assigned shifts
- Updates trips table with driver/bus/conductor IDs
- Creates driver_shifts records

---

## 📊 Database Schema

### Required Tables

#### `driver_shifts`
```sql
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_date DATE NOT NULL,
  trip_id UUID REFERENCES trips(id),
  driver_id UUID REFERENCES drivers(id),
  bus_id UUID REFERENCES buses(id),
  conductor_id UUID REFERENCES conductors(id),
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `trips` (must have these columns)
```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS bus_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS conductor_id UUID;
```

---

## 🔌 API Endpoints

### 1. Generate Preview
```http
POST /api/shift-generation/preview
Content-Type: application/json

{
  "selectedDate": "2025-11-22",
  "selectedRoutes": ["uuid1", "uuid2"],
  "maxHoursPerDriver": 10,
  "prioritizeExperienced": true
}
```

**Response:**
```json
{
  "preview": [
    {
      "trip_id": "uuid",
      "trip_number": "TRP-001",
      "route": "Gaborone → Francistown",
      "departure_time": "2025-11-22T08:00:00Z",
      "arrival_time": "2025-11-22T12:00:00Z",
      "driver_id": "driver-uuid",
      "driver_name": "John Doe",
      "bus_id": "bus-uuid",
      "bus_registration": "B123ABC",
      "conductor_id": "conductor-uuid",
      "conductor_name": "Jane Smith",
      "status": "assigned",
      "conflicts": []
    }
  ],
  "stats": {
    "total_trips": 50,
    "assigned": 45,
    "conflicts": 2,
    "no_driver": 2,
    "no_bus": 1
  }
}
```

### 2. Confirm Shifts
```http
POST /api/shift-generation/confirm
Content-Type: application/json

{
  "assignments": [...preview data...],
  "selectedDate": "2025-11-22"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shifts saved successfully"
}
```

### 3. Get Statistics
```http
GET /api/shift-generation/stats/2025-11-22
```

**Response:**
```json
{
  "active": 5,
  "upcoming": 30,
  "completed": 10
}
```

---

## 🎯 Business Rules

### Driver Assignment Rules
1. ✅ Must have valid license (not expired)
2. ✅ Must be active status
3. ✅ Cannot exceed max hours per day (default 10)
4. ✅ Cannot have overlapping trips
5. ✅ Prioritize by rating if enabled
6. ✅ Distribute workload evenly

### Bus Assignment Rules
1. ✅ Must be active status
2. ✅ Must have sufficient seating capacity
3. ✅ Cannot have overlapping trips
4. ✅ Must pass service checks

### Conductor Assignment Rules
1. ✅ Must be active status
2. ✅ Cannot have overlapping trips
3. ✅ Optional (can be null)

---

## 🚦 Status Types

### Assignment Status
- **`assigned`** - Successfully assigned all resources
- **`conflict`** - Time conflict detected
- **`no_driver`** - No available driver found
- **`no_bus`** - No available bus found

### Shift Status
- **`upcoming`** - Shift scheduled for future
- **`active`** - Currently in progress
- **`completed`** - Finished

---

## 💡 Usage Example

### In Operations Dashboard:

```tsx
import AutoGenerateShifts from '@/components/operations/AutoGenerateShifts';

function OperationsDashboard() {
  return (
    <div>
      <h1>Driver Shift Management</h1>
      <AutoGenerateShifts />
    </div>
  );
}
```

---

## 🔍 Edge Cases Handled

### 1. No Drivers Available
```
Status: no_driver
Action: Mark trip as unassigned
Alert: Operations team notified
```

### 2. No Buses Available
```
Status: no_bus
Action: Mark trip as unassigned
Alert: Operations team notified
```

### 3. Time Conflicts
```
Status: conflict
Action: Skip assignment
Details: Show conflicting trips
```

### 4. Driver Exceeds Max Hours
```
Action: Skip to next available driver
Fallback: Mark as no_driver if all exhausted
```

### 5. Bus Insufficient Capacity
```
Action: Skip to next available bus
Fallback: Mark as no_bus if all exhausted
```

---

## 📈 Performance Optimizations

### Database Level
1. ✅ Indexes on `shift_date`, `driver_id`, `bus_id`
2. ✅ PostgreSQL functions for bulk operations
3. ✅ Efficient conflict checking queries

### Application Level
1. ✅ In-memory tracking of assignments
2. ✅ Single-pass algorithm
3. ✅ Batch inserts for confirmation

---

## 🧪 Testing Scenarios

### Test Case 1: Normal Day
```
Input: 50 trips, 20 drivers, 15 buses
Expected: 45+ assignments, minimal conflicts
```

### Test Case 2: High Demand
```
Input: 100 trips, 10 drivers, 8 buses
Expected: Partial assignments, many no_driver/no_bus
```

### Test Case 3: Overlapping Routes
```
Input: Same route, multiple times
Expected: Different drivers/buses per time slot
```

### Test Case 4: Driver Max Hours
```
Input: 12-hour trips, 10-hour limit
Expected: Driver rotated after 10 hours
```

---

## 🔐 Security & Permissions

### Required Roles
- **Operations Manager** - Can generate and confirm shifts
- **Admin** - Full access
- **Dispatcher** - View only

### RLS Policies
```sql
-- Only authenticated operations/admin can generate shifts
CREATE POLICY "Operations can manage shifts"
  ON driver_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operations')
      AND is_active = true
    )
  );
```

---

## 📝 Next Steps

1. **Run SQL Migration**
   ```bash
   psql -d your_database -f backend/src/database/shiftGenerationQueries.sql
   ```

2. **Register API Route**
   ```typescript
   // In backend/src/index.ts
   import shiftGenerationRoutes from './routes/shiftGeneration';
   app.use('/api/shift-generation', shiftGenerationRoutes);
   ```

3. **Add to Operations Dashboard**
   ```tsx
   // In operations dashboard
   <AutoGenerateShifts />
   ```

4. **Test the Flow**
   - Select date and routes
   - Click "Generate Preview"
   - Review assignments
   - Click "Confirm & Generate Shifts"

---

## 🎉 Benefits

✅ **Saves Time** - Automates hours of manual work
✅ **Reduces Errors** - Eliminates double-booking
✅ **Fair Distribution** - Evenly distributes workload
✅ **Compliance** - Enforces max hours rules
✅ **Visibility** - Clear preview before committing
✅ **Scalable** - Handles hundreds of trips efficiently

---

## 🆘 Troubleshooting

### Issue: "No drivers available"
**Solution:** Check driver status, license expiry, existing assignments

### Issue: "Conflicts detected"
**Solution:** Review trip times, adjust schedules, or manually assign

### Issue: "Preview takes too long"
**Solution:** Reduce selected routes, check database indexes

---

## 📞 Support

For issues or enhancements, contact the development team or create a ticket in the project management system.

**Happy Shift Generating! 🚌✨**
