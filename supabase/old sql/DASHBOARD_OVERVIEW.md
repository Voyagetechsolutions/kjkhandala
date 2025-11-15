# 🎯 Complete Dashboard Schema Architecture

## Overview
This document outlines the complete database schema organized by dashboard requirements. Each dashboard has specific tables, views, and functions to support its functionality.

---

## 📊 Dashboard Breakdown

### 1. **SUPER_ADMIN Dashboard** (Full System Access)
**Purpose:** Complete system oversight and management  
**Access:** All tables, all functions, all reports  
**Key Features:**
- System-wide analytics
- User management
- Role assignment
- Audit logs
- System settings
- All dashboard data aggregated

**Tables Used:** ALL

---

### 2. **ADMIN Dashboard** (User Management)
**Purpose:** Manage users, roles, and permissions  
**Key Features:**
- User CRUD operations
- Role assignment
- Permission management
- User activity logs
- Profile management

**Tables:**
- `profiles` - User profiles
- `user_roles` - Role assignments
- `audit_logs` - User activity tracking
- `notifications` - User notifications

---

### 3. **OPERATIONS_MANAGER Dashboard** (Trips/Routes/Buses)
**Purpose:** Manage daily operations, fleet, and trip scheduling  
**Key Features:**
- Trip scheduling and monitoring
- Route management
- Bus fleet management
- Driver assignment
- Real-time trip tracking
- Operational KPIs

**Tables:**
- `routes` - Route definitions
- `buses` - Fleet management
- `drivers` - Driver information
- `trips` - Trip schedules
- `bookings` - Booking data (read-only)
- `trip_tracking` - Real-time GPS tracking
- `incidents` - Operational incidents
- `trip_stops` - Stop management

---

### 4. **FINANCE_MANAGER Dashboard** (Financial Reports)
**Purpose:** Financial oversight, reporting, and reconciliation  
**Key Features:**
- Revenue tracking
- Expense management
- Invoice generation
- Refund processing
- Financial reports
- Cash reconciliation
- Profit/loss analysis

**Tables:**
- `bookings` - Revenue from tickets
- `payments` - Payment transactions
- `expenses` - Operating expenses
- `invoices` - Invoice management
- `refunds` - Refund processing
- `accounts` - Bank accounts
- `collections` - Cash collections
- `reconciliation` - Daily reconciliation
- `fuel_logs` - Fuel expenses

---

### 5. **HR_MANAGER Dashboard** (Drivers/Staff)
**Purpose:** Human resource management  
**Key Features:**
- Employee management
- Attendance tracking
- Leave management
- Payroll processing
- Performance evaluations
- Recruitment
- Training & certifications

**Tables:**
- `profiles` - Employee profiles
- `drivers` - Driver-specific data
- `attendance` - Daily attendance
- `leave_requests` - Leave management
- `payroll` - Salary processing
- `shifts` - Shift scheduling
- `certifications` - License & certs
- `performance_evaluations` - Reviews
- `job_postings` - Recruitment
- `job_applications` - Applications
- `employee_documents` - Document management

---

### 6. **MAINTENANCE_MANAGER Dashboard** (Bus Maintenance)
**Purpose:** Fleet maintenance and inventory management  
**Key Features:**
- Maintenance scheduling
- Work order management
- Inspection tracking
- Repair history
- Inventory management
- Cost tracking
- Preventive maintenance

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

---

### 7. **TICKETING_AGENT Dashboard** (Create Bookings)
**Purpose:** Terminal operations and ticket sales  
**Key Features:**
- Ticket booking
- Seat selection
- Payment processing
- Booking management
- Passenger manifest
- Daily sales reports
- Cash collection

**Tables:**
- `trips` - Available trips
- `routes` - Route information
- `buses` - Bus/seat information
- `bookings` - Ticket bookings
- `payments` - Payment processing
- `passengers` - Passenger data
- `manifest` - Trip manifest
- `collections` - Cash handling

