# HR & Maintenance Database Schema Updates

## ✅ Completed: Enhanced Prisma Schema

The HR and Maintenance modules have been enhanced with comprehensive database schema updates.

## 📊 HR Module Enhancements

### Employee Model
**New Fields:**
- `employeeId` - Custom employee number (e.g., EMP-001)
- `employmentType` - Full-time, part-time, or contract
- **Indexes:** department, status, email

### Attendance Model
**New Fields:**
- `workHours` - Calculated work hours
- `overtime` - Overtime hours
- `isLate` - Late arrival flag
- **Indexes:** date, status

### LeaveRequest Model
**New Fields:**
- `employeeName` - Denormalized for faster queries
- `type` - Alias for leaveType
- `requestDate` - When request was made
- **Indexes:** employeeId, status, startDate

### Certification Model
**New Fields:**
- `employeeName` - Denormalized
- `type` - License, medical, contract, etc.
- `number` - Certificate/license number
- **Indexes:** employeeId, expiryDate, type

### Payroll Model
**New Fields:**
- `employeeName` - Denormalized
- `department` - Employee department
- `basicSalary` - Base salary
- `allowances` - Housing, transport, etc.
- `grossPay` - Alias for grossSalary
- `totalAmount` - Alias for netSalary
- **Indexes:** employeeId, month, status

### PerformanceEvaluation Model
**New Fields:**
- `employeeName` - Denormalized
- `department` - Employee department
- `productivity` - Individual score
- `punctuality` - Individual score
- `teamwork` - Individual score
- `overall` - Overall rating
- `status` - Evaluation status
- **Indexes:** employeeId, period

### JobPosting Model
**New Fields:**
- `location` - Job location (default: Gaborone)
- `employmentType` - Full-time, part-time, contract
- **Indexes:** status, department

### Application Model
**New Fields:**
- `jobTitle` - Denormalized
- `experience` - Years of experience
- `requestDate` - Application date
- **Status values:** pending, screening, interview, rejected, hired
- **Indexes:** jobId, status

---

## 🔧 Maintenance Module Enhancements

### WorkOrder Model
**New Fields:**
- `cost` - Alias for actualCost
- **Indexes:** busId, status, priority, assignedToId

### MaintenanceSchedule Model
**Indexes Added:**
- busId
- nextServiceDate
- status

### Inspection Model
**Indexes Added:**
- busId
- date
- status

### Repair Model
**Indexes Added:**
- busId
- date
- status

### InventoryItem Model
**Indexes Added:**
- category
- quantity

### MaintenanceRecord Model
**Indexes Added:**
- busId
- date
- type

### MaintenanceCost Model
**Indexes Added:**
- busId
- date
- category

---

## 📦 Migration Commands

To apply these changes to your database, run:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name hr_maintenance_enhancements

# Or use the batch script (Windows)
.\scripts\migrate-hr-maintenance.bat
```

## 🎯 Benefits

### Performance Improvements
- **25+ new indexes** for faster queries
- Optimized for common filtering operations
- Better join performance with denormalized fields

### Data Integrity
- Proper foreign key constraints
- Cascade delete rules
- Unique constraints where needed

### Developer Experience
- Compatible field aliases (e.g., `totalAmount` for `netSalary`)
- Denormalized fields reduce complex joins
- Clear field naming conventions

### Frontend Compatibility
- All fields match frontend expectations
- Supports both new and legacy field names
- Ready for API integration

---

## 📋 Database Tables

### HR Tables (8)
1. `employees` - Employee records
2. `attendance` - Daily attendance tracking
3. `leave_requests` - Leave management
4. `certifications` - Licenses and certifications
5. `payroll` - Salary and payments
6. `performance_evaluations` - Performance reviews
7. `job_postings` - Recruitment postings
8. `applications` - Job applications

### Maintenance Tables (8)
1. `work_orders` - Maintenance work orders
2. `maintenance_schedules` - Scheduled services
3. `inspections` - Vehicle inspections
4. `repairs` - Repair records
5. `inventory_items` - Spare parts inventory
6. `stock_movements` - Inventory transactions
7. `maintenance_records` - General maintenance logs
8. `maintenance_costs` - Cost tracking

---

## ✨ Status: Ready for Migration

All schema changes have been made to `backend/prisma/schema.prisma`. 

Run the migration command to apply these changes to your database.

After migration, the frontend HR and Maintenance modules will have full database support with optimized queries and comprehensive tracking.

---

**Created:** 2025-11-06  
**Module:** HR & Maintenance  
**Status:** ✅ Schema Updated, Awaiting Migration
