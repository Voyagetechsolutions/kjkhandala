# 🎁 Loyalty Card System - Complete Guide

## Overview

A production-ready loyalty rewards system for the KJ Khandala customer mobile app. Customers automatically earn points with every booking and can redeem them for discounts.

---

## ✅ Features Implemented

### 🎯 Core Features
- ✅ **Automatic Point Earning** - Points awarded when booking payment is completed
- ✅ **Digital Loyalty Card** - Beautiful gradient card with QR code
- ✅ **Tier System** - Silver, Gold, Platinum with increasing benefits
- ✅ **Point Redemption** - Convert points to discount on next trip
- ✅ **Transaction History** - Full audit trail of earned/redeemed points
- ✅ **Progress Tracking** - Visual progress bar to next tier
- ✅ **Real-time Updates** - Pull-to-refresh for latest data

### 💎 Tier System

| Tier | Lifetime Points Required | Point Multiplier | Benefits |
|------|-------------------------|------------------|----------|
| **Silver** | 0+ | 1x | Basic rewards, Priority support |
| **Gold** | 500+ | 1.5x | Enhanced rewards, Priority boarding, 5% discount |
| **Platinum** | 2000+ | 2x | Premium rewards, VIP lounge, 10% discount, Free seat selection |

---

## 🗄️ Database Structure

### Tables Created

#### 1. `loyalty_accounts`
Tracks each customer's loyalty status.

```sql
- id (UUID, PK)
- customer_id (UUID, FK → auth.users)
- total_points (INTEGER) - Current redeemable points
- lifetime_points (INTEGER) - Total points ever earned
- tier (TEXT) - silver/gold/platinum
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. `loyalty_transactions`
Complete audit trail of all point activities.

```sql
- id (UUID, PK)
- account_id (UUID, FK → loyalty_accounts)
- type (TEXT) - earn/redeem/adjust/expire
- points (INTEGER) - Positive or negative
- description (TEXT)
- booking_id (UUID, FK → bookings)
- created_at (TIMESTAMPTZ)
```

#### 3. `loyalty_rules`
Configurable rules for points and redemption.

```sql
- id (UUID, PK)
- company_id (UUID, FK → companies) - NULL = global
- points_per_pula (NUMERIC) - Default: 10 points per P1
- redemption_rate (NUMERIC) - Default: 1 point = P0.05
- tier_rules (JSONB) - Tier thresholds and benefits
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

---

## ⚙️ How It Works

### 1. Account Creation
When a user signs up, a loyalty account is automatically created via trigger:

```sql
CREATE TRIGGER tg_create_loyalty_account
AFTER INSERT ON auth.users
EXECUTE FUNCTION create_loyalty_account_for_user();
```

### 2. Earning Points
When a booking payment is completed, points are automatically awarded:

```sql
CREATE TRIGGER tg_earn_loyalty_points
AFTER UPDATE OF payment_status ON bookings
WHEN (NEW.payment_status IN ('completed', 'paid'))
EXECUTE FUNCTION earn_loyalty_points();
```

**Point Calculation:**
```
points_earned = FLOOR(booking_amount × points_per_pula × tier_multiplier)
```

**Example:**
- Booking: P50
- Points per Pula: 10
- Tier: Gold (1.5x multiplier)
- **Points Earned: 750**

### 3. Tier Upgrades
Tiers are based on **lifetime points** (never decrease):

- **Silver**: 0 - 499 lifetime points
- **Gold**: 500 - 1,999 lifetime points  
- **Platinum**: 2,000+ lifetime points

Tier is automatically updated after each transaction.

### 4. Redeeming Points
Customers can redeem points via the app:

```typescript
const { data } = await supabase.rpc('redeem_loyalty_points', {
  p_customer_id: userId,
  p_points_to_redeem: 1000,
  p_description: 'Redeemed for discount'
});
```

**Redemption Calculation:**
```
discount_amount = points_redeemed × redemption_rate
```

**Example:**
- Points redeemed: 1000
- Redemption rate: 0.05
- **Discount: P50**

---

## 📱 Mobile App UI

### Loyalty Card Display
```tsx
<LoyaltyScreen />
```

**Components:**
1. **Digital Card** - Gradient design with tier colors
2. **QR Code** - Unique identifier for customer
3. **Points Balance** - Large, prominent display
4. **Tier Badge** - Current tier with icon
5. **Progress Bar** - Visual progress to next tier
6. **Benefits List** - Tier-specific perks
7. **Transaction History** - Recent earn/redeem activities
8. **Redeem Button** - Opens redemption modal

### Redemption Modal
- Input field for points to redeem
- Real-time discount calculation
- Validation (sufficient points)
- Success/error feedback

---

## 🚀 Deployment

### Step 1: Deploy Database Migration

Run the PowerShell script:
```powershell
cd scripts
.\deploy-loyalty-system.ps1
```

Or manually via Supabase SQL Editor:
```sql
-- Run: supabase/migrations/20251125_loyalty_system.sql
```

