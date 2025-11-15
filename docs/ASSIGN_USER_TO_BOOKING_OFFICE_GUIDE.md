# 🎫 ASSIGN USER TO BOOKING OFFICE - COMPLETE GUIDE

## User ID
```
7929a885-a6fb-4e08-b296-a16f685c42a6
```

---

## Option 1: Quick Assignment (Recommended)

Run this SQL in Supabase to assign the user to a booking office:

```sql
-- Step 1: Check if user exists
SELECT id, email, full_name 
FROM auth.users 
WHERE id = '7929a885-a6fb-4e08-b296-a16f685c42a6';

-- Step 2: Assign role as booking office staff
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES (
  '7929a885-a6fb-4e08-b296-a16f685c42a6',
  'booking_office_staff',  -- or 'booking_office_manager'
  3,                       -- role level (adjust as needed)
  true
)
ON CONFLICT (user_id, role) DO UPDATE
SET is_active = true, role_level = 3;

-- Step 3: Create or assign to booking office
-- Option A: Create new office with this user as manager
INSERT INTO booking_offices (
  name,
  location,
  operating_hours,
  contact_number,
  manager_id,
  status
) VALUES (
  'Main Booking Office',
  'City Center',
  '08:00 - 18:00',
  '+1234567890',
  '7929a885-a6fb-4e08-b296-a16f685c42a6',
  'active'
)
RETURNING id, name, location;

-- OR Option B: Assign to existing office
-- UPDATE booking_offices
-- SET manager_id = '7929a885-a6fb-4e08-b296-a16f685c42a6'
-- WHERE name = 'Your Office Name';

-- Step 4: Verify assignment
SELECT 
  u.id,
  u.email,
  ur.role,
  bo.name as office_name,
  bo.location,
  bo.status
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN booking_offices bo ON u.id = bo.manager_id
WHERE u.id = '7929a885-a6fb-4e08-b296-a16f685c42a6';
```

---

## Option 2: Using User-Office Junction Table

If you want multiple users per office (not just manager):

```sql
-- Step 1: Create user_offices table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES booking_offices(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff', -- 'manager', 'staff', 'cashier'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, office_id)
);

ALTER TABLE public.user_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" 
ON public.user_offices 
FOR ALL 
TO authenticated 
USING (true);

-- Step 2: Assign user to office
INSERT INTO user_offices (user_id, office_id, role)
VALUES (
  '7929a885-a6fb-4e08-b296-a16f685c42a6',
  (SELECT id FROM booking_offices WHERE name = 'Main Booking Office' LIMIT 1),
  'manager'
);

-- Step 3: Verify
SELECT 
  uo.id,
  u.email,
  bo.name as office_name,
  bo.location,
  uo.role,
  uo.assigned_at
FROM user_offices uo
JOIN auth.users u ON uo.user_id = u.id
JOIN booking_offices bo ON uo.office_id = bo.id
WHERE uo.user_id = '7929a885-a6fb-4e08-b296-a16f685c42a6';
```

---

## Available Roles

Common roles for booking office users:

1. **`booking_office_manager`** - Full access to office operations
2. **`booking_office_staff`** - Can create bookings, view reports
3. **`booking_office_cashier`** - Handle payments, refunds
4. **`booking_office_admin`** - Administrative tasks

---

## Database Schema

### `booking_offices` Table:
```sql
- id (UUID)
- name (TEXT)
- location (TEXT)
- operating_hours (TEXT)
- contact_number (TEXT)
- manager_id (UUID) → references auth.users
- status (TEXT) - 'active', 'inactive'
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### `user_roles` Table:
```sql
- user_id (UUID) → references auth.users
- role (TEXT)
- role_level (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

### `user_offices` Table (Optional):
```sql
- id (UUID)
- user_id (UUID) → references auth.users
- office_id (UUID) → references booking_offices
- role (TEXT)
- assigned_at (TIMESTAMPTZ)
```

---

## Frontend Integration

After assigning the user, update your frontend to check their role:

```tsx
// Check if user has booking office role
const { data: userRoles } = useQuery({
  queryKey: ['user-roles', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },
});

const isBookingOfficeStaff = userRoles?.some(
  r => r.role === 'booking_office_staff' || r.role === 'booking_office_manager'
);

// Get user's assigned office
const { data: userOffice } = useQuery({
  queryKey: ['user-office', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('booking_offices')
      .select('*')
      .eq('manager_id', userId)
      .single();
    if (error) throw error;
    return data;
  },
});
```

---

## Testing

### 1. Verify User Assignment:
```sql
SELECT 
  u.id,
  u.email,
  p.full_name,
  ur.role,
  ur.role_level,
  bo.name as office_name,
  bo.location
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN booking_offices bo ON u.id = bo.manager_id
WHERE u.id = '7929a885-a6fb-4e08-b296-a16f685c42a6';
```

### 2. Test Login:
- Log in with this user
- Navigate to booking office dashboard
- Verify access to booking features

### 3. Test Permissions:
- Create a booking
- View booking reports
- Process payments (if cashier role)

---

## Troubleshooting

### User not showing in office:
1. Check if user exists: `SELECT * FROM auth.users WHERE id = '...'`
2. Check if role assigned: `SELECT * FROM user_roles WHERE user_id = '...'`
3. Check if office exists: `SELECT * FROM booking_offices`

### Access denied errors:
1. Verify RLS policies are enabled
2. Check user role permissions
3. Ensure user is authenticated

### Office not appearing in frontend:
1. Check query filters
2. Verify office status is 'active'
3. Check if manager_id is set correctly

---

## Quick Commands

### List all booking offices:
```sql
SELECT id, name, location, status FROM booking_offices;
```

### List all users with booking office roles:
```sql
SELECT 
  u.email,
  ur.role,
  bo.name as office_name
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN booking_offices bo ON u.id = bo.manager_id
WHERE ur.role LIKE '%booking_office%';
```

### Remove user from office:
```sql
UPDATE booking_offices
SET manager_id = NULL
WHERE manager_id = '7929a885-a6fb-4e08-b296-a16f685c42a6';

-- Or delete role
DELETE FROM user_roles
WHERE user_id = '7929a885-a6fb-4e08-b296-a16f685c42a6'
AND role LIKE '%booking_office%';
```

---

## Status: READY TO DEPLOY ✅

Run the SQL script `ASSIGN_USER_TO_OFFICE.sql` in Supabase to complete the assignment!
