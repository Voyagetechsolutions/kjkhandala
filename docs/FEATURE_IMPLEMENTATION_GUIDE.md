

# Feature Implementation Guide

## Overview

This guide covers the implementation of four major features:
1. **Employee-Payroll Synchronization**
2. **Fuel Management System** (Driver & Admin)
3. **Seamless Ticketing Flow** (Customer & Admin)
4. **Enhanced Delay Management**

---

## 1. Employee-Payroll Synchronization

### Database Changes

**File:** `supabase/FEATURE_ENHANCEMENTS.sql`

#### What It Does:
- Automatically syncs employee data (salary, status) to payroll records
- Creates a unified view showing employee and payroll information
- Updates draft payroll records when employee salary changes

#### Key Components:

**View: `employee_payroll_sync`**
- Combines employee and latest payroll data
- Shows current salary vs payroll amounts
- Filters active employees only

**Trigger: `sync_employee_to_payroll()`**
- Fires when employee salary or status changes
- Updates all draft payroll records for that employee
- Ensures payroll always reflects current employee data

#### Frontend Integration:

The HR Payroll page (`HRPayroll.tsx`) already queries the `payroll` table with employee relations. The sync happens automatically in the database.

**To enhance the UI:**
```typescript
// Fetch synchronized data
const { data: employeePayrollData } = useQuery({
  queryKey: ['employee-payroll-sync'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('employee_payroll_sync')
      .select('*');
    if (error) throw error;
    return data;
  }
});
```

---

## 2. Fuel Management System

### A. Driver Side - Fuel Logging

**File:** `frontend/src/pages/driver/FuelLogs.tsx`

#### Features:
- ✅ View fuel purchase history
- ✅ Add new fuel logs with receipt upload
- ✅ Select from approved fuel stations
- ✅ Auto-calculate total cost
- ✅ Upload receipt images/PDFs
- ✅ Track approval status (Pending/Approved/Rejected)
- ✅ View current bus assignment

#### How It Works:

1. **Driver adds fuel log:**
   - Selects fuel station from predefined list
   - Enters liters, cost per liter (auto-calculates total)
   - Enters odometer reading
   - Uploads receipt image/PDF
   - Submits for approval

2. **Receipt Upload:**
   - Files stored in Supabase Storage bucket `fuel-receipts`
   - Organized by driver ID: `{driver_id}/{timestamp}.{ext}`
   - Supports images (JPG, PNG) and PDFs
   - Max file size: 5MB

3. **Status Tracking:**
   - **Pending** - Awaiting admin approval
   - **Approved** - Approved by finance/admin
   - **Rejected** - Rejected with reason

### B. Admin Side - Fuel Station Management

**File:** `frontend/src/pages/admin/FuelStations.tsx`

#### Features:
- ✅ Add/Edit fuel stations
- ✅ Toggle station active/inactive status
- ✅ View station statistics
- ✅ Manage contact information
- ✅ Only active stations visible to drivers

#### Station Fields:
- Name (required)
- Location (required)
- Contact Person
- Contact Phone
- Contact Email
- Active Status (toggle)

### Database Schema:

**Table: `fuel_stations`**
```sql
- id (UUID)
- company_id (UUID)
- name (TEXT)
- location (TEXT)
- contact_person (TEXT)
- contact_phone (TEXT)
- contact_email (TEXT)
- is_active (BOOLEAN)
```

**Table: `fuel_logs` (enhanced)**
```sql
- fuel_station_id (UUID) - NEW
- receipt_image_url (TEXT) - NEW
- status (TEXT) - NEW: pending/approved/rejected
- rejection_reason (TEXT) - NEW
```

**View: `driver_fuel_logs`**
- Joins fuel_logs + drivers + buses + fuel_stations
- Shows complete fuel log information
- Used by driver interface

### Storage Setup:

