-- =====================================================
-- CREATE DEPARTMENTS TABLE
-- Aligns with system roles and dashboards
-- Supports both system departments and custom company departments
-- =====================================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    code text UNIQUE NOT NULL, -- Short code for department (e.g., OPS, FIN, HR)
    description text,
    manager_id uuid REFERENCES auth.users(id),
    parent_department_id uuid REFERENCES public.departments(id), -- For sub-departments
    is_system_department boolean DEFAULT false, -- True for core BMS departments
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Insert SYSTEM departments (aligned with roles and dashboards)
INSERT INTO public.departments (name, code, description, is_system_department) VALUES
-- Core System Departments (aligned with dashboards)
('Operations', 'OPS', 'Fleet operations, trip scheduling, live tracking, and logistics', true),
('Finance', 'FIN', 'Accounting, payroll, fuel management, and financial reporting', true),
('Human Resources', 'HR', 'Employee management, recruitment, attendance, and payroll', true),
('Maintenance', 'MAINT', 'Vehicle maintenance, inspections, and repairs', true),
('Ticketing', 'TICKET', 'Ticket sales, bookings, and passenger services', true),
('Administration', 'ADMIN', 'System administration and management', true),

-- Supporting Departments (can have employees but no dedicated dashboard)
('Customer Service', 'CS', 'Customer support and complaint resolution', false),
('IT Support', 'IT', 'Information technology and systems support', false),
('Security', 'SEC', 'Security and safety operations', false),
('Drivers', 'DRV', 'Professional drivers and driver management', false)
ON CONFLICT (name) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Everyone can view departments
CREATE POLICY "departments_select_all" ON public.departments
  FOR SELECT USING (true);

-- Only admins can manage departments
CREATE POLICY "departments_manage_admin" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- 5. Add department_id to employees table (if not exists)
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);

-- 7. Optional: Migrate existing department text values to department_id
-- This maps text department names to the new department_id foreign key
DO $$
DECLARE
  dept_record RECORD;
BEGIN
  FOR dept_record IN 
    SELECT DISTINCT department FROM public.employees WHERE department IS NOT NULL
  LOOP
    -- Try to find matching department (case-insensitive)
    UPDATE public.employees
    SET department_id = (
      SELECT id FROM public.departments 
      WHERE LOWER(name) = LOWER(dept_record.department)
      LIMIT 1
    )
    WHERE LOWER(department) = LOWER(dept_record.department)
    AND department_id IS NULL;
  END LOOP;
END $$;

-- 8. Verify the migration
SELECT 
  d.name as department_name,
  COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.name
ORDER BY employee_count DESC;

-- 9. Create helper function to add custom company departments
CREATE OR REPLACE FUNCTION public.add_custom_department(
  dept_name text,
  dept_code text,
  dept_description text DEFAULT NULL,
  dept_manager_id uuid DEFAULT NULL,
  parent_dept_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_dept_id uuid;
BEGIN
  -- Check if user has permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create departments';
  END IF;

  -- Insert custom department
  INSERT INTO public.departments (
    name, 
    code, 
    description, 
    manager_id, 
    parent_department_id,
    is_system_department,
    is_active
  ) VALUES (
    dept_name,
    dept_code,
    dept_description,
    dept_manager_id,
    parent_dept_id,
    false, -- Custom departments are not system departments
    true
  )
  RETURNING id INTO new_dept_id;

  RETURN new_dept_id;
END;
$$;

-- 10. Create helper function to get department hierarchy
CREATE OR REPLACE FUNCTION public.get_department_hierarchy(dept_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  code text,
  level int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dept_tree AS (
    -- Base case: the department itself
    SELECT 
      d.id,
      d.name,
      d.code,
      0 as level
    FROM departments d
    WHERE d.id = dept_id
    
    UNION ALL
    
    -- Recursive case: child departments
    SELECT 
      d.id,
      d.name,
      d.code,
      dt.level + 1
    FROM departments d
    INNER JOIN dept_tree dt ON d.parent_department_id = dt.id
  )
  SELECT * FROM dept_tree ORDER BY level;
END;
$$;

-- 11. Create view for department summary
CREATE OR REPLACE VIEW public.department_summary AS
SELECT 
  d.id,
  d.name,
  d.code,
  d.description,
  d.is_system_department,
  d.is_active,
  p.full_name as manager_name,
  pd.name as parent_department,
  COUNT(DISTINCT e.id) as employee_count,
  COUNT(DISTINCT CASE WHEN e.status = 'ACTIVE' THEN e.id END) as active_employees
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
LEFT JOIN departments pd ON d.parent_department_id = pd.id
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name, d.code, d.description, d.is_system_department, 
         d.is_active, p.full_name, pd.name
ORDER BY d.is_system_department DESC, d.name;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Departments table created successfully!';
  RAISE NOTICE '📋 System departments aligned with BMS roles and dashboards:';
  RAISE NOTICE '   - Operations (OPS) → Operations Dashboard';
  RAISE NOTICE '   - Finance (FIN) → Finance Dashboard';
  RAISE NOTICE '   - Human Resources (HR) → HR Dashboard';
  RAISE NOTICE '   - Maintenance (MAINT) → Maintenance Dashboard';
  RAISE NOTICE '   - Ticketing (TICKET) → Ticketing Dashboard';
  RAISE NOTICE '   - Administration (ADMIN) → Admin Dashboard';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '🔗 Foreign key relationship established with employees table';
  RAISE NOTICE '🏢 Custom department support enabled via add_custom_department() function';
  RAISE NOTICE '';
  RAISE NOTICE '📝 To add a custom company department:';
  RAISE NOTICE '   SELECT add_custom_department(''Marketing'', ''MKT'', ''Marketing and communications'');';
END $$;
