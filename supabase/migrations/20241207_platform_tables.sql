-- Platform Tables Migration
-- Creates tables for platform management features

-- =====================================================
-- PLATFORM INCIDENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor')),
    affected_services TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PLATFORM ERROR LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warning', 'info', 'debug')),
    message TEXT NOT NULL,
    source TEXT,
    stack_trace TEXT,
    tenant_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON platform_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON platform_error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant ON platform_error_logs(tenant_id);

-- =====================================================
-- PLATFORM ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'update', 'maintenance', 'warning', 'critical')),
    channels TEXT[] DEFAULT ARRAY['in-app'],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PLATFORM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description, category) VALUES
    ('platform_name', '"Voyage Tech Solutions"', 'Platform display name', 'general'),
    ('support_email', '"support@voyagetech.com"', 'Support email address', 'general'),
    ('default_timezone', '"Africa/Harare"', 'Default timezone for new tenants', 'general'),
    ('default_currency', '"USD"', 'Default currency for new tenants', 'general'),
    ('maintenance_mode', 'false', 'Enable maintenance mode', 'general'),
    ('max_tenants', '100', 'Maximum number of tenants allowed', 'limits'),
    ('max_api_calls_per_tenant', '100000', 'Maximum API calls per tenant per month', 'limits')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- PLATFORM INTEGRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('payment', 'sms', 'email', 'maps', 'storage', 'webhook')),
    config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default integrations
INSERT INTO platform_integrations (name, type, category, is_enabled, status) VALUES
    ('Supabase Storage', 'supabase_storage', 'storage', true, 'connected'),
    ('Google Maps', 'google_maps', 'maps', false, 'disconnected')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PLATFORM FEATURE FLAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'percentage', 'tenants', 'users')),
    target_value JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default feature flags
INSERT INTO platform_feature_flags (name, key, description, is_enabled, target_type) VALUES
    ('Live Bus Tracking', 'live_tracking', 'Enable real-time GPS tracking for buses', true, 'all'),
    ('Mobile Tickets', 'mobile_tickets', 'Allow passengers to use mobile QR tickets', true, 'all'),
    ('Seat Selection', 'seat_selection', 'Allow passengers to select specific seats', true, 'all'),
    ('Dynamic Pricing', 'dynamic_pricing', 'Enable demand-based pricing adjustments', false, 'tenants'),
    ('AI Route Optimization', 'ai_route_optimization', 'Use AI to optimize bus routes and schedules', false, 'tenants'),
    ('Multi-Currency Support', 'multi_currency', 'Support multiple currencies for payments', false, 'percentage')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- PLATFORM TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'pdf')),
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO platform_templates (name, type, subject, content, variables) VALUES
    ('Booking Confirmation', 'email', 'Your Booking is Confirmed - {{booking_reference}}', 
     'Dear {{customer_name}}, Your booking has been confirmed. Booking Reference: {{booking_reference}} Route: {{origin}} to {{destination}} Date: {{travel_date}} Time: {{departure_time}} Seats: {{seat_numbers}} Total Amount: {{total_amount}} Thank you for choosing {{company_name}}!',
     ARRAY['customer_name', 'booking_reference', 'origin', 'destination', 'travel_date', 'departure_time', 'seat_numbers', 'total_amount', 'company_name']),
    ('Payment Receipt', 'email', 'Payment Receipt - {{payment_reference}}',
     'Dear {{customer_name}}, We have received your payment. Payment Reference: {{payment_reference}} Amount: {{amount}} Payment Method: {{payment_method}} Date: {{payment_date}} Thank you!',
     ARRAY['customer_name', 'payment_reference', 'amount', 'payment_method', 'payment_date']),
    ('Trip Reminder', 'sms', NULL,
     'Reminder: Your trip from {{origin}} to {{destination}} departs at {{departure_time}} on {{travel_date}}. Booking: {{booking_reference}}',
     ARRAY['origin', 'destination', 'departure_time', 'travel_date', 'booking_reference']),
    ('Booking Cancelled', 'email', 'Booking Cancelled - {{booking_reference}}',
     'Dear {{customer_name}}, Your booking {{booking_reference}} has been cancelled. Refund Amount: {{refund_amount}} Refund will be processed within 5-7 business days. If you have any questions, please contact us.',
     ARRAY['customer_name', 'booking_reference', 'refund_amount']),
    ('Bus Delay Notification', 'push', NULL,
     'Your bus from {{origin}} to {{destination}} is delayed by {{delay_minutes}} minutes. New departure time: {{new_departure_time}}',
     ARRAY['origin', 'destination', 'delay_minutes', 'new_departure_time']),
    ('E-Ticket PDF', 'pdf', NULL,
     'E-Ticket template for generating PDF tickets with QR codes',
     ARRAY['booking_reference', 'customer_name', 'origin', 'destination', 'travel_date', 'departure_time', 'seat_numbers', 'qr_code'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- PLATFORM BACKUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'scheduled', 'automatic')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    size_bytes BIGINT,
    storage_path TEXT,
    created_by UUID,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Enable RLS on all platform tables
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_backups ENABLE ROW LEVEL SECURITY;

-- Create policies for platform admin access (service role bypasses RLS)
-- For now, allow authenticated users to read (platform admin check is done in frontend)
CREATE POLICY "Allow authenticated read" ON platform_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_error_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON platform_backups FOR SELECT TO authenticated USING (true);

-- Allow inserts/updates for authenticated users (platform admin check in frontend)
CREATE POLICY "Allow authenticated insert" ON platform_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON platform_incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON platform_error_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON platform_announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON platform_announcements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON platform_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON platform_integrations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON platform_feature_flags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON platform_feature_flags FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON platform_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON platform_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON platform_backups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON platform_backups FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_incidents_updated_at BEFORE UPDATE ON platform_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_announcements_updated_at BEFORE UPDATE ON platform_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON platform_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_feature_flags_updated_at BEFORE UPDATE ON platform_feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_templates_updated_at BEFORE UPDATE ON platform_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
