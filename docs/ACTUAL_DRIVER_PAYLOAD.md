# ✅ Correct Driver Payload (Based on Actual Supabase Table)

## **Required Fields (NOT NULL):**

From your Supabase table, only these are required:
- `phone` (text)
- `license_expiry` (date)

*Note: `id` is auto-generated*

---

## **✅ Minimal Valid Payload:**

```json
{
  "phone": "+263771234567",
  "license_expiry": "2026-12-31"
}
```

This is the **absolute minimum** to save a driver!

---

## **✅ Recommended Payload (with useful optional fields):**

```json
{
  "phone": "+263771234567",
  "license_expiry": "2026-12-31",
  "full_name": "John Doe",
  "email": "john@example.com",
  "id_number": "123456789",
  "license_number": "DL123456",
  "date_of_birth": "1990-05-10",
  "address": "123 Main Street",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+263771234568",
  "status": "active",
  "hire_date": "2025-01-01",
  "notes": "Experienced driver"
}
```

---

## **⚠️ Important Notes:**

### **1. Status Field:**
- Type: `driver_status` enum
- Values: `'active'`, `'inactive'`, `'on_leave'`, `'suspended'`
- **This is OPTIONAL** - not required!
- If not provided, it might default to NULL or a default value

### **2. Name Fields:**
- `full_name` - Use this (it exists!)
- ~~`first_name` and `last_name`~~ - These exist but are optional

### **3. Fields That Don't Exist:**
- ❌ `next_maintenance_date` - **NOT in drivers table!**
- ❌ `driver_status` as a field name - it's just `status` with type `driver_status`

---

## **🔍 DriverForm.tsx Should Send:**

```typescript
const payload = {
  phone: formData.phone,                                    // REQUIRED
  license_expiry: formData.license_expiry,                  // REQUIRED
  full_name: formData.full_name,                            // Optional
  email: formData.email,                                    // Optional
  id_number: formData.id_number,                            // Optional
  license_number: formData.license_number,                  // Optional
  date_of_birth: formData.date_of_birth,                    // Optional
  address: formData.address,                                // Optional
  emergency_contact_name: formData.emergency_contact_name,  // Optional
  emergency_contact_phone: formData.emergency_contact_phone,// Optional
  status: formData.status?.toLowerCase() || 'active',       // Optional, lowercase
  hire_date: formData.hire_date,                            // Optional
  notes: formData.notes                                     // Optional
};
```

---

## **✅ Updated DriverForm Check:**

Your current DriverForm.tsx is already correct! It's sending:
- ✅ `full_name` (exists)
- ✅ `phone` (required)
- ✅ `email` (exists)
- ✅ `id_number` (exists)
- ✅ `license_number` (exists)
- ✅ `license_expiry` (required)
- ✅ `date_of_birth` (exists)
- ✅ `address` (exists)
- ✅ `emergency_contact_name` (exists)
- ✅ `emergency_contact_phone` (exists)
- ✅ `status` (exists, lowercase enum)
- ✅ `hire_date` (exists)
- ✅ `notes` (exists)
- ✅ **NO `next_maintenance_date`!**

---

## **🔍 If Still Getting "next_maintenance_date" Error:**

The error is coming from:
1. ❌ A database trigger on `drivers` table
2. ❌ A view that references drivers and expects this field
3. ❌ A function that runs on INSERT/UPDATE

**Solution:** Run this in Supabase SQL Editor:

```sql
-- Find all triggers on drivers table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'drivers';

-- If any found, drop them:
-- DROP TRIGGER trigger_name ON drivers;
```

---

## **🎯 Summary:**

**Your form is CORRECT!** The issue is:
- ✅ Form sends correct fields
- ✅ All field names match table
- ✅ Enum values are lowercase
- ❌ A database trigger or view is trying to add `next_maintenance_date`

**Next step:** Run CHECK_TRIGGERS.sql to find and remove the problematic trigger!

---

**Once trigger is removed, driver inserts will work perfectly!** ✅
