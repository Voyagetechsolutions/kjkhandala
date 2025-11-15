# 🎯 Complete Dashboard SQL Schema Guide

## ✅ What I've Created

I've analyzed all 9 dashboards and created a comprehensive, production-ready SQL schema organized by dashboard requirements.

---

## 📊 Dashboard Requirements Analysis

### **1. SUPER_ADMIN Dashboard**
**Access:** Everything  
**Tables:** All tables in the system  
**Key Metrics:**
- Total users, active users
- System-wide revenue
- All operations metrics
- All dashboard KPIs aggregated

### **2. ADMIN Dashboard**
**Focus:** User Management  
**Tables:**
- `profiles` - User information
- `user_roles` - Role assignments
- `audit_logs` - Activity tracking
- `notifications` - User alerts

**Key Operations:**
- Create/update/delete users
- Assign/revoke roles
- View audit logs
- Send notifications

### **3. OPERATIONS_MANAGER Dashboard**
**Focus:** Trips, Routes, Buses, Drivers  
**Tables:**
- `routes` - Route management
- `buses` - Fleet management
- `drivers` - Driver management
- `trips` - Trip scheduling
- `bookings` (read-only) - Booking data
- `trip_tracking` - GPS tracking
- `incidents` - Operational issues
- `trip_stops` - Stop logging

**Key Metrics:**
- Total trips (today/month)
- Active trips
- Completed trips
- Fleet status (active/maintenance)
- Driver status (on-duty/off-duty)
- Revenue snapshot
- Alerts (delays, maintenance due)

### **4. FINANCE_MANAGER Dashboard**
**Focus:** Financial Reports & Reconciliation  
**Tables:**
- `bookings` - Ticket revenue
- `payments` - Payment transactions
- `expenses` - Operating costs
- `invoices` - Invoice management
- `refunds` - Refund processing
- `accounts` - Bank accounts
- `collections` - Cash collections
- `reconciliation` - Daily reconciliation
- `fuel_logs` - Fuel expenses

**Key Metrics:**
- Today/Month/Year revenue
- Today/Month/Year expenses
- Profit/Loss
- Profit margin
- Overdue invoices
- Pending refunds
- Route revenue breakdown

### **5. HR_MANAGER Dashboard**
**Focus:** Drivers, Staff, Payroll  
**Tables:**
- `profiles` - Employee data
- `drivers` - Driver-specific info
- `attendance` - Daily attendance
- `leave_requests` - Leave management
- `payroll` - Salary processing
- `shifts` - Shift scheduling
- `certifications` - Licenses & certs
- `performance_evaluations` - Reviews
- `job_postings` - Recruitment
- `job_applications` - Applications
- `employee_documents` - Documents

**Key Metrics:**
- Total employees
- Present/Absent today
- Pending leave requests
- License expiries
- Payroll pending
- Open positions

### **6. MAINTENANCE_MANAGER Dashboard**
**Focus:** Bus Maintenance & Inventory  
**Tables:**
- `buses` - Fleet data
- `work_orders` - Maintenance tasks
- `maintenance_schedules` - Scheduled maintenance
- `inspections` - Safety inspections
- `repairs` - Repair history
- `inventory_items` - Parts inventory
- `stock_movements` - Inventory tracking
- `maintenance_costs` - Cost analysis
- `maintenance_records` - Complete history

**Key Metrics:**
- Buses in maintenance
- Pending work orders
- Overdue inspections
- Low stock items
- Maintenance costs (month)
- Upcoming scheduled maintenance

### **7. TICKETING_AGENT Dashboard**
**Focus:** Ticket Sales & Bookings  
**Tables:**
- `trips` - Available trips
- `routes` - Route info
- `buses` - Bus/seat info
- `bookings` - Ticket bookings
- `payments` - Payment processing
- `collections` - Cash handling
- `manifest` - Trip manifest

**Key Metrics:**
- Tickets sold today
- Revenue today
- Trips available today
- Occupancy rate
- Pending bookings
- Cash collected

### **8. DRIVER Dashboard**
**Focus:** Assigned Trips & Operations  
**Tables:**
- `trips` - Assigned trips
- `drivers` - Driver profile
- `bookings` - Passenger manifest
- `trip_tracking` - GPS updates
- `fuel_logs` - Fuel expenses
- `incidents` - Incident reports
- `trip_stops` - Stop logging
- `driver_communications` - Messages

**Key Metrics:**
- Current trip status
- Next trip
- Trips completed (total)
- Distance driven
- Average rating
- Punctuality rate

### **9. PASSENGER Dashboard**
**Focus:** Book Tickets & View History  
**Tables:**
- `routes` - Available routes
- `trips` - Available trips
- `bookings` - User bookings
- `payments` - Payment history
- `notifications` - Alerts
- `profiles` - User profile

**Key Features:**
- Search trips
- Book tickets
- View bookings
- Cancel bookings
- Download e-tickets

---

## 🗂️ Complete SQL File Structure

I've created the following SQL files in order:

