-- =====================================================
-- LOYALTY SYSTEM IMPLEMENTATION
-- =====================================================
-- This migration creates a complete loyalty card system
-- for customers to earn and redeem points
-- =====================================================

-- =====================================================
-- 1. CREATE LOYALTY ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0, -- Track total points ever earned
  tier TEXT NOT NULL DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_customer_id ON loyalty_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tier ON loyalty_accounts(tier);

-- =====================================================
-- 2. CREATE LOYALTY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'adjust', 'expire')),
  points INTEGER NOT NULL, -- Positive for earn, negative for redeem
  description TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account_id ON loyalty_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);

-- =====================================================
-- 3. CREATE LOYALTY RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  points_per_pula NUMERIC(10, 2) NOT NULL DEFAULT 10.00, -- 10 points per P1 spent
  redemption_rate NUMERIC(10, 4) NOT NULL DEFAULT 0.05, -- 1 point = P0.05
  tier_rules JSONB NOT NULL DEFAULT '{
    "silver": {"min_points": 0, "benefits": ["1 point per booking", "Priority support"]},
    "gold": {"min_points": 500, "benefits": ["1.5x points", "Priority boarding", "5% discount"]},
    "platinum": {"min_points": 2000, "benefits": ["2x points", "VIP lounge access", "10% discount", "Free seat selection"]}
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default rule (company_id NULL = applies to all)
INSERT INTO loyalty_rules (company_id, points_per_pula, redemption_rate, is_active)
VALUES (NULL, 10.00, 0.05, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CREATE FUNCTION TO AUTO-CREATE LOYALTY ACCOUNT
-- =====================================================
CREATE OR REPLACE FUNCTION create_loyalty_account_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create loyalty account when user signs up
  INSERT INTO loyalty_accounts (customer_id, total_points, tier)
  VALUES (NEW.id, 0, 'silver')
  ON CONFLICT (customer_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS tg_create_loyalty_account ON auth.users;
CREATE TRIGGER tg_create_loyalty_account
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_loyalty_account_for_user();

-- =====================================================
-- 5. CREATE FUNCTION TO EARN POINTS ON BOOKING
-- =====================================================
CREATE OR REPLACE FUNCTION earn_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  account_id UUID;
  points_per_pula NUMERIC;
  current_tier TEXT;
  tier_multiplier NUMERIC := 1.0;
BEGIN
  -- Only process when payment status changes to 'completed' or 'paid'
  IF NEW.payment_status IN ('completed', 'paid') AND 
     (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('completed', 'paid')) THEN
    
    -- Get loyalty rules
    SELECT lr.points_per_pula INTO points_per_pula
    FROM loyalty_rules lr
    WHERE lr.is_active = true
    ORDER BY lr.created_at DESC
    LIMIT 1;
    
    -- Default if no rules found
    IF points_per_pula IS NULL THEN
      points_per_pula := 10.00;
    END IF;
    
    -- Get loyalty account and current tier
    SELECT la.id, la.tier INTO account_id, current_tier
    FROM loyalty_accounts la
    WHERE la.customer_id = NEW.user_id;
    
    -- Create account if it doesn't exist
    IF account_id IS NULL THEN
      INSERT INTO loyalty_accounts (customer_id, total_points, tier)
      VALUES (NEW.user_id, 0, 'silver')
      RETURNING id, tier INTO account_id, current_tier;
    END IF;
    
    -- Apply tier multiplier
    IF current_tier = 'gold' THEN
      tier_multiplier := 1.5;
    ELSIF current_tier = 'platinum' THEN
      tier_multiplier := 2.0;
    END IF;
    
    -- Calculate points (fare * points_per_pula * tier_multiplier)
    points_earned := FLOOR((NEW.total_amount * points_per_pula * tier_multiplier)::NUMERIC);
    
    -- Ensure at least 1 point is earned
    IF points_earned < 1 THEN
      points_earned := 1;
    END IF;
    
    -- Add loyalty transaction
    INSERT INTO loyalty_transactions (account_id, type, points, description, booking_id)
    VALUES (
      account_id, 
      'earn', 
      points_earned, 
      'Earned from booking ' || NEW.booking_reference,
      NEW.id
    );
    
    -- Update total points and lifetime points
    UPDATE loyalty_accounts
    SET 
      total_points = total_points + points_earned,
      lifetime_points = lifetime_points + points_earned,
      updated_at = now()
    WHERE id = account_id;
    
    -- Check and update tier
    PERFORM update_loyalty_tier(account_id);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS tg_earn_loyalty_points ON bookings;
CREATE TRIGGER tg_earn_loyalty_points
AFTER UPDATE OF payment_status ON bookings
FOR EACH ROW
EXECUTE FUNCTION earn_loyalty_points();

-- =====================================================
-- 6. CREATE FUNCTION TO UPDATE TIER BASED ON POINTS
-- =====================================================
CREATE OR REPLACE FUNCTION update_loyalty_tier(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
  current_points INTEGER;
  new_tier TEXT;
BEGIN
  -- Get current lifetime points
  SELECT lifetime_points INTO current_points
  FROM loyalty_accounts
  WHERE id = p_account_id;
  
  -- Determine tier based on lifetime points
  IF current_points >= 2000 THEN
    new_tier := 'platinum';
  ELSIF current_points >= 500 THEN
    new_tier := 'gold';
  ELSE
    new_tier := 'silver';
  END IF;
  
  -- Update tier if changed
  UPDATE loyalty_accounts
  SET tier = new_tier, updated_at = now()
  WHERE id = p_account_id AND tier != new_tier;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE FUNCTION TO REDEEM POINTS
-- =====================================================
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_customer_id UUID,
  p_points_to_redeem INTEGER,
  p_description TEXT DEFAULT 'Points redeemed for discount'
)
RETURNS JSONB AS $$
DECLARE
  v_account_id UUID;
  v_current_points INTEGER;
  v_redemption_rate NUMERIC;
  v_discount_amount NUMERIC;
BEGIN
  -- Get loyalty account
  SELECT id, total_points INTO v_account_id, v_current_points
  FROM loyalty_accounts
  WHERE customer_id = p_customer_id;
  
  -- Check if account exists
  IF v_account_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Loyalty account not found'
    );
  END IF;
  
  -- Check if enough points
  IF v_current_points < p_points_to_redeem THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'available_points', v_current_points,
      'requested_points', p_points_to_redeem
    );
  END IF;
  
  -- Get redemption rate
  SELECT redemption_rate INTO v_redemption_rate
  FROM loyalty_rules
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default redemption rate
  IF v_redemption_rate IS NULL THEN
    v_redemption_rate := 0.05;
  END IF;
  
  -- Calculate discount amount
  v_discount_amount := p_points_to_redeem * v_redemption_rate;
  
  -- Deduct points
  UPDATE loyalty_accounts
  SET total_points = total_points - p_points_to_redeem,
      updated_at = now()
  WHERE id = v_account_id;
  
  -- Add transaction record
  INSERT INTO loyalty_transactions (account_id, type, points, description)
  VALUES (v_account_id, 'redeem', -p_points_to_redeem, p_description);
  
  -- Return success with discount amount
  RETURN jsonb_build_object(
    'success', true,
    'points_redeemed', p_points_to_redeem,
    'discount_amount', v_discount_amount,
    'remaining_points', v_current_points - p_points_to_redeem
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE VIEW FOR LOYALTY DASHBOARD
-- =====================================================
CREATE OR REPLACE VIEW loyalty_dashboard AS
SELECT 
  la.id,
  la.customer_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as customer_name,
  la.total_points,
  la.lifetime_points,
  la.tier,
  la.created_at as member_since,
  la.updated_at,
  COUNT(DISTINCT lt.id) FILTER (WHERE lt.type = 'earn') as total_transactions,
  SUM(lt.points) FILTER (WHERE lt.type = 'earn') as total_earned,
  SUM(ABS(lt.points)) FILTER (WHERE lt.type = 'redeem') as total_redeemed,
  CASE 
    WHEN la.tier = 'platinum' THEN 0
    WHEN la.tier = 'gold' THEN 2000 - la.lifetime_points
    ELSE 500 - la.lifetime_points
  END as points_to_next_tier,
  CASE 
    WHEN la.tier = 'platinum' THEN 'platinum'
    WHEN la.tier = 'gold' THEN 'platinum'
    ELSE 'gold'
  END as next_tier
FROM loyalty_accounts la
JOIN auth.users u ON u.id = la.customer_id
LEFT JOIN loyalty_transactions lt ON lt.account_id = la.id
GROUP BY la.id, u.email, u.raw_user_meta_data;

-- =====================================================
-- 9. ENABLE RLS ON LOYALTY TABLES
-- =====================================================
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_accounts
DROP POLICY IF EXISTS "Users can view their own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can view their own loyalty account"
ON loyalty_accounts FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can update their own loyalty account"
ON loyalty_accounts FOR UPDATE
TO authenticated
USING (customer_id = auth.uid());

-- RLS Policies for loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view their own transactions"
ON loyalty_transactions FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM loyalty_accounts WHERE customer_id = auth.uid()
  )
);

-- RLS Policies for loyalty_rules (read-only for all)
DROP POLICY IF EXISTS "Anyone can view active loyalty rules" ON loyalty_rules;
CREATE POLICY "Anyone can view active loyalty rules"
ON loyalty_rules FOR SELECT
TO authenticated
USING (is_active = true);

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON loyalty_accounts TO authenticated;
GRANT SELECT, INSERT ON loyalty_transactions TO authenticated;
GRANT SELECT ON loyalty_rules TO authenticated;
GRANT SELECT ON loyalty_dashboard TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Created loyalty_accounts table
-- ✅ Created loyalty_transactions table  
-- ✅ Created loyalty_rules table
-- ✅ Auto-create loyalty account on user signup
-- ✅ Auto-earn points when booking is paid
-- ✅ Tier system (Silver, Gold, Platinum)
-- ✅ Tier multipliers (1x, 1.5x, 2x)
-- ✅ Redeem points function
-- ✅ Dashboard view
-- ✅ RLS policies enabled
-- =====================================================
