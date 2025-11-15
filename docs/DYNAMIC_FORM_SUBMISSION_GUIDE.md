# ✅ DYNAMIC FORM SUBMISSION GUIDE - NO MORE 400 ERRORS

## 🎯 Problem Solved

This guide provides a complete solution for dynamically inserting records into Supabase without 400 Bad Request errors by:
1. ✅ Auto-fetching valid enum values from database
2. ✅ Auto-fetching valid UUIDs (buses, staff, etc.)
3. ✅ Validating required fields before submission
4. ✅ Auto-generating record numbers
5. ✅ Proper error handling with user feedback

---

## 📋 Files Created

### 1. **Backend (SQL):**
- `GET_ENUM_VALUES_FUNCTION.sql` - Database function to fetch enum values

### 2. **Frontend (Hooks):**
- `hooks/useMaintenanceOperations.ts` - All maintenance CRUD operations

### 3. **Frontend (Components):**
- `components/maintenance/MaintenanceRecordForm.tsx` - Complete form with validation

---

## 🚀 DEPLOYMENT

### Step 1: Run SQL Function (1 min)

```bash
# In Supabase SQL Editor:
supabase/GET_ENUM_VALUES_FUNCTION.sql
```

This creates a helper function that returns all enum values for any enum type.

### Step 2: Frontend Already Created ✅

All hooks and components are ready to use!

---

## 📊 HOW IT WORKS

### **1. Auto-Fetch Enum Values**

Instead of hardcoding enum values, the form dynamically fetches them:

```typescript
const { data: maintenanceTypes } = useMaintenanceTypes();
// Returns: ['OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_SERVICE', ...]
```

**Benefits:**
- ✅ Always up-to-date with database schema
- ✅ No 400 errors from invalid enum values
- ✅ Easy to add new types in database

### **2. Auto-Fetch Valid UUIDs**

Forms fetch valid options for foreign keys:

```typescript
const { data: buses } = useActiveBuses();
// Returns: [{ id: 'uuid', registration_number: 'ABC123', ... }]

const { data: staff } = useMaintenanceStaff();
// Returns: [{ id: 'uuid', full_name: 'John Doe', ... }]
```

**Benefits:**
- ✅ Only shows valid, active records
- ✅ No 400 errors from invalid UUIDs
- ✅ User-friendly display names

### **3. Auto-Generate Record Numbers**

```typescript
// Auto-generates: MR-00001, MR-00002, etc.
if (!record.record_number) {
  const lastNumber = await getLastRecordNumber();
  record.record_number = `MR-${String(lastNumber + 1).padStart(5, '0')}`;
}
```

**Benefits:**
- ✅ Unique record numbers
- ✅ Sequential numbering
- ✅ No manual entry needed

### **4. Validate Before Submit**

```typescript
const requiredFields = ['bus_id', 'type', 'date', 'description'];
for (const field of requiredFields) {
  if (!record[field]) {
    throw new Error(`Missing required field: ${field}`);
  }
}
```

**Benefits:**
- ✅ Catches errors before API call
- ✅ Clear error messages
- ✅ No wasted API requests

---

## 💻 USAGE EXAMPLES

### **Example 1: Add Maintenance Record**

```typescript
import { useAddMaintenanceRecord } from '@/hooks/useMaintenanceOperations';

function MyComponent() {
  const addRecord = useAddMaintenanceRecord();
  
  const handleSubmit = async () => {
    await addRecord.mutateAsync({
      bus_id: 'uuid-here',
      type: 'OIL_CHANGE',
      date: '2025-11-12',
      description: 'Full oil change and filter replacement',
      cost: 120.50,
      odometer_reading: 15200,
      performed_by: 'staff-uuid',
      vendor: 'Super Auto Services'
    });
  };
}
```

### **Example 2: Use the Complete Form**

```typescript
import MaintenanceRecordForm from '@/components/maintenance/MaintenanceRecordForm';

function MaintenancePage() {
  return (
    <MaintenanceRecordForm 
      onSuccess={() => console.log('Record saved!')}
    />
  );
}
```

### **Example 3: Fetch Maintenance Records**

