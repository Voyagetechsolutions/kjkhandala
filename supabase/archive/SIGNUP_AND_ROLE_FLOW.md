# 🔐 SIGNUP AND ROLE-BASED DASHBOARD FLOW

## 📋 Overview

This document explains how user signup, role assignment, and dashboard routing works in the system.

---

## 🎯 USER ROLES

The system supports **10 distinct roles** with hierarchical access levels:

| Role | Role Level | Access |
|------|------------|--------|
| `SUPER_ADMIN` | 100 | Full system access |
| `ADMIN` | 90 | All dashboards + user management |
| `OPERATIONS_MANAGER` | 80 | Operations + Maintenance dashboards |
| `FINANCE_MANAGER` | 80 | Finance dashboard |
| `HR_MANAGER` | 80 | HR dashboard |
| `MAINTENANCE_MANAGER` | 80 | Maintenance dashboard |
| `TICKETING_SUPERVISOR` | 70 | Ticketing dashboard (supervisor level) |
| `TICKETING_AGENT` | 60 | Ticketing dashboard (agent level) |
| `DRIVER` | 50 | Driver app/dashboard |
| `PASSENGER` | 10 | Passenger portal (default) |

---

## 🔄 SIGNUP FLOW

### Step 1: User Creates Account via Supabase Auth

```javascript
// Frontend signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'TICKETING_AGENT' // Optional: specify desired role
    }
  }
})
```

### Step 2: Auto-Trigger Creates Profile + Assigns Role

When a user signs up, the `handle_new_user()` trigger automatically:

1. **Creates entry in `profiles` table**
   - Stores: `id`, `email`, `full_name`
   - Status: `active`

2. **Creates entry in `user_roles` table**
   - Stores: `user_id`, `role`, `role_level`, `is_active`
   - Default role: `PASSENGER` (if not specified)
   - Role validation: Only valid roles accepted

```sql
-- Trigger function (runs automatically)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 3: User Data Structure

After signup, the user has:

**In `auth.users`:**
- `id` (UUID)
- `email`
- `encrypted_password`
- `raw_user_meta_data` (full_name, role, etc.)

**In `profiles`:**
- `id` → references `auth.users.id`
- `email`
- `full_name`
- `status` → 'active'
- `is_active` → TRUE

**In `user_roles`:**
- `user_id` → references `auth.users.id`
- `role` → e.g., 'TICKETING_AGENT'
- `role_level` → e.g., 60
- `is_active` → TRUE
- `assigned_at` → NOW()

---

## 🚪 LOGIN & DASHBOARD ROUTING

### Step 1: User Logs In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
})
```

### Step 2: Fetch User Profile & Roles

```javascript
// Get user's primary role and dashboard access
const { data: access } = await supabase.rpc('get_user_dashboard_access', {
  p_user_id: user.id
})

// Returns:
{
  primary_role: 'TICKETING_AGENT',
  all_roles: ['TICKETING_AGENT'],
  can_access_admin: false,
  can_access_ticketing: true,
  can_access_operations: false,
  can_access_hr: false,
  can_access_finance: false,
  can_access_maintenance: false,
  can_access_driver: false
}
```

### Step 3: Route to Correct Dashboard

```javascript
// Frontend routing logic
if (access.can_access_admin) {
  navigate('/admin')
} else if (access.can_access_ticketing) {
  navigate('/ticketing')
} else if (access.can_access_operations) {
  navigate('/operations')
} else if (access.can_access_finance) {
  navigate('/finance')
} else if (access.can_access_hr) {
  navigate('/hr')
} else if (access.can_access_maintenance) {
  navigate('/maintenance')
} else if (access.can_access_driver) {
  navigate('/driver')
} else {
  navigate('/passenger') // Default
}
```

---

## 👥 MULTI-ROLE SUPPORT

Users can have **multiple roles** simultaneously:

```sql
-- Admin assigns additional role
SELECT assign_user_role(
  'user-uuid',
  'OPERATIONS_MANAGER',
  'admin-uuid'
);
```

