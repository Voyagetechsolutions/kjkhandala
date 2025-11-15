# 🚀 Production-Ready Setup Guide

## Overview

This guide sets up a **complete production-ready authentication system** with:

✅ **Email Verification** - Users verify their email before accessing the system  
✅ **Role-Based Access Control** - Different dashboards for different roles  
✅ **Real-Time CRUD** - Instant updates when creating buses, routes, schedules, tickets  
✅ **Secure RLS Policies** - Database-level security  
✅ **Auto-Generated References** - Booking references, seat management  
✅ **Audit Logging** - Track all important actions  

---

## 📋 Step-by-Step Setup

### **STEP 1: Run Database Scripts** (In Order!)

Go to Supabase SQL Editor: https://miejkfzzbxirgpdmffsh.supabase.co

#### 1.1 Create Tables
```sql
-- Copy and run: supabase/01_complete_schema.sql
```
**Creates:**
- profiles, user_roles tables
- routes, buses, drivers, trips tables
- bookings, notifications tables
- All indexes and constraints

#### 1.2 Set Up RLS Policies
```sql
-- Copy and run: supabase/02_rls_policies.sql
```
**Creates:**
- Role-based access policies
- SUPER_ADMIN, ADMIN can manage everything
- OPERATIONS_MANAGER can manage trips/routes/buses
- TICKETING_AGENT can manage bookings
- PASSENGER can view their own bookings

#### 1.3 Create Triggers & Functions
```sql
-- Copy and run: supabase/03_triggers_functions.sql
```
**Creates:**
- Auto-create profile on signup
- Auto-assign PASSENGER role
- Auto-generate booking references
- Auto-update available seats
- Send notifications on booking changes
- Update timestamps automatically

#### 1.4 Add Helper Functions
```sql
-- Copy and run: supabase/04_helper_functions.sql
```
**Creates:**
- `has_role()` - Check if user has a role
- `get_user_roles()` - Get all user roles
- `search_trips()` - Search available trips
- `cancel_booking()` - Cancel with refund logic
- Dashboard stats functions

---

### **STEP 2: Configure Supabase Auth**

#### 2.1 Enable Email Confirmation
1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Find "**Enable email confirmations**"
4. **Toggle it ON** ✅
5. Click **Save**

#### 2.2 Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize **Confirm signup** template:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

3. Set **Confirmation URL** to:
```
{{ .SiteURL }}/auth/callback
```

#### 2.3 Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add **Redirect URLs**:
```
http://localhost:8080/auth/callback
https://yourdomain.com/auth/callback
```

---

### **STEP 3: Set Up Frontend Environment**

Update `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://miejkfzzbxirgpdmffsh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

---

## 🔐 Authentication Flow

### **New User Registration**

```
1. User fills signup form
   ↓
2. Supabase creates auth.users record
   ↓
3. Trigger creates profiles record
   ↓
4. Trigger assigns PASSENGER role
   ↓
5. Supabase sends verification email
   ↓
6. User clicks link in email
   ↓
7. Email verified → User can login
   ↓
8. System checks role → Opens appropriate dashboard
```

### **Existing User Login**

```
1. User enters email/password
   ↓
2. Supabase checks if email is verified
   ↓
3. If verified → Check user roles
   ↓
4. Redirect to role-based dashboard:
   - SUPER_ADMIN → Full Admin Dashboard
   - OPERATIONS_MANAGER → Operations Dashboard
   - TICKETING_AGENT → Ticketing Dashboard
   - PASSENGER → Booking/Tickets Dashboard
```

---

## 👥 User Roles & Permissions

### **Role Hierarchy**

| Role | Level | Permissions |
|------|-------|-------------|
| **SUPER_ADMIN** | 100 | Full system access |
| **ADMIN** | 90 | Manage users, view all data |
| **OPERATIONS_MANAGER** | 80 | Manage trips, routes, buses, drivers |
| **FINANCE_MANAGER** | 70 | View financial reports, manage payments |
| **HR_MANAGER** | 70 | Manage drivers, staff |
| **MAINTENANCE_MANAGER** | 60 | Manage bus maintenance |
| **TICKETING_AGENT** | 50 | Create/manage bookings |
| **DRIVER** | 30 | View assigned trips |
| **PASSENGER** | 10 | Book tickets, view own bookings |

### **Assigning Roles**

```sql
-- Assign role to user
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES ('user-uuid-here', 'OPERATIONS_MANAGER', 80, true);

-- User can have multiple roles
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES 
  ('user-uuid-here', 'OPERATIONS_MANAGER', 80, true),
  ('user-uuid-here', 'TICKETING_AGENT', 50, true);