---

### 8. **DRIVER Dashboard** (View Assigned Trips)
**Purpose:** Driver operations and trip management  
**Key Features:**
- Assigned trips view
- Trip start/end
- Passenger manifest
- GPS tracking
- Fuel logging
- Incident reporting
- Communication

**Tables:**
- `trips` - Assigned trips
- `drivers` - Driver profile
- `bookings` - Passenger list
- `trip_tracking` - GPS updates
- `fuel_logs` - Fuel expenses
- `incidents` - Incident reports
- `trip_stops` - Stop logging
- `driver_communications` - Messages

---

### 9. **PASSENGER Dashboard** (Book Tickets)
**Purpose:** Customer self-service portal  
**Key Features:**
- Trip search
- Ticket booking
- Payment
- Booking history
- E-tickets
- Booking cancellation
- Notifications

**Tables:**
- `routes` - Available routes
- `trips` - Available trips
- `bookings` - User bookings
- `payments` - Payment history
- `notifications` - User alerts
- `profiles` - User profile

---

## 🔗 Dashboard Interconnections

```
SUPER_ADMIN
    ├── Has access to ALL dashboards
    └── Can view aggregated data from all modules

ADMIN
    ├── Manages users for → ALL ROLES
    └── Assigns roles to → ALL DASHBOARDS

OPERATIONS_MANAGER
    ├── Creates trips → Used by TICKETING_AGENT
    ├── Assigns drivers → Used by DRIVER
    ├── Manages buses → Used by MAINTENANCE_MANAGER
    └── Revenue data → Used by FINANCE_MANAGER

FINANCE_MANAGER
    ├── Tracks revenue from → TICKETING_AGENT
    ├── Processes refunds for → PASSENGER
    ├── Manages expenses from → MAINTENANCE_MANAGER
    └── Handles payroll for → HR_MANAGER

HR_MANAGER
    ├── Manages drivers → Used by OPERATIONS_MANAGER
    ├── Tracks attendance → All staff
    └── Processes payroll → FINANCE_MANAGER approves

MAINTENANCE_MANAGER
    ├── Maintains buses → Used by OPERATIONS_MANAGER
    ├── Logs costs → Tracked by FINANCE_MANAGER
    └── Schedules downtime → Affects OPERATIONS_MANAGER

TICKETING_AGENT
    ├── Creates bookings → Revenue for FINANCE_MANAGER
    ├── Books trips → Created by OPERATIONS_MANAGER
    └── Collects cash → Reconciled by FINANCE_MANAGER

DRIVER
    ├── Assigned trips → By OPERATIONS_MANAGER
    ├── Logs fuel → Tracked by FINANCE_MANAGER
    └── Reports incidents → Monitored by OPERATIONS_MANAGER

PASSENGER
    ├── Books tickets → Processed by TICKETING_AGENT
    ├── Makes payments → Tracked by FINANCE_MANAGER
    └── Receives service → Delivered by DRIVER
```

---

## 📁 SQL Files Structure

1. **`01_core_tables.sql`** - Core tables (profiles, roles, routes, buses, drivers, trips, bookings)
2. **`02_operations_tables.sql`** - Operations-specific tables
3. **`03_finance_tables.sql`** - Finance-specific tables
4. **`04_hr_tables.sql`** - HR-specific tables
5. **`05_maintenance_tables.sql`** - Maintenance-specific tables
6. **`06_ticketing_tables.sql`** - Ticketing-specific tables
7. **`07_driver_tables.sql`** - Driver-specific tables
8. **`08_passenger_tables.sql`** - Passenger-specific tables
9. **`09_rls_policies.sql`** - Row Level Security for all tables
10. **`10_functions_views.sql`** - Helper functions and views
11. **`11_triggers.sql`** - Automated triggers

---

## 🎯 Next Steps

Run the SQL files in order (01-11) to create the complete database schema with proper role-based access control.
