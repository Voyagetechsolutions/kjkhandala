-- Missing tables causing 404 errors
-- Run this in your Supabase SQL editor

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    department TEXT,
    hire_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: income table already exists in main schema.sql
-- If you need additional revenue tracking, use the income table

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id),
    bus_id UUID REFERENCES buses(id),
    route_id UUID REFERENCES routes(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    pay_period TEXT NOT NULL,
    basic_salary DECIMAL(10,2),
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id),
    maintenance_type TEXT NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id),
    maintenance_type TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    service_date DATE DEFAULT CURRENT_DATE,
    next_service_date DATE,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    operating_hours TEXT,
    contact_number TEXT,
    manager_id UUID REFERENCES staff(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY; -- Not needed, using income table
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_offices ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" ON public.staff FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON public.revenue FOR ALL TO authenticated USING (true); -- Not needed
CREATE POLICY "Allow all for authenticated users" ON public.assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.staff_payroll FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.staff_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.maintenance_reminders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.maintenance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.booking_offices FOR ALL TO authenticated USING (true);