```

---

## 🎯 Real-Time CRUD Operations

### **How It Works**

When you create/update data, it appears instantly in lists:

```typescript
// Create a bus
const { data, error } = await supabase
  .from('buses')
  .insert({
    registration_number: 'ABC123',
    model: 'Mercedes Sprinter',
    capacity: 50,
    status: 'ACTIVE'
  })
  .select()
  .single();

// Instantly appears in bus list (via Supabase Realtime)
```

### **Enable Realtime**

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - ✅ buses
   - ✅ routes
   - ✅ trips
   - ✅ bookings
   - ✅ drivers

### **Subscribe to Changes (Frontend)**

```typescript
// Subscribe to bus changes
const subscription = supabase
  .channel('buses')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'buses' },
    (payload) => {
      console.log('Change received!', payload);
      // Update your list automatically
    }
  )
  .subscribe();
```

---

## 🧪 Testing the System

### **Test 1: New User Signup**

1. Go to http://localhost:8080
2. Click **Sign Up**
3. Enter:
   - Email: test@example.com
   - Password: Test123!@#
   - Full Name: Test User
   - Phone: +267 1234 5678
4. Click **Sign Up**
5. **Expected:** "Please check your email to verify your account"
6. Check email inbox
7. Click verification link
8. **Expected:** Redirected to login
9. Login with same credentials
10. **Expected:** Dashboard opens (Passenger dashboard for new users)

### **Test 2: Create a Bus**

1. Login as OPERATIONS_MANAGER
2. Go to **Operations** → **Buses**
3. Click **Add Bus**
4. Enter:
   - Registration: ABC123
   - Model: Mercedes Sprinter
   - Capacity: 50
5. Click **Save**
6. **Expected:** Bus appears in list immediately

### **Test 3: Create a Route**

1. Go to **Operations** → **Routes**
2. Click **Add Route**
3. Enter:
   - Name: Gaborone - Francistown
   - Origin: Gaborone
   - Destination: Francistown
   - Distance: 437 km
   - Fare: 150 BWP
4. Click **Save**
5. **Expected:** Route appears in list immediately

### **Test 4: Create a Trip/Schedule**

1. Go to **Operations** → **Trips**
2. Click **Add Trip**
3. Select:
   - Route: Gaborone - Francistown
   - Bus: ABC123
   - Driver: (select from list)
   - Departure: Tomorrow 08:00
   - Fare: 150 BWP
4. Click **Save**
5. **Expected:** Trip appears in schedule immediately

### **Test 5: Book a Ticket**

1. Login as PASSENGER
2. Go to **Book Ticket**
3. Search:
   - From: Gaborone
   - To: Francistown
   - Date: Tomorrow
4. Click **Search**
5. Select trip
6. Choose seat
7. Click **Book**
8. **Expected:** Booking created, reference generated (e.g., BK20251111-1234)

---

## 🔒 Security Best Practices

### **Environment Variables**

Never commit `.env` files! Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### **API Keys**

- ✅ Use `SUPABASE_ANON_KEY` in frontend (public)
- ✅ Use `SUPABASE_SERVICE_ROLE` in backend only (private)
- ❌ Never expose service role key in frontend

### **RLS Policies**

All tables have RLS enabled. Users can only:
- View data they're authorized to see
- Modify data based on their role
- Cannot bypass policies via API

### **Password Requirements**

Enforce in Supabase:
1. Go to **Authentication** → **Settings**
2. Set **Minimum password length**: 8
3. Enable **Password strength**: Medium or Strong

---

## 📊 Monitoring & Logs

### **View Audit Logs**

```sql
-- View recent actions
SELECT 
  al.*,
  p.full_name as user_name
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
ORDER BY al.created_at DESC
LIMIT 100;
```

### **View User Activity**

```sql
-- Active users today
SELECT 
  p.full_name,
  p.email,
  p.last_login,
  array_agg(ur.role) as roles
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.last_login::date = CURRENT_DATE
GROUP BY p.id, p.full_name, p.email, p.last_login;
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Run all 4 SQL scripts in Supabase
- [ ] Enable email confirmation
- [ ] Configure email templates
- [ ] Set up redirect URLs
- [ ] Enable realtime replication
- [ ] Test signup/login flow
- [ ] Test role-based access
- [ ] Test CRUD operations
- [ ] Set strong password requirements
- [ ] Configure SMTP for production emails
- [ ] Set up custom domain
- [ ] Enable audit logging
- [ ] Test on mobile devices
- [ ] Load test with multiple users

---

## 🎉 You're Ready!

Your system now has:

✅ **Production-ready authentication** with email verification  
✅ **Role-based access control** with 9 different roles  
✅ **Real-time updates** for all CRUD operations  
✅ **Secure database** with RLS policies  
✅ **Auto-generated references** and seat management  
✅ **Notification system** for user updates  
✅ **Audit logging** for compliance  

**Start by running the 4 SQL scripts, then test the flows above!** 🚀
