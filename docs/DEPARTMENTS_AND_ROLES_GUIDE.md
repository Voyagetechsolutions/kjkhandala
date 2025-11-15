# Departments and Roles Guide

## Overview
This guide explains how departments align with system roles and dashboards, and how to add custom company departments.

---

## System Architecture

### 1. System Departments (Core BMS)
These departments are **built into the BMS system** and align with dashboards and roles:

| Department | Code | Dashboard | Related Roles | Description |
|------------|------|-----------|---------------|-------------|
| **Operations** | OPS | Operations Dashboard | OPERATIONS_MANAGER | Fleet operations, trip scheduling, live tracking |
| **Finance** | FIN | Finance Dashboard | FINANCE_MANAGER | Accounting, payroll, fuel management |
| **Human Resources** | HR | HR Dashboard | HR_MANAGER | Employee management, recruitment, attendance |
| **Maintenance** | MAINT | Maintenance Dashboard | MAINTENANCE_MANAGER | Vehicle maintenance, inspections, repairs |
| **Ticketing** | TICKET | Ticketing Dashboard | TICKETING_AGENT, TICKETING_SUPERVISOR | Ticket sales, bookings, passenger services |
| **Administration** | ADMIN | Admin Dashboard | SUPER_ADMIN, ADMIN | System administration and management |

### 2. Supporting Departments
These departments can have employees but don't have dedicated dashboards:

| Department | Code | Description |
|------------|------|-------------|
| **Customer Service** | CS | Customer support and complaint resolution |
| **IT Support** | IT | Information technology and systems support |
| **Security** | SEC | Security and safety operations |
| **Drivers** | DRV | Professional drivers and driver management |

### 3. Custom Company Departments
You can add **unlimited custom departments** specific to your company that are not linked to the BMS system.

---

## System Roles

### Role Hierarchy
```
SUPER_ADMIN (Level 100)
  └─ ADMIN (Level 90)
      ├─ OPERATIONS_MANAGER (Level 80)
      ├─ FINANCE_MANAGER (Level 80)
      ├─ HR_MANAGER (Level 80)
      ├─ MAINTENANCE_MANAGER (Level 80)
      └─ TICKETING_SUPERVISOR (Level 70)
          └─ TICKETING_AGENT (Level 50)
              ├─ DRIVER (Level 30)
              └─ PASSENGER (Level 10)
```

### Role-Department Mapping
- **SUPER_ADMIN / ADMIN** → Administration Department
- **OPERATIONS_MANAGER** → Operations Department
- **FINANCE_MANAGER** → Finance Department
- **HR_MANAGER** → Human Resources Department
- **MAINTENANCE_MANAGER** → Maintenance Department
- **TICKETING_SUPERVISOR / TICKETING_AGENT** → Ticketing Department
- **DRIVER** → Drivers Department (or Operations)
- **PASSENGER** → No department (external users)

---

## Adding Custom Departments

### Method 1: Using SQL Function
```sql
-- Add a custom department
SELECT add_custom_department(
  'Marketing',                    -- Department name
  'MKT',                          -- Department code
  'Marketing and communications', -- Description (optional)
  NULL,                           -- Manager ID (optional)
  NULL                            -- Parent department ID (optional)
);

-- Add a sub-department
SELECT add_custom_department(
  'Digital Marketing',
  'DMKT',
  'Online marketing and social media',
  NULL,
  (SELECT id FROM departments WHERE code = 'MKT') -- Parent is Marketing
);
```

### Method 2: Direct Insert (Admin Only)
```sql
INSERT INTO departments (name, code, description, is_system_department)
VALUES ('Sales', 'SALES', 'Sales and business development', false);
```

### Examples of Custom Departments
```sql
-- Add various company-specific departments
SELECT add_custom_department('Marketing', 'MKT', 'Marketing and brand management');
SELECT add_custom_department('Sales', 'SALES', 'Sales and business development');
SELECT add_custom_department('Legal', 'LEGAL', 'Legal and compliance');
SELECT add_custom_department('Procurement', 'PROC', 'Procurement and supply chain');
SELECT add_custom_department('Training', 'TRAIN', 'Staff training and development');
SELECT add_custom_department('Quality Assurance', 'QA', 'Quality control and assurance');
```