**Required:** Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `fuel-receipts`
3. Settings:
   - Public: **No** (private)
   - File size limit: **5MB**
   - Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf`

4. Apply storage policies (included in SQL file)

---

## 3. Seamless Ticketing Flow

### Current State:
The ticketing process has separate pages with sidebar navigation.

### Target State:
A guided, step-by-step flow without sidebar navigation.

### Flow Steps:

#### Customer Side:
1. **Search Trips** → Select trip
2. **Seat Selection** → Choose seats
3. **Passenger Details** → Enter info
4. **Payment** → Process payment
5. **Booking Summary** → Review
6. **Issue Ticket** → Download/Print

#### Admin Side:
Same flow but with admin privileges and additional options.

### Implementation Approach:

**Option A: Multi-Step Form Component**
Create a wizard-style component with progress indicator.

**Option B: Flow State Management**
Use React Context or URL params to track flow state.

**Recommended: Option A**

```typescript
// Example structure
<TicketingFlow>
  <FlowStep step={1} title="Search Trips">
    <TripSearch onNext={handleTripSelect} />
  </FlowStep>
  
  <FlowStep step={2} title="Select Seats">
    <SeatSelection onNext={handleSeatSelect} />
  </FlowStep>
  
  <FlowStep step={3} title="Passenger Details">
    <PassengerForm onNext={handlePassengerSubmit} />
  </FlowStep>
  
  <FlowStep step={4} title="Payment">
    <PaymentForm onNext={handlePayment} />
  </FlowStep>
  
  <FlowStep step={5} title="Confirmation">
    <BookingSummary onComplete={handleComplete} />
  </FlowStep>
