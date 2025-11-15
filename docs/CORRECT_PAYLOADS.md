# ✅ Correct Payload Templates

## **Use these exact payloads to avoid 400 errors**

---

## **1. Add Bus**

```json
{
  "name": "Bus 101",
  "number_plate": "ABC123",
  "model": "Scania Touring",
  "year": 2024,
  "seating_capacity": 40,
  "layout_rows": 10,
  "layout_columns": 4,
  "status": "active",
  "gps_device_id": "GPS001",
  "total_mileage": 0,
  "last_service_date": "2025-01-01",
  "next_service_date": "2025-06-01",
  "insurance_expiry": "2026-01-01",
  "license_expiry": "2026-01-01"
}
```

**Required Fields:**
- `name` (string)
- `seating_capacity` (number)
- `status` (enum: 'active', 'out_of_service', 'maintenance', 'retired')

**Optional Fields:** All others

---

## **2. Add Driver**

```json
{
  "full_name": "John Doe",
  "phone": "+263771234567",
  "email": "john@example.com",
  "id_number": "123456789",
  "license_number": "DL123456",
  "license_expiry": "2026-12-31",
  "date_of_birth": "1990-05-10",
  "address": "123 Main Street, Gaborone",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+263771234568",
  "status": "active",
  "hire_date": "2025-01-01",
  "notes": "Experienced driver"
}
```

**Required Fields:**
- `full_name` (string)
- `phone` (string)
- `status` (enum: 'active', 'inactive', 'on_leave', 'suspended')

**Optional Fields:** All others

**❌ DO NOT SEND:**
- `next_maintenance_date` (doesn't exist!)
- `first_name` and `last_name` separately (use `full_name`)

---

## **3. Add Route**

```json
{
  "origin": "Gaborone",
  "destination": "Francistown",
  "distance_km": 437.5,
  "duration_hours": 5.5,
  "price": 150.00,
  "route_type": "local",
  "description": "Main route via Palapye",
  "active": true
}
```

**Required Fields:**
- `origin` (string)
- `destination` (string)
- `duration_hours` (number)
- `price` (number)

**Optional Fields:**
- `route_code` (auto-generated if not provided)
- `distance_km`
- `route_type` (enum: 'local', 'cross_border')
- `description`
- `active` (boolean)

---

## **4. Schedule Trip**

```json
{
  "route_id": "uuid-here",
  "bus_id": "uuid-here",
  "driver_id": "uuid-here",
  "scheduled_departure": "2025-11-15T08:00:00",
  "scheduled_arrival": "2025-11-15T13:30:00",
  "fare": 150.00,
  "status": "scheduled"
}
```

**Required Fields:**
- `route_id` (uuid)
- `bus_id` (uuid)
- `scheduled_departure` (timestamp)

**Optional Fields:**
- `driver_id` (uuid)
- `scheduled_arrival` (timestamp)
- `fare` (number)
- `status` (enum: 'scheduled', 'in_progress', 'completed', 'cancelled', 'delayed')

---

## **5. Add Fuel Record**

```json
{
  "bus_id": "uuid-here",
  "date": "2025-11-12",
  "quantity_liters": 100.5,
  "cost_per_liter": 18.50,
  "total_cost": 1859.25,
  "station_name": "Engen Gaborone",
  "odometer_reading": 125000.5,
  "receipt_number": "REC123456",
  "notes": "Regular refuel"
}
```

**Required Fields:**
- `bus_id` (uuid)
- `date` (date)
- `quantity_liters` (number)
- `cost_per_liter` (number)
- `total_cost` (number)

**Optional Fields:** All others

---

## **❌ Common Mistakes to Avoid:**

### **1. Wrong Enum Case**
```json
// ❌ WRONG
"status": "ACTIVE"
"status": "Active"

// ✅ CORRECT
"status": "active"
```

### **2. Non-Existent Fields**
```json
// ❌ WRONG - These don't exist
"next_maintenance_date": "2025-12-01"  // Not in drivers table!
"registrationNumber": "ABC123"          // Should be registration_number

// ✅ CORRECT
"next_service_date": "2025-12-01"      // This exists in buses table
"registration_number": "ABC123"         // Correct snake_case
```

### **3. Wrong Data Types**
```json
// ❌ WRONG
"seating_capacity": "40"     // String
"price": "150.00"            // String

// ✅ CORRECT
"seating_capacity": 40       // Number
"price": 150.00              // Number
```

### **4. Missing Required Fields**
```json
// ❌ WRONG - Missing required fields
{
  "model": "Scania"
  // Missing: name, seating_capacity, status
}

// ✅ CORRECT
{
  "name": "Bus 1",
  "seating_capacity": 40,
  "status": "active",
  "model": "Scania"
}
```

---

## **🔍 How to Verify Your Payload:**

### **Check Table Columns:**
```sql
-- For any table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```

### **Check Enum Values:**
```sql
-- For any enum type
SELECT e.enumlabel as value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'your_enum_name'
ORDER BY e.enumsortorder;
```

---

## **✅ Validation Checklist:**

Before sending any payload:
- [ ] All enum values are lowercase
- [ ] All field names use snake_case
- [ ] All required fields are included
- [ ] No non-existent fields included
- [ ] Numeric fields are numbers, not strings
- [ ] Date/timestamp fields in correct format (ISO 8601)
- [ ] UUIDs are valid format

---

## **🚀 Use These Templates:**

Copy these exact templates and replace values with your data. This prevents:
- ✅ No more 400 Bad Request
- ✅ No more "field does not exist" errors
- ✅ No more enum validation errors
- ✅ No more NOT NULL constraint violations

---

**These templates match your current database schema exactly!** 🎉
