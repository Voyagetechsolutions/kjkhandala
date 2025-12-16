-- API Key Integration System for Multi-Tenant White-Label Booking
-- This migration creates the complete API key system for bus companies to connect their websites

-- =====================================================
-- DROP EXISTING FUNCTIONS TO AVOID CONFLICTS
-- =====================================================
DROP FUNCTION IF EXISTS generate_api_key(UUID, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS generate_api_key(UUID, TEXT);
DROP FUNCTION IF EXISTS generate_tenant_api_key(UUID, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS validate_api_key(TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_api_key(TEXT);
DROP FUNCTION IF EXISTS validate_tenant_api_key(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_tenant_by_slug(TEXT);
DROP FUNCTION IF EXISTS get_tenant_public_data(TEXT);
DROP FUNCTION IF EXISTS register_website_connection(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS register_tenant_website(TEXT, TEXT, TEXT, TEXT, TEXT);

-- =====================================================
-- 1. TENANT SETTINGS TABLE (Extended Company Profile)
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Branding
    slug TEXT UNIQUE,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#003366',
    secondary_color TEXT DEFAULT '#0066cc',
    accent_color TEXT DEFAULT '#ff6600',
    font_family TEXT DEFAULT 'Inter',
    
    -- Website Integration
    domain_url TEXT,  -- Their actual website URL
    booking_redirect_url TEXT,  -- Where to redirect after booking
    support_email TEXT,
    support_phone TEXT,
    
    -- Booking Settings
    booking_settings JSONB DEFAULT '{
        "allow_guest_booking": true,
        "require_id_number": true,
        "require_phone": true,
        "allow_seat_selection": true,
        "show_luggage_options": true,
        "max_tickets_per_booking": 10,
        "booking_cutoff_minutes": 30,
        "cancellation_policy": "24_hours",
        "refund_percentage": 80
    }'::jsonb,
    
    -- Enabled Modules
    enabled_modules JSONB DEFAULT '{
        "online_booking": true,
        "seat_selection": true,
        "luggage_booking": true,
        "parcel_delivery": false,
        "charter_booking": false,
        "loyalty_program": false,
        "mobile_tickets": true,
        "sms_notifications": true,
        "email_notifications": true
    }'::jsonb,
    
    -- Theme Settings
    theme_settings JSONB DEFAULT '{
        "mode": "light",
        "header_style": "default",
        "footer_style": "default",
        "button_style": "rounded",
        "card_style": "shadow"
    }'::jsonb,
    
    -- SEO & Meta
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Social Links
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Business Hours
    business_hours JSONB DEFAULT '{
        "monday": {"open": "08:00", "close": "17:00"},
        "tuesday": {"open": "08:00", "close": "17:00"},
        "wednesday": {"open": "08:00", "close": "17:00"},
        "thursday": {"open": "08:00", "close": "17:00"},
        "friday": {"open": "08:00", "close": "17:00"},
        "saturday": {"open": "08:00", "close": "13:00"},
        "sunday": {"closed": true}
    }'::jsonb,
    
    -- Timezone
    timezone TEXT DEFAULT 'Africa/Johannesburg',
    currency TEXT DEFAULT 'ZAR',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(company_id)
);

-- =====================================================
-- 2. API KEYS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Key Details
    key_prefix TEXT NOT NULL,  -- First 8 chars for display (vts_xxxx)
    key_hash TEXT NOT NULL,    -- Hashed full key for security
    name TEXT NOT NULL,        -- Friendly name (e.g., "Production Key", "Website Integration")
    description TEXT,
    
    -- Permissions
    permissions JSONB DEFAULT '{
        "booking": {"create": true, "read": true, "update": false, "delete": false},
        "trips": {"read": true},
        "routes": {"read": true},
        "terminals": {"read": true},
        "passengers": {"create": true, "read": false},
        "payments": {"create": true, "read": false}
    }'::jsonb,
    
    -- Rate Limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Restrictions
    allowed_domains TEXT[],     -- Whitelist of domains that can use this key
    allowed_ips TEXT[],         -- Whitelist of IPs (optional)
    
    -- Usage Tracking
    last_used_at TIMESTAMPTZ,
    total_requests INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,     -- Optional expiration
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. API KEY USAGE LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Request Details
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_ip TEXT,
    request_origin TEXT,
    user_agent TEXT,
    
    -- Response
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Error tracking
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_created ON api_key_usage(created_at DESC);

