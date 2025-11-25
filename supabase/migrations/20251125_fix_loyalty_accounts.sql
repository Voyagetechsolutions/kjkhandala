-- =====================================================
-- Fix Loyalty Accounts for Existing Users
-- =====================================================
-- Creates loyalty accounts for users who signed up
-- before the loyalty system was implemented
-- =====================================================

-- =====================================================
-- 1. CREATE LOYALTY ACCOUNTS FOR EXISTING USERS
-- =====================================================

INSERT INTO loyalty_accounts (customer_id, total_points, lifetime_points, tier)
SELECT 
  u.id,
  0,
  0,
  'silver'
FROM auth.users u
LEFT JOIN loyalty_accounts la ON la.customer_id = u.id
WHERE la.id IS NULL
ON CONFLICT (customer_id) DO NOTHING;

-- =====================================================
-- 2. FIX LOYALTY DASHBOARD VIEW
-- =====================================================
-- Ensure the view properly joins with auth.users

CREATE OR REPLACE VIEW loyalty_dashboard AS
SELECT 
  la.id AS account_id,
  la.customer_id,
  u.email,
  u.raw_user_meta_data->>'full_name' AS customer_name,
  la.total_points,
  la.lifetime_points,
  la.tier,
  la.created_at AS member_since,
  la.updated_at,
  
  -- Transaction summary
  COUNT(lt.id) AS total_transactions,
  COALESCE(SUM(lt.points) FILTER (WHERE lt.type = 'earn'), 0) AS total_earned,
  COALESCE(SUM(ABS(lt.points)) FILTER (WHERE lt.type = 'redeem'), 0) AS total_redeemed,
  
  -- Tier progress
  CASE 
    WHEN la.tier = 'silver' THEN 500 - la.lifetime_points
    WHEN la.tier = 'gold' THEN 2000 - la.lifetime_points
    ELSE 0
  END AS points_to_next_tier,
  
  CASE 
    WHEN la.tier = 'silver' THEN 'gold'
    WHEN la.tier = 'gold' THEN 'platinum'
    ELSE 'platinum'
  END AS next_tier

FROM loyalty_accounts la
INNER JOIN auth.users u ON u.id = la.customer_id
LEFT JOIN loyalty_transactions lt ON lt.account_id = la.id
GROUP BY la.id, la.customer_id, u.email, u.raw_user_meta_data, 
         la.total_points, la.lifetime_points, la.tier, la.created_at, la.updated_at;

-- =====================================================
-- 3. CREATE HELPER FUNCTION: Get or Create Loyalty Account
-- =====================================================
-- Ensures a loyalty account exists for a user

CREATE OR REPLACE FUNCTION get_or_create_loyalty_account(p_customer_id UUID)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Try to get existing account
  SELECT id INTO v_account_id
  FROM loyalty_accounts
  WHERE customer_id = p_customer_id;
  
  -- If not found, create it
  IF v_account_id IS NULL THEN
    INSERT INTO loyalty_accounts (customer_id, total_points, lifetime_points, tier)
    VALUES (p_customer_id, 0, 0, 'silver')
    RETURNING id INTO v_account_id;
  END IF;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. UPDATE EARN POINTS FUNCTION TO AUTO-CREATE ACCOUNT
-- =====================================================

CREATE OR REPLACE FUNCTION earn_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  account_id UUID;
  points_earned INTEGER;
  points_per_pula NUMERIC;
  tier_multiplier NUMERIC := 1.0;
  current_tier TEXT;
BEGIN
  -- Only process if payment is completed
  IF NEW.payment_status NOT IN ('completed', 'paid') THEN
    RETURN NEW;
  END IF;
  
  -- Skip if already processed
  IF EXISTS (
    SELECT 1 FROM loyalty_transactions 
    WHERE booking_id = NEW.id AND type = 'earn'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Skip if no user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get or create loyalty account
  account_id := get_or_create_loyalty_account(NEW.user_id);
  
  -- Get current tier
  SELECT tier INTO current_tier
  FROM loyalty_accounts
  WHERE id = account_id;
  
  -- Get points per pula from rules
  SELECT lr.points_per_pula INTO points_per_pula
  FROM loyalty_rules lr
  WHERE lr.is_active = true
  ORDER BY lr.created_at DESC
  LIMIT 1;
  
  -- Default if no rule found
  IF points_per_pula IS NULL THEN
    points_per_pula := 10.0;
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
  
  -- Update tier if needed
  PERFORM update_loyalty_tier(account_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_or_create_loyalty_account(UUID) TO authenticated, anon;
GRANT SELECT ON loyalty_dashboard TO authenticated, anon;

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Created loyalty accounts for all existing users
-- ✅ Fixed loyalty_dashboard view to properly join with auth.users
-- ✅ Created get_or_create_loyalty_account helper function
-- ✅ Updated earn_loyalty_points to auto-create accounts
-- ✅ Granted necessary permissions
--
-- RESULT: All users now have loyalty accounts and
--         the loyalty screen will display data correctly!
-- =====================================================