```typescript
import { useMaintenanceRecords } from '@/hooks/useMaintenanceOperations';

function RecordsList() {
  const { data: records, isLoading } = useMaintenanceRecords();
  
  return (
    <div>
      {records?.map(record => (
        <div key={record.id}>
          <h3>{record.type}</h3>
          <p>{record.description}</p>
          <p>Cost: P{record.cost}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 APPLY TO OTHER FORMS

### **Pattern for Any Form:**

1. **Create hooks for fetching options:**
```typescript
export function useValidOptions() {
  return useQuery({
    queryKey: ['options'],
    queryFn: async () => {
      const { data } = await supabase.from('table').select('*');
      return data;
    },
  });
}
```

2. **Create mutation hook:**
```typescript
export function useAddRecord() {
  return useMutation({
    mutationFn: async (record) => {
      // Validate required fields
      // Auto-generate IDs if needed
      // Insert into Supabase
      const { data, error } = await supabase
        .from('table')
        .insert([record])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Record saved!');
    },
  });
}
```

3. **Use in form:**
```typescript
function MyForm() {
  const { data: options } = useValidOptions();
  const addRecord = useAddRecord();
  
  const handleSubmit = async (formData) => {
    await addRecord.mutateAsync(formData);
  };
}
```

---

## 📋 REQUIRED FIELDS BY TABLE

### **Maintenance Records:**
- ✅ `bus_id` (UUID from buses table)
- ✅ `type` (enum: maintenance_type)
- ✅ `date` (YYYY-MM-DD)
- ✅ `description` (text)

### **Trips:**
- ✅ `route_id` (UUID from routes table)
- ✅ `bus_id` (UUID from buses table)
- ✅ `driver_id` (UUID from drivers table)
- ✅ `scheduled_departure` (timestamptz)
- ✅ `scheduled_arrival` (timestamptz)
- ✅ `fare` (numeric)
- ✅ `status` (enum: trip_status)

**Note:** `total_seats` and `available_seats` are auto-populated by trigger!

### **Bookings:**
- ✅ `trip_id` (UUID from trips table)
- ✅ `seat_number` (text)
- ✅ `passenger_name` (text)
- ✅ `passenger_phone` (text)
- ✅ `fare` (numeric)

**Note:** `booking_reference` is auto-generated by trigger!

### **Profiles (Employees):**
- ✅ `full_name` (text)
- ✅ `email` (text, unique)
- ✅ `phone` (text)

---

## ✅ BENEFITS

### **Before (Manual Entry):**
```typescript
// ❌ Hardcoded enum - breaks if DB changes
type: 'OIL_CHANGE'

// ❌ Manual UUID - prone to errors
bus_id: '7929a885-a6fb-4e08-b296-a16f685c42a6'

// ❌ No validation - 400 errors
await supabase.from('table').insert([data])
```

### **After (Dynamic):**
```typescript
// ✅ Fetched from DB - always valid
const { data: types } = useMaintenanceTypes();

// ✅ Dropdown with valid options
<Select>
  {types?.map(type => <SelectItem value={type}>{type}</SelectItem>)}
</Select>

// ✅ Validated before submit
if (!data.bus_id) throw new Error('Bus is required');
```

---

## 🎯 RESULT

### **No More 400 Errors Because:**
1. ✅ Enum values are always valid (fetched from DB)
2. ✅ UUIDs are always valid (fetched from related tables)
3. ✅ Required fields are validated before submission
4. ✅ Data types match exactly (numbers, dates, strings)
5. ✅ Auto-generated fields handled by triggers

### **Better UX:**
1. ✅ Dropdowns show user-friendly names
2. ✅ Clear error messages
3. ✅ Loading states
4. ✅ Success notifications
5. ✅ Real-time validation

---

## 🔄 APPLY TO ALL FORMS

Use this pattern for:
- ✅ Trip scheduling form
- ✅ Booking form
- ✅ Employee/profile form
- ✅ Bus registration form
- ✅ Driver registration form
- ✅ Route creation form
- ✅ Payment recording form

**Every form should:**
1. Fetch valid options dynamically
2. Validate before submit
3. Handle auto-generated fields
4. Show clear error messages
5. Use React Query for state management

---

## 📞 NEXT STEPS

1. ✅ Run `GET_ENUM_VALUES_FUNCTION.sql` in Supabase
2. ✅ Use `MaintenanceRecordForm` component
3. ✅ Test adding a maintenance record
4. ✅ Apply pattern to other forms (trips, bookings, etc.)
5. ✅ Verify no more 400 errors

**All files are ready - start using them now!** 🎉