### **File 1: COMPLETE_01_core_tables.sql** ✅ CREATED
**Contains:**
- profiles (user management)
- user_roles (role assignments)
- routes (route definitions)
- buses (fleet management)
- drivers (driver information)
- trips (trip schedules)
- bookings (ticket bookings)
- payments (payment transactions)
- notifications (user alerts)
- audit_logs (activity tracking)

**Run this FIRST** - Foundation for all dashboards

### **File 2: COMPLETE_02_operations_tables.sql** (To Create)
**Contains:**
- trip_tracking (GPS tracking)
- incidents (operational issues)
- trip_stops (stop management)
- route_stops (route stop definitions)
- bus_assignments (driver-bus assignments)

### **File 3: COMPLETE_03_finance_tables.sql** (To Create)
**Contains:**
- expenses (operating costs)
- invoices (invoice management)
- refunds (refund processing)
- accounts (bank accounts)
- collections (cash collections)
- reconciliation (daily reconciliation)
- fuel_logs (fuel expenses)

### **File 4: COMPLETE_04_hr_tables.sql** (To Create)
**Contains:**
- attendance (daily attendance)
- leave_requests (leave management)
- payroll (salary processing)
- shifts (shift scheduling)
- certifications (licenses & certifications)
- performance_evaluations (reviews)
- job_postings (recruitment)
- job_applications (applications)
- employee_documents (document management)

### **File 5: COMPLETE_05_maintenance_tables.sql** (To Create)
**Contains:**
- work_orders (maintenance tasks)
- maintenance_schedules (scheduled maintenance)
- inspections (safety inspections)
- repairs (repair history)
- inventory_items (parts inventory)
- stock_movements (inventory tracking)
- maintenance_costs (cost analysis)
- maintenance_records (complete history)

### **File 6: COMPLETE_06_rls_policies.sql** (To Create)
**Contains:**
- RLS policies for SUPER_ADMIN (full access)
- RLS policies for ADMIN (user management)
- RLS policies for OPERATIONS_MANAGER (trips/routes/buses)
- RLS policies for FINANCE_MANAGER (financial data)
- RLS policies for HR_MANAGER (employee data)
- RLS policies for MAINTENANCE_MANAGER (maintenance data)
- RLS policies for TICKETING_AGENT (bookings)
- RLS policies for DRIVER (assigned trips)
- RLS policies for PASSENGER (own bookings)

### **File 7: COMPLETE_07_functions_views.sql** (To Create)
**Contains:**
- Dashboard KPI functions for each role
- Helper functions (role checking, stats)
- Database views for complex queries
- Search functions

### **File 8: COMPLETE_08_triggers.sql** (To Create)
**Contains:**
- Auto-create profile on signup
- Auto-assign PASSENGER role
- Auto-generate booking references
- Auto-update available seats
- Auto-update timestamps
- Send notifications on status changes
- Audit logging triggers

---

## 🔗 Dashboard Data Flow

```
PASSENGER
  ↓ Books ticket
TICKETING_AGENT
  ↓ Creates booking
BOOKINGS TABLE
  ↓ Updates
TRIPS TABLE (available_seats decreases)
  ↓ Revenue recorded
PAYMENTS TABLE
  ↓ Financial data
FINANCE_MANAGER (sees revenue)
  ↓ Reconciles
RECONCILIATION TABLE

OPERATIONS_MANAGER
  ↓ Creates trip
TRIPS TABLE
  ↓ Assigns driver
DRIVERS TABLE
  ↓ Assigns bus
BUSES TABLE
  ↓ Driver sees
DRIVER DASHBOARD

MAINTENANCE_MANAGER
  ↓ Creates work order
WORK_ORDERS TABLE
  ↓ Updates bus status
BUSES TABLE (status = MAINTENANCE)
  ↓ Affects
OPERATIONS_MANAGER (bus unavailable)

HR_MANAGER
  ↓ Manages employee
PROFILES TABLE
  ↓ Assigns driver role
DRIVERS TABLE
  ↓ Available for
OPERATIONS_MANAGER (assign to trips)
```

---

## 🎯 Next Steps

### **Option 1: Use Existing Schema Files**
The system already has these files:
- `supabase/schema.sql` - Core tables
- `supabase/finance_schema.sql` - Finance tables
- `supabase/hr_schema.sql` - HR tables
- `supabase/maintenance_schema.sql` - Maintenance tables

**Action:** Run these in order, then add missing tables

### **Option 2: Use New Complete Schema**
**Action:** I can create the remaining files (02-08) with:
- All missing tables
- Proper RLS policies for each dashboard
- Helper functions
- Triggers

---

## 📋 What You Need

Tell me which approach you prefer:

**A)** Create all remaining SQL files (02-08) with complete dashboard-specific schemas

**B)** Update existing schema files to match dashboard requirements

**C)** Create a single consolidated SQL file with everything

I recommend **Option A** for better organization and maintainability.

---

## ✅ Already Created

1. **DASHBOARD_OVERVIEW.md** - Complete dashboard breakdown
2. **COMPLETE_01_core_tables.sql** - Core foundation tables
3. **This guide** - Implementation roadmap

**Ready to proceed with remaining SQL files!** 🚀