### Step 2: Verify Tables Created

Check in Supabase Dashboard:
- ✅ loyalty_accounts
- ✅ loyalty_transactions
- ✅ loyalty_rules
- ✅ loyalty_dashboard (view)

### Step 3: Test the System

1. **Sign up a new user** → Loyalty account auto-created
2. **Make a booking** → Pay for it
3. **Check loyalty screen** → Points should appear
4. **Try redemption** → Redeem some points
5. **View history** → See transaction log

---

## 🔒 Security (RLS Policies)

All tables have Row Level Security enabled:

### `loyalty_accounts`
```sql
-- Users can only view/update their own account
POLICY "Users can view their own loyalty account"
  ON loyalty_accounts FOR SELECT
  USING (customer_id = auth.uid());
```

### `loyalty_transactions`
```sql
-- Users can only view their own transactions
POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (account_id IN (
    SELECT id FROM loyalty_accounts WHERE customer_id = auth.uid()
  ));
```

### `loyalty_rules`
```sql
-- All authenticated users can view active rules
POLICY "Anyone can view active loyalty rules"
  ON loyalty_rules FOR SELECT
  USING (is_active = true);
```

---

## 📊 Analytics & Reporting

### Loyalty Dashboard View
Pre-built view for analytics:

```sql
SELECT * FROM loyalty_dashboard;
```

**Columns:**
- customer_id, email, customer_name
- total_points, lifetime_points, tier
- total_transactions, total_earned, total_redeemed
- points_to_next_tier, next_tier
- member_since, updated_at

---

## 🎨 Customization

### Change Point Rules

Update the `loyalty_rules` table:

```sql
UPDATE loyalty_rules
SET 
  points_per_pula = 15.00,  -- 15 points per P1
  redemption_rate = 0.10    -- 1 point = P0.10
WHERE is_active = true;
```

### Modify Tier Thresholds

Update tier rules in the migration file or via SQL:

```sql
UPDATE loyalty_rules
SET tier_rules = '{
  "silver": {"min_points": 0, "benefits": [...]},
  "gold": {"min_points": 1000, "benefits": [...]},
  "platinum": {"min_points": 5000, "benefits": [...]}
}'::jsonb
WHERE is_active = true;
```

### Change Tier Colors

Edit `LoyaltyScreen.tsx`:

```typescript
const getTierColor = (tier: string): [string, string] => {
  switch (tier.toLowerCase()) {
    case 'platinum':
      return ['#e0e7ff', '#c7d2fe']; // Purple gradient
    case 'gold':
      return ['#fef3c7', '#fde68a']; // Gold gradient
    case 'silver':
      return ['#e5e7eb', '#d1d5db']; // Gray gradient
  }
};
```

---

## 🧪 Testing Checklist

- [ ] New user signup creates loyalty account
- [ ] Booking payment triggers point earning
- [ ] Points display correctly on loyalty screen
- [ ] Tier badge shows correct tier
- [ ] Progress bar calculates correctly
- [ ] Redemption modal opens
- [ ] Points validation works
- [ ] Redemption success updates balance
- [ ] Transaction history displays
- [ ] Pull-to-refresh updates data
- [ ] QR code generates correctly
- [ ] Tier upgrade happens automatically

---

## 🐛 Troubleshooting

### Points Not Appearing

**Check:**
1. Booking payment status is 'completed' or 'paid'
2. Loyalty account exists for user
3. Trigger `tg_earn_loyalty_points` is enabled
4. Check Supabase logs for errors

### Redemption Fails

**Check:**
1. User has sufficient points
2. Function `redeem_loyalty_points` exists
3. RLS policies allow the operation
4. Network connection is stable

### Tier Not Updating

**Check:**
1. `lifetime_points` is incrementing
2. Function `update_loyalty_tier` is working
3. Tier thresholds in `loyalty_rules`

---

## 📈 Future Enhancements

### Potential Features
- 🎯 **Point Expiry** - Points expire after X months
- 🎁 **Bonus Campaigns** - Double points weekends
- 👥 **Referral Rewards** - Earn points for referrals
- 🏆 **Achievements** - Badges for milestones
- 📧 **Email Notifications** - Tier upgrades, point balance
- 🎫 **Free Tickets** - Redeem for full trip
- 🎂 **Birthday Bonus** - Extra points on birthday
- 📱 **Push Notifications** - Point earning alerts

---

## 📞 Support

For issues or questions:
- Check Supabase Dashboard logs
- Review RLS policies
- Test with Supabase SQL Editor
- Check mobile app console logs

---

## ✨ Summary

The loyalty system is **production-ready** with:
- ✅ Automatic point earning
- ✅ Tier-based rewards
- ✅ Point redemption
- ✅ Beautiful UI with QR code
- ✅ Complete transaction history
- ✅ Secure with RLS
- ✅ Fully configurable

**Ready to deploy and delight your customers!** 🎉