</TicketingFlow>
```

### Database Enhancement:

**Table: `bookings` (enhanced)**
```sql
- flow_step (TEXT) - Tracks current step
- flow_started_at (TIMESTAMPTZ)
- flow_completed_at (TIMESTAMPTZ)
```

**Table: `booking_flow_history`**
- Tracks each step completion
- Useful for analytics and abandonment tracking

---

## 4. Enhanced Delay Management

### Database Schema:

**Table: `trip_delays`**
```sql
- id (UUID)
- trip_id (UUID)
- delay_reason (TEXT)
- delay_minutes (INTEGER)
- original_departure (TIMESTAMPTZ)
- new_departure (TIMESTAMPTZ)
- affected_passengers (INTEGER) - Auto-calculated
- notification_sent (BOOLEAN)
- resolved (BOOLEAN)
- resolved_at (TIMESTAMPTZ)
```

**View: `delay_management_overview`**
- Joins trip_delays + trips + routes + buses + drivers
- Shows complete delay information
- Used by delay management dashboard

### Features:

1. **Automatic Passenger Count:**
   - Trigger calculates affected passengers
   - Counts confirmed/checked-in bookings

2. **Delay Tracking:**
   - Original vs new departure time
   - Delay duration in minutes
   - Reason for delay

3. **Resolution Status:**
   - Mark delays as resolved
   - Track resolution time

4. **Notification System:**
   - Flag for notification sent
   - Integration point for SMS/Email alerts

### Frontend Component:

The existing `DelayManagement.tsx` component can be enhanced to use the new schema:

```typescript
const { data: delays } = useQuery({
  queryKey: ['delay-management-overview'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('delay_management_overview')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
});
```

---

## Deployment Steps

### 1. Database Setup

```bash
# Run in Supabase SQL Editor (in order):

# 1. Create enum types (if not already done)
\i supabase/00_PRODUCTION_ENUMS.sql

# 2. Apply feature enhancements
\i supabase/FEATURE_ENHANCEMENTS.sql
```

### 2. Storage Setup

1. Create `fuel-receipts` bucket in Supabase Dashboard
2. Configure bucket settings (private, 5MB limit)
3. The SQL file includes storage policies (uncomment and run)

### 3. Frontend Routes

Add new routes to `App.tsx`:

```typescript
// Driver routes
<Route path="/driver/fuel-logs" element={<FuelLogs />} />

// Admin routes
<Route path="/admin/fuel-stations" element={<FuelStations />} />
```

### 4. Navigation Updates

**Driver Layout:**
Add fuel logs link to driver sidebar.

**Admin Layout:**
Add fuel stations link to admin sidebar (Finance or Operations section).

### 5. Testing Checklist

#### Employee-Payroll Sync:
- [ ] Update employee salary in HR module
- [ ] Verify draft payroll records update automatically
- [ ] Check employee_payroll_sync view shows correct data

#### Fuel Management:
- [ ] Admin can add/edit fuel stations
- [ ] Admin can toggle station active/inactive
- [ ] Driver sees only active stations
- [ ] Driver can upload fuel log with receipt
- [ ] Receipt uploads to storage successfully
- [ ] Admin can view/approve fuel logs

#### Ticketing Flow:
- [ ] User can complete booking without sidebar navigation
- [ ] Each step leads to next automatically
- [ ] Flow state tracked in database
- [ ] Abandonment tracking works

#### Delay Management:
- [ ] Create delay for a trip
- [ ] Affected passengers calculated automatically
- [ ] Delay appears in overview
- [ ] Can mark delay as resolved

---

## RLS Policies Summary

### Fuel Stations:
- **Admins:** Full access (CRUD)
- **Drivers:** Read-only (active stations only)

### Fuel Logs:
- **Drivers:** Can create and view their own logs
- **Admins/Finance:** Full access to all logs

### Trip Delays:
- **Operations/Admins:** Full access
- **Drivers:** Can view delays for their trips

### Booking Flow:
- **Users:** Can view their own booking flow
- **Admins/Ticketing:** Can view all booking flows

---

## Future Enhancements

### Fuel Management:
- [ ] Fuel consumption analytics
- [ ] Fuel efficiency reports per bus
- [ ] Automatic fuel allowance calculations
- [ ] Integration with accounting system

### Ticketing Flow:
- [ ] Progress bar showing current step
- [ ] Ability to go back to previous step
- [ ] Save draft bookings
- [ ] Email notifications at each step

### Delay Management:
- [ ] Automatic SMS/Email notifications to passengers
- [ ] Delay prediction based on historical data
- [ ] Integration with GPS tracking
- [ ] Compensation workflow for significant delays

### Employee-Payroll:
- [ ] Automatic payroll generation
- [ ] Payslip generation and distribution
- [ ] Tax calculations
- [ ] Bank file generation for payments

---

## Support and Troubleshooting

### Common Issues:

**1. Receipt Upload Fails:**
- Check storage bucket exists and is configured
- Verify file size < 5MB
- Check file type is allowed
- Verify storage policies are applied

**2. Fuel Stations Not Showing:**
- Check station is marked as active
- Verify RLS policies allow driver access
- Check driver is authenticated

**3. Payroll Not Syncing:**
- Verify trigger is created and enabled
- Check employee has salary set
- Ensure payroll status is 'draft'

**4. Delay Count Wrong:**
- Trigger may not be firing
- Check booking statuses are correct
- Verify trip_id is valid

---

## Files Created/Modified

### New SQL Files:
- ✅ `supabase/FEATURE_ENHANCEMENTS.sql`

### New Frontend Components:
- ✅ `frontend/src/pages/driver/FuelLogs.tsx`
- ✅ `frontend/src/pages/admin/FuelStations.tsx`

### To Be Created:
- ⏳ Ticketing flow wizard component
- ⏳ Enhanced delay management dashboard
- ⏳ Employee-payroll sync UI enhancements

### To Be Modified:
- ⏳ `App.tsx` - Add new routes
- ⏳ Driver layout - Add fuel logs link
- ⏳ Admin layout - Add fuel stations link
- ⏳ Existing ticketing pages - Integrate with flow
- ⏳ Delay management page - Use new schema

---

## Next Steps

1. **Deploy Database Changes:**
   - Run `FEATURE_ENHANCEMENTS.sql` in Supabase
   - Create storage bucket
   - Verify all tables and views created

2. **Add Routes:**
   - Update `App.tsx` with new routes
   - Update navigation layouts

3. **Test Fuel Management:**
   - Test as admin (add stations)
   - Test as driver (log fuel, upload receipt)

4. **Implement Ticketing Flow:**
   - Create wizard component
   - Integrate existing pages
   - Test complete flow

5. **Enhance Delay Management:**
   - Update existing component
   - Test delay creation and resolution

6. **Documentation:**
   - Create user guides
   - Document admin procedures
   - Create video tutorials

---

## Contact & Support

For questions or issues during implementation, refer to:
- Database schema: `supabase/FEATURE_ENHANCEMENTS.sql`
- Component examples: `frontend/src/pages/driver/FuelLogs.tsx`
- This guide: `FEATURE_IMPLEMENTATION_GUIDE.md`