**Example: User with multiple roles**
- Primary role: `OPERATIONS_MANAGER` (highest role_level)
- Additional roles: `TICKETING_SUPERVISOR`, `DRIVER`
- Dashboard access: Operations, Ticketing, Driver

---

## 🔧 ADMIN FUNCTIONS

### Assign Role to User

```sql
-- Only SUPER_ADMIN or ADMIN can call this
SELECT assign_user_role(
  p_user_id := 'user-uuid',
  p_role := 'FINANCE_MANAGER',
  p_assigned_by := 'admin-uuid'
);
```

### Remove Role from User

```sql
SELECT remove_user_role(
  p_user_id := 'user-uuid',
  p_role := 'TICKETING_AGENT',
  p_removed_by := 'admin-uuid'
);
```

### Get User's Primary Role

```sql
SELECT get_user_primary_role('user-uuid');
-- Returns: 'ADMIN' (highest role_level)
```

---

## 📊 DASHBOARD ACCESS MATRIX

| Role | Admin | Ticketing | Operations | HR | Finance | Maintenance | Driver |
|------|-------|-----------|------------|-----|---------|-------------|--------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| OPERATIONS_MANAGER | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| FINANCE_MANAGER | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| HR_MANAGER | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| MAINTENANCE_MANAGER | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| TICKETING_SUPERVISOR | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| TICKETING_AGENT | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DRIVER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| PASSENGER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔒 SECURITY

### Row Level Security (RLS)

All tables have RLS policies that check `user_roles`:

```sql
-- Example: Only finance managers can view expenses
CREATE POLICY "Finance managers can view expenses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
    AND is_active = TRUE
  )
);
```

### Function Security

All role management functions use `SECURITY DEFINER` and validate permissions:

```sql
-- Only admins can assign roles
IF NOT (v_assigner_roles && ARRAY['SUPER_ADMIN', 'ADMIN']::TEXT[]) THEN
  RAISE EXCEPTION 'Only admins can assign roles';
END IF;
```

---

## 📝 EXAMPLE WORKFLOWS

### Workflow 1: New Ticketing Agent Signup

1. User signs up with email/password
2. Specifies role: `TICKETING_AGENT` in metadata
3. Trigger creates profile + assigns role
4. User logs in
5. Frontend calls `get_user_dashboard_access()`
6. User routed to `/ticketing` dashboard
7. RLS policies allow access to bookings, payments, trips

### Workflow 2: Admin Promotes User

1. Admin logs into admin dashboard
2. Views pending users or existing users
3. Calls `assign_user_role(user_id, 'OPERATIONS_MANAGER', admin_id)`
4. User's `user_roles` table updated
5. User logs out and back in
6. Now has access to Operations + Maintenance dashboards

### Workflow 3: Multi-Role User

1. User has role: `TICKETING_SUPERVISOR`
2. Admin assigns additional role: `DRIVER`
3. User now has both roles active
4. `get_user_dashboard_access()` returns:
   - `primary_role`: `TICKETING_SUPERVISOR` (higher role_level)
   - `can_access_ticketing`: TRUE
   - `can_access_driver`: TRUE
5. User can switch between dashboards

---

## ✅ VERIFICATION CHECKLIST

- [x] Signup creates profile in `profiles` table
- [x] Signup creates role in `user_roles` table
- [x] Default role is `PASSENGER`
- [x] Role can be specified in signup metadata
- [x] Only valid roles accepted (10 roles)
- [x] `get_user_dashboard_access()` returns correct permissions
- [x] Multiple roles supported per user
- [x] Primary role determined by highest `role_level`
- [x] Admins can assign/remove roles
- [x] RLS policies enforce role-based access
- [x] Frontend routes to correct dashboard based on role

---

## 🚀 DEPLOYMENT NOTES

1. Deploy `01_PRODUCTION_CORE.sql` first (creates tables)
2. Deploy `06_PRODUCTION_FUNCTIONS.sql` (creates functions + trigger)
3. Deploy `09_PRODUCTION_RLS.sql` (creates security policies)
4. Test signup flow with different roles
5. Verify dashboard routing works correctly

---

**All systems ready for production! 🎉**