---

## Department Features

### 1. Department Hierarchy
Create parent-child relationships:
```sql
-- Create parent department
SELECT add_custom_department('Engineering', 'ENG', 'Engineering department');

-- Create child departments
SELECT add_custom_department(
  'Mechanical Engineering', 
  'MECH',
  'Mechanical systems',
  NULL,
  (SELECT id FROM departments WHERE code = 'ENG')
);

SELECT add_custom_department(
  'Electrical Engineering',
  'ELEC', 
  'Electrical systems',
  NULL,
  (SELECT id FROM departments WHERE code = 'ENG')
);
```

### 2. Department Manager
Assign a manager to a department:
```sql
UPDATE departments
SET manager_id = (SELECT id FROM profiles WHERE email = 'manager@company.com')
WHERE code = 'MKT';
```

### 3. View Department Hierarchy
```sql
-- Get all sub-departments under a department
SELECT * FROM get_department_hierarchy(
  (SELECT id FROM departments WHERE code = 'ENG')
);
```

### 4. Department Summary
```sql
-- View all departments with employee counts
SELECT * FROM department_summary;
```

---

## Employee Assignment

### Assign Employee to Department
```sql
UPDATE employees
SET department_id = (SELECT id FROM departments WHERE code = 'MKT')
WHERE id = 'employee-uuid';
```

### Query Employees by Department
```sql
-- Get all employees in Marketing
SELECT e.full_name, e.position, e.status
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE d.code = 'MKT'
AND e.status = 'ACTIVE';
```

---

## Frontend Integration

### Fetch All Departments
```typescript
const { data: departments } = useQuery({
  queryKey: ['departments'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('is_system_department', { ascending: false })
      .order('name');
    if (error) throw error;
    return data;
  }
});
```

### Filter System vs Custom Departments
```typescript
// System departments only
const systemDepts = departments?.filter(d => d.is_system_department);

// Custom departments only
const customDepts = departments?.filter(d => !d.is_system_department);
```

### Department Dropdown
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select department" />
  </SelectTrigger>
  <SelectContent>
    {/* System Departments */}
    <SelectGroup>
      <SelectLabel>System Departments</SelectLabel>
      {systemDepts?.map(dept => (
        <SelectItem key={dept.id} value={dept.id}>
          {dept.name} ({dept.code})
        </SelectItem>
      ))}
    </SelectGroup>
    
    {/* Custom Departments */}
    {customDepts && customDepts.length > 0 && (
      <SelectGroup>
        <SelectLabel>Company Departments</SelectLabel>
        {customDepts.map(dept => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.name} ({dept.code})
          </SelectItem>
        ))}
      </SelectGroup>
    )}
  </SelectContent>
</Select>
```

---

## Best Practices

### 1. Department Codes
- Use 2-5 uppercase letters
- Make them memorable and intuitive
- Avoid conflicts with existing codes

### 2. System Departments
- **Never delete** system departments (is_system_department = true)
- These are required for dashboard functionality
- Can be deactivated but not removed

### 3. Custom Departments
- Can be freely added, modified, or deleted
- Use for company-specific organizational structure
- Can have hierarchies (parent-child relationships)

### 4. Department Assignment
- Every employee should have a department
- Use system departments for roles with dashboard access
- Use custom departments for other staff

---

## Migration from Text Departments

If you have existing employees with text-based departments:

```sql
-- The migration script automatically maps text to department_id
-- But you can manually verify:

SELECT 
  e.full_name,
  e.department as old_department,
  d.name as new_department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.department IS NOT NULL;
```

---

## Summary

✅ **System Departments** → Linked to BMS dashboards and roles
✅ **Custom Departments** → Company-specific, not linked to system
✅ **Hierarchies** → Support parent-child relationships
✅ **Flexible** → Add unlimited custom departments
✅ **Protected** → System departments cannot be deleted
✅ **Integrated** → Works with employee management and reporting
