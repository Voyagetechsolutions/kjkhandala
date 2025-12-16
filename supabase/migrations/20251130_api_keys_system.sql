-- ============================================
-- API KEYS SYSTEM FOR VOYAGE VTS SAAS
-- ============================================
-- This migration creates API key management for tenants
-- Supports both public keys (for widgets) and secret keys (for backend APIs)

-- ============================================
-- PART 1: API Keys Table
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_type VARCHAR(20) NOT NULL CHECK (key_type IN ('public', 'secret')),
  key_prefix VARCHAR(10) NOT NULL, -- 'pk_live', 'pk_test', 'sk_live', 'sk_test'
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
  key_display VARCHAR(20) NOT NULL, -- Last 4 chars for display: sk_live_****abc123
  name VARCHAR(255), -- Optional name for the key
  description TEXT,
  scopes JSONB DEFAULT '[]'::jsonb, -- Permissions: ['read:trips', 'write:bookings', etc.]
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('test', 'production')),
  
  -- Rate limiting
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_hour INT DEFAULT 3600,
  rate_limit_per_day INT DEFAULT 100000,
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count BIGINT DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  revoked_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at);

-- ============================================
-- PART 2: API Usage Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT,
  response_time_ms INT,
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by month for better performance
-- CREATE TABLE api_usage_logs_y2025m12 PARTITION OF api_usage_logs 
--   FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Indexes
CREATE INDEX idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- ============================================
-- PART 3: API Key Generation Function
-- ============================================

CREATE OR REPLACE FUNCTION generate_api_key(
  p_tenant_id UUID,
  p_key_type VARCHAR,
  p_environment VARCHAR DEFAULT 'production',
  p_name VARCHAR DEFAULT NULL,
  p_scopes JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  api_key_id UUID,
  api_key TEXT,
  key_display VARCHAR
) AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_random_part TEXT;
  v_full_key TEXT;
  v_key_hash TEXT;
  v_display VARCHAR(20);
  v_new_key_id UUID;
BEGIN
  -- Determine prefix based on type and environment
  IF p_key_type = 'public' THEN
    v_prefix := CASE WHEN p_environment = 'test' THEN 'pk_test_' ELSE 'pk_live_' END;
  ELSE
    v_prefix := CASE WHEN p_environment = 'test' THEN 'sk_test_' ELSE 'sk_live_' END;
  END IF;
  
  -- Generate random 32-character string
  v_random_part := encode(gen_random_bytes(24), 'base64');
  v_random_part := replace(replace(replace(v_random_part, '/', ''), '+', ''), '=', '');
  v_random_part := substring(v_random_part, 1, 32);
  
  -- Create full key
  v_full_key := v_prefix || v_random_part;
  
  -- Hash the key for storage
  v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
  
  -- Create display version (last 8 characters)
  v_display := v_prefix || '****' || substring(v_random_part, 25, 8);
  
  -- Insert into database
  INSERT INTO api_keys (
    tenant_id,
    key_type,
    key_prefix,
    key_hash,
    key_display,
    name,
    scopes,
    environment,
    created_by
  ) VALUES (
    p_tenant_id,
    p_key_type,
    v_prefix,
    v_key_hash,
    v_display,
    p_name,
    p_scopes,
    p_environment,
    auth.uid()
  ) RETURNING id INTO v_new_key_id;
  
  -- Return the key (only shown once!)
  RETURN QUERY SELECT 
    v_new_key_id,
    v_full_key,
    v_display;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: API Key Validation Function
-- ============================================

CREATE OR REPLACE FUNCTION validate_api_key(p_api_key TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  tenant_id UUID,
  key_type VARCHAR,
  scopes JSONB,
  rate_limit_per_minute INT
) AS $$
DECLARE
  v_key_hash TEXT;
  v_key_record RECORD;
BEGIN
  -- Hash the provided key
  v_key_hash := encode(digest(p_api_key, 'sha256'), 'hex');
  
  -- Look up the key
  SELECT 
    k.*,
    t.status as tenant_status
  INTO v_key_record
  FROM api_keys k
  JOIN tenants t ON t.id = k.tenant_id
  WHERE k.key_hash = v_key_hash;
  
  -- Check if key exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::INT;
    RETURN;
  END IF;
  
  -- Check if key is active
  IF v_key_record.status != 'active' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::INT;
    RETURN;
  END IF;
  
  -- Check if tenant is active
  IF v_key_record.tenant_status != 'active' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::INT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::JSONB, NULL::INT;
    RETURN;
  END IF;
  
  -- Update usage stats
  UPDATE api_keys 
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1
  WHERE id = v_key_record.id;
  
  -- Return success with key details
  RETURN QUERY SELECT 
    TRUE,
    v_key_record.tenant_id,
    v_key_record.key_type,
    v_key_record.scopes,
    v_key_record.rate_limit_per_minute;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Revoke API Key Function
-- ============================================

CREATE OR REPLACE FUNCTION revoke_api_key(
  p_key_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE api_keys
  SET 
    status = 'revoked',
    revoked_by = auth.uid(),
    revoked_at = NOW(),
    revoked_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_key_id
  AND tenant_id = get_user_tenant_id();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: RLS Policies
-- ============================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their tenant's API keys"
  ON api_keys FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id() 
    AND (has_tenant_role('TENANT_ADMIN') OR has_tenant_role('SUPER_ADMIN'))
  );

CREATE POLICY "Tenant admins can update API keys"
  ON api_keys FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id() 
    AND (has_tenant_role('TENANT_ADMIN') OR has_tenant_role('SUPER_ADMIN'))
  );

-- API Usage Logs policies
CREATE POLICY "Users can view their tenant's API usage"
  ON api_usage_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- ============================================
-- PART 7: Create Default API Keys for KJ Khandala
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_result RECORD;
BEGIN
  -- Get KJ Khandala tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'kj-khandala' LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    -- Generate public test key
    SELECT * INTO v_result FROM generate_api_key(
      v_tenant_id,
      'public',
      'test',
      'Test Widget Key',
      '["read:trips", "write:bookings"]'::jsonb
    );
    
    RAISE NOTICE 'Public Test Key Created: %', v_result.api_key;
    
    -- Generate public live key
    SELECT * INTO v_result FROM generate_api_key(
      v_tenant_id,
      'public',
      'production',
      'Production Widget Key',
      '["read:trips", "write:bookings"]'::jsonb
    );
    
    RAISE NOTICE 'Public Live Key Created: %', v_result.api_key;
    
    -- Generate secret test key
    SELECT * INTO v_result FROM generate_api_key(
      v_tenant_id,
      'secret',
      'test',
      'Test Backend Key',
      '["read:*", "write:*", "delete:bookings"]'::jsonb
    );
    
    RAISE NOTICE 'Secret Test Key Created: %', v_result.api_key;
  END IF;
END $$;

-- ============================================
-- PART 8: Audit Trail
-- ============================================

COMMENT ON TABLE api_keys IS 'API keys for tenant applications to access the Voyage API';
COMMENT ON TABLE api_usage_logs IS 'Logs all API requests for monitoring and billing';
COMMENT ON FUNCTION generate_api_key IS 'Generates a new API key for a tenant';
COMMENT ON FUNCTION validate_api_key IS 'Validates an API key and returns tenant context';
COMMENT ON FUNCTION revoke_api_key IS 'Revokes an API key';