-- =====================================================
-- 4. WEBSITE CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS website_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Connection Details
    website_url TEXT NOT NULL,
    return_url TEXT,            -- Where to redirect after booking
    webhook_url TEXT,           -- For booking notifications
    
    -- Integration Type
    integration_type TEXT DEFAULT 'embed' CHECK (integration_type IN ('embed', 'redirect', 'api', 'sdk')),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    verified_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_ping_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(company_id, website_url)
);

-- =====================================================
-- 5. ENABLE RLS
-- =====================================================

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_connections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Tenant Settings - Public read for verified tenants (for white-label)
CREATE POLICY "tenant_settings_public_read" ON tenant_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "tenant_settings_company_write" ON tenant_settings
    FOR ALL TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- API Keys - Company members only
CREATE POLICY "api_keys_company_access" ON api_keys
    FOR ALL TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- API Key Usage - Company members only
CREATE POLICY "api_key_usage_company_access" ON api_key_usage
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Website Connections - Company members only
CREATE POLICY "website_connections_company_access" ON website_connections
    FOR ALL TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Platform admins can access all
CREATE POLICY "tenant_settings_platform_admin" ON tenant_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true))
    WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "api_keys_platform_admin" ON api_keys
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true))
    WITH CHECK (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid() AND is_active = true));

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Generate API Key for Website Integration
CREATE OR REPLACE FUNCTION generate_tenant_api_key(
    p_company_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_allowed_domains TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    api_key TEXT,
    key_id UUID,
    key_prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key TEXT;
    v_prefix TEXT;
    v_hash TEXT;
    v_key_id UUID;
BEGIN
    -- Generate a secure random key: vts_live_xxxxxxxxxxxxxxxxxxxx
    v_key := 'vts_live_' || encode(gen_random_bytes(24), 'hex');
    v_prefix := substring(v_key from 1 for 12) || '****';
    v_hash := encode(sha256(v_key::bytea), 'hex');
    
    -- Insert the key
    INSERT INTO api_keys (company_id, key_prefix, key_hash, name, description, allowed_domains)
    VALUES (p_company_id, v_prefix, v_hash, p_name, p_description, p_allowed_domains)
    RETURNING id INTO v_key_id;
    
    -- Return the full key (only shown once!)
    RETURN QUERY SELECT v_key, v_key_id, v_prefix;
END;
$$;

-- Validate API Key and Return Tenant Data
CREATE OR REPLACE FUNCTION validate_tenant_api_key(p_api_key TEXT, p_origin TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key_hash TEXT;
    v_api_key_record RECORD;
    v_company RECORD;
    v_tenant_settings RECORD;
    v_result JSONB;
BEGIN
    -- Hash the provided key
    v_key_hash := encode(sha256(p_api_key::bytea), 'hex');
    
    -- Find the API key
    SELECT ak.*, c.name as company_name, c.id as comp_id
    INTO v_api_key_record
    FROM api_keys ak
    JOIN companies c ON c.id = ak.company_id
    WHERE ak.key_hash = v_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
    
    IF v_api_key_record IS NULL THEN
        RETURN jsonb_build_object(
            'verified', false,
            'error', 'Invalid or expired API key'
        );
    END IF;
    
    -- Check domain whitelist if set
    IF v_api_key_record.allowed_domains IS NOT NULL AND array_length(v_api_key_record.allowed_domains, 1) > 0 THEN
        IF p_origin IS NULL OR NOT (p_origin = ANY(v_api_key_record.allowed_domains)) THEN
            RETURN jsonb_build_object(
                'verified', false,
                'error', 'Domain not authorized for this API key'
            );
        END IF;
    END IF;
    
    -- Get company details
    SELECT * INTO v_company
    FROM companies
    WHERE id = v_api_key_record.company_id;
    
    -- Get tenant settings
    SELECT * INTO v_tenant_settings
    FROM tenant_settings
    WHERE company_id = v_api_key_record.company_id;
    
    -- Update last used
    UPDATE api_keys
    SET last_used_at = now(), total_requests = total_requests + 1
    WHERE id = v_api_key_record.id;
    
    -- Log the usage
    INSERT INTO api_key_usage (api_key_id, company_id, endpoint, method, request_origin, status_code)
    VALUES (v_api_key_record.id, v_api_key_record.company_id, '/api/validate', 'POST', p_origin, 200);
    
    -- Build response
    v_result := jsonb_build_object(
        'verified', true,
        'company', jsonb_build_object(
            'id', v_company.id,
            'name', v_company.name,
            'slug', COALESCE(v_tenant_settings.slug, lower(replace(v_company.name, ' ', '-'))),
            'logo_url', v_tenant_settings.logo_url,
            'domain_url', v_tenant_settings.domain_url,
            'booking_redirect_url', v_tenant_settings.booking_redirect_url
        ),
        'branding', jsonb_build_object(
            'primary_color', COALESCE(v_tenant_settings.primary_color, '#003366'),
            'secondary_color', COALESCE(v_tenant_settings.secondary_color, '#0066cc'),
            'accent_color', COALESCE(v_tenant_settings.accent_color, '#ff6600'),
            'font_family', COALESCE(v_tenant_settings.font_family, 'Inter'),
            'theme_settings', v_tenant_settings.theme_settings
        ),
        'settings', jsonb_build_object(
            'booking_settings', v_tenant_settings.booking_settings,
            'enabled_modules', v_tenant_settings.enabled_modules,
            'timezone', COALESCE(v_tenant_settings.timezone, 'Africa/Johannesburg'),
            'currency', COALESCE(v_tenant_settings.currency, 'ZAR')
        ),
        'contact', jsonb_build_object(
            'support_email', v_tenant_settings.support_email,
            'support_phone', v_tenant_settings.support_phone,
            'business_hours', v_tenant_settings.business_hours
        ),
        'permissions', v_api_key_record.permissions
    );
    
    RETURN v_result;
END;
$$;

-- Get Tenant Public Data by Slug (for white-label booking page)
CREATE OR REPLACE FUNCTION get_tenant_public_data(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_settings RECORD;
    v_company RECORD;
    v_routes JSONB;
    v_terminals JSONB;
BEGIN
    -- Get tenant settings
    SELECT ts.*, c.name as company_name, c.id as company_id
    INTO v_tenant_settings
    FROM tenant_settings ts
    JOIN companies c ON c.id = ts.company_id
    WHERE ts.slug = p_slug AND ts.is_active = true;
    
    IF v_tenant_settings IS NULL THEN
        RETURN jsonb_build_object('error', 'Tenant not found');
    END IF;
    
    -- Get active routes for this company
    SELECT jsonb_agg(jsonb_build_object(
        'id', r.id,
        'name', r.origin || ' → ' || r.destination,
        'origin', r.origin,
        'destination', r.destination,
        'distance_km', COALESCE(r.distance_km, 0),
        'duration_hours', COALESCE(r.duration_hours, 0),
        'base_price', COALESCE(r.base_fare, 0)
    ))
    INTO v_routes
    FROM routes r
    WHERE r.company_id = v_tenant_settings.company_id AND r.is_active = true;
    
    -- Get terminals (terminals table doesn't have company_id, so get all active)
    SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'city', t.city,
        'address', t.address
    ))
    INTO v_terminals
    FROM terminals t
    WHERE t.is_active = true;
    
    RETURN jsonb_build_object(
        'company', jsonb_build_object(
            'id', v_tenant_settings.company_id,
            'name', v_tenant_settings.company_name,
            'slug', v_tenant_settings.slug,
            'logo_url', v_tenant_settings.logo_url,
            'domain_url', v_tenant_settings.domain_url
        ),
        'branding', jsonb_build_object(
            'primary_color', v_tenant_settings.primary_color,
            'secondary_color', v_tenant_settings.secondary_color,
            'accent_color', v_tenant_settings.accent_color,
            'font_family', v_tenant_settings.font_family,
            'theme_settings', v_tenant_settings.theme_settings
        ),
        'settings', jsonb_build_object(
            'booking_settings', v_tenant_settings.booking_settings,
            'enabled_modules', v_tenant_settings.enabled_modules,
            'timezone', v_tenant_settings.timezone,
            'currency', v_tenant_settings.currency,
            'business_hours', v_tenant_settings.business_hours
        ),
        'contact', jsonb_build_object(
            'support_email', v_tenant_settings.support_email,
            'support_phone', v_tenant_settings.support_phone
        ),
        'routes', COALESCE(v_routes, '[]'::jsonb),
        'terminals', COALESCE(v_terminals, '[]'::jsonb)
    );
END;
$$;

-- Register Website Connection
CREATE OR REPLACE FUNCTION register_tenant_website(
    p_api_key TEXT,
    p_website_url TEXT,
    p_return_url TEXT DEFAULT NULL,
    p_webhook_url TEXT DEFAULT NULL,
    p_integration_type TEXT DEFAULT 'embed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation JSONB;
    v_api_key_id UUID;
    v_company_id UUID;
    v_connection_id UUID;
    v_verification_token TEXT;
BEGIN
    -- Validate the API key first
    v_validation := validate_tenant_api_key(p_api_key, p_website_url);
    
    IF NOT (v_validation->>'verified')::boolean THEN
        RETURN v_validation;
    END IF;
    
    -- Get API key ID and company ID
    SELECT id, company_id INTO v_api_key_id, v_company_id
    FROM api_keys
    WHERE key_hash = encode(sha256(p_api_key::bytea), 'hex');
    
    -- Generate verification token
    v_verification_token := encode(gen_random_bytes(16), 'hex');
    
    -- Create or update connection
    INSERT INTO website_connections (
        company_id, api_key_id, website_url, return_url, webhook_url, 
        integration_type, verification_token
    )
    VALUES (
        v_company_id, v_api_key_id, p_website_url, p_return_url, p_webhook_url,
        p_integration_type, v_verification_token
    )
    ON CONFLICT (company_id, website_url) DO UPDATE SET
        api_key_id = EXCLUDED.api_key_id,
        return_url = EXCLUDED.return_url,
        webhook_url = EXCLUDED.webhook_url,
        integration_type = EXCLUDED.integration_type,
        verification_token = EXCLUDED.verification_token,
        updated_at = now()
    RETURNING id INTO v_connection_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'connection_id', v_connection_id,
        'verification_token', v_verification_token,
        'company', v_validation->'company',
        'branding', v_validation->'branding',
        'embed_code', format(
            '<script src="https://your-saas.com/sdk/booking.js" data-tenant="%s" data-api-key="%s"></script>',
            v_validation->'company'->>'slug',
            substring(p_api_key from 1 for 12) || '****'
        ),
        'booking_url', format(
            'https://your-saas.com/book/%s',
            v_validation->'company'->>'slug'
        )
    );
END;
$$;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Auto-create tenant_settings when company is created
CREATE OR REPLACE FUNCTION create_tenant_settings_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tenant_settings (company_id, slug)
    VALUES (NEW.id, lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g')))
    ON CONFLICT (company_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_tenant_settings ON companies;
CREATE TRIGGER trigger_create_tenant_settings
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_tenant_settings_for_company();

-- Updated at trigger
CREATE TRIGGER update_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_connections_updated_at
    BEFORE UPDATE ON website_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenant_settings_slug ON tenant_settings(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_company ON tenant_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_website_connections_company ON website_connections(company_id);

-- =====================================================
-- 10. GRANTS
-- =====================================================

GRANT SELECT ON tenant_settings TO anon;
GRANT ALL ON tenant_settings TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT SELECT ON api_key_usage TO authenticated;
GRANT ALL ON website_connections TO authenticated;

GRANT EXECUTE ON FUNCTION validate_tenant_api_key(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_public_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_tenant_api_key(UUID, TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION register_tenant_website(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- =====================================================
-- 11. COMMENTS
-- =====================================================

COMMENT ON TABLE tenant_settings IS 'Stores branding and configuration for each tenant (bus company)';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE api_key_usage IS 'Tracks API key usage for analytics and rate limiting';
COMMENT ON TABLE website_connections IS 'Tracks which websites are connected to which tenants';
COMMENT ON FUNCTION validate_tenant_api_key(TEXT, TEXT) IS 'Validates an API key and returns tenant data for white-label booking';
COMMENT ON FUNCTION get_tenant_public_data(TEXT) IS 'Gets public tenant data by slug for booking pages';
COMMENT ON FUNCTION generate_tenant_api_key(UUID, TEXT, TEXT, TEXT[]) IS 'Generates a new API key for a company';
COMMENT ON FUNCTION register_tenant_website(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Registers a website connection with an API key';
