-- Additional tables for complete application functionality
-- Run this AFTER missing_tables.sql

-- Company settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  registration_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  booking_notifications BOOLEAN DEFAULT true,
  trip_notifications BOOLEAN DEFAULT true,
  maintenance_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Maintenance parts inventory
CREATE TABLE IF NOT EXISTS public.maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_number TEXT UNIQUE,
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  minimum_stock INT DEFAULT 0,
  category TEXT,
  location TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts usage tracking
CREATE TABLE IF NOT EXISTS public.parts_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES maintenance_parts(id),
  maintenance_record_id UUID REFERENCES maintenance_records(id),
  quantity_used INT NOT NULL,
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff shifts schedule
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  shift_type TEXT,  -- 'morning', 'afternoon', 'night', 'full_day'
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bus GPS locations (for live tracking)
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),  -- km/h
  heading DECIMAL(5,2),  -- degrees
  altitude DECIMAL(7,2),  -- meters
  accuracy DECIMAL(5,2),  -- meters
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient location queries
CREATE INDEX IF NOT EXISTS bus_locations_bus_id_timestamp_idx 
  ON bus_locations(bus_id, timestamp DESC);

-- Driver documents (licenses, certifications, etc.)
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,  -- 'license', 'medical', 'prdp', 'contract'
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  status TEXT DEFAULT 'valid',  -- 'valid', 'expired', 'pending_renewal'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'login', 'logout'
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings/configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" ON public.company_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.notification_preferences FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.maintenance_parts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.parts_usage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.staff_shifts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.bus_locations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.driver_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.audit_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON public.system_settings FOR SELECT TO authenticated USING (true);

-- Insert default company settings
INSERT INTO public.company_settings (company_name, phone, email)
VALUES ('Voyage Bus Management System', '+267 1234567', 'info@voyagebms.com')
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description, category, is_public)
VALUES 
  ('booking_advance_days', '30', 'Number of days in advance bookings can be made', 'bookings', true),
  ('cancellation_hours', '24', 'Hours before departure for free cancellation', 'bookings', true),
  ('max_seats_per_booking', '10', 'Maximum seats per single booking', 'bookings', true),
  ('maintenance_reminder_days', '7', 'Days before maintenance due to send reminder', 'maintenance', false),
  ('low_stock_threshold', '5', 'Minimum parts quantity before low stock alert', 'inventory', false)
ON CONFLICT (setting_key) DO NOTHING;
