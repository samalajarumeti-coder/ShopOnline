-- Migration: Subscription Tier System
-- ระบบระดับสมาชิก Subscription (Bronze/Silver/Gold/Platinum)

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  min_spending DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_bonus DECIMAL(5,2) NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#CD7F32',
  icon VARCHAR(50) DEFAULT 'award',
  benefits JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_tiers_users table (user's current tier)
CREATE TABLE IF NOT EXISTS subscription_tiers_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  total_spending DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  tier_achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create tier_history table (track tier changes)
CREATE TABLE IF NOT EXISTS subscription_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier_id UUID REFERENCES subscription_tiers(id),
  to_tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tiers (name, display_name, min_spending, discount_bonus, color, icon, benefits, sort_order) VALUES
('bronze', 'Bronze', 0, 0, '#CD7F32', 'award', '["ส่วนลดพื้นฐาน 5%", "แจ้งเตือนก่อนจัดส่ง"]', 1),
('silver', 'Silver', 2000, 2, '#C0C0C0', 'medal', '["ส่วนลดเพิ่ม 2%", "จัดส่งฟรีเมื่อซื้อครบ 150 บาท", "สิทธิ์ซื้อสินค้าพิเศษ"]', 2),
('gold', 'Gold', 5000, 5, '#FFD700', 'crown', '["ส่วนลดเพิ่ม 5%", "จัดส่งฟรีทุกออเดอร์", "สิทธิ์ซื้อสินค้าพิเศษ", "Customer Support ลัดคิว"]', 3),
('platinum', 'Platinum', 10000, 8, '#E5E4E2', 'gem', '["ส่วนลดเพิ่ม 8%", "จัดส่งฟรีทุกออเดอร์", "สินค้า Exclusive", "Personal Shopper", "Birthday Bonus"]', 4)
ON CONFLICT (name) DO NOTHING;

-- Function to get user's tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TABLE (
  tier_id UUID,
  tier_name VARCHAR,
  display_name VARCHAR,
  discount_bonus DECIMAL,
  color VARCHAR,
  icon VARCHAR,
  benefits JSONB,
  total_spending DECIMAL,
  next_tier_name VARCHAR,
  next_tier_spending DECIMAL,
  progress_percent DECIMAL
) AS $$
DECLARE
  v_current_tier RECORD;
  v_next_tier RECORD;
  v_user_tier RECORD;
BEGIN
  -- Get user's tier info
  SELECT stu.*, st.*
  INTO v_user_tier
  FROM subscription_tiers_users stu
  JOIN subscription_tiers st ON st.id = stu.tier_id
  WHERE stu.user_id = p_user_id;

  -- If no tier, assign Bronze
  IF v_user_tier IS NULL THEN
    SELECT * INTO v_current_tier FROM subscription_tiers WHERE name = 'bronze';
    
    INSERT INTO subscription_tiers_users (user_id, tier_id, total_spending)
    VALUES (p_user_id, v_current_tier.id, 0);
    
    v_user_tier.total_spending := 0;
    v_user_tier.tier_id := v_current_tier.id;
  ELSE
    SELECT * INTO v_current_tier FROM subscription_tiers WHERE id = v_user_tier.tier_id;
  END IF;

  -- Get next tier
  SELECT * INTO v_next_tier
  FROM subscription_tiers
  WHERE min_spending > COALESCE(v_user_tier.total_spending, 0)
  AND is_active = true
  ORDER BY min_spending ASC
  LIMIT 1;

  RETURN QUERY SELECT
    v_current_tier.id,
    v_current_tier.name,
    v_current_tier.display_name,
    v_current_tier.discount_bonus,
    v_current_tier.color,
    v_current_tier.icon,
    v_current_tier.benefits,
    COALESCE(v_user_tier.total_spending, 0::DECIMAL),
    v_next_tier.display_name,
    v_next_tier.min_spending,
    CASE 
      WHEN v_next_tier.min_spending IS NULL THEN 100
      ELSE LEAST(100, (COALESCE(v_user_tier.total_spending, 0) / v_next_tier.min_spending) * 100)
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update user tier after order
CREATE OR REPLACE FUNCTION update_subscription_tier()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total_spending DECIMAL;
  v_new_tier_id UUID;
  v_current_tier_id UUID;
BEGIN
  -- Get user_id from subscription
  SELECT user_id INTO v_user_id
  FROM subscriptions
  WHERE id = NEW.subscription_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate total spending from subscription orders
  SELECT COALESCE(SUM(final_total), 0) INTO v_total_spending
  FROM subscription_orders so
  JOIN subscriptions s ON s.id = so.subscription_id
  WHERE s.user_id = v_user_id
  AND so.status = 'created';

  -- Get appropriate tier
  SELECT id INTO v_new_tier_id
  FROM subscription_tiers
  WHERE min_spending <= v_total_spending
  AND is_active = true
  ORDER BY min_spending DESC
  LIMIT 1;

  -- Get current tier
  SELECT tier_id INTO v_current_tier_id
  FROM subscription_tiers_users
  WHERE user_id = v_user_id;

  -- Update or insert user tier
  INSERT INTO subscription_tiers_users (user_id, tier_id, total_spending, orders_count)
  VALUES (v_user_id, COALESCE(v_new_tier_id, (SELECT id FROM subscription_tiers WHERE name = 'bronze')), v_total_spending, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    tier_id = COALESCE(v_new_tier_id, subscription_tiers_users.tier_id),
    total_spending = v_total_spending,
    orders_count = subscription_tiers_users.orders_count + 1,
    tier_achieved_at = CASE 
      WHEN v_new_tier_id != subscription_tiers_users.tier_id THEN NOW()
      ELSE subscription_tiers_users.tier_achieved_at
    END,
    updated_at = NOW();

  -- Record tier change if upgraded
  IF v_current_tier_id IS NOT NULL AND v_new_tier_id != v_current_tier_id THEN
    INSERT INTO subscription_tier_history (user_id, from_tier_id, to_tier_id, reason)
    VALUES (v_user_id, v_current_tier_id, v_new_tier_id, 'Auto upgrade from spending');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tier update
DROP TRIGGER IF EXISTS trigger_update_subscription_tier ON subscription_orders;
CREATE TRIGGER trigger_update_subscription_tier
AFTER INSERT ON subscription_orders
FOR EACH ROW
WHEN (NEW.status = 'created')
EXECUTE FUNCTION update_subscription_tier();

-- RLS Policies
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tier_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view tiers
CREATE POLICY "Anyone can view tiers"
ON subscription_tiers FOR SELECT
TO authenticated
USING (is_active = true);

-- Users can view their own tier
CREATE POLICY "Users can view own tier"
ON subscription_tiers_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can view their tier history
CREATE POLICY "Users can view own tier history"
ON subscription_tier_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can manage tiers
CREATE POLICY "Admin can manage tiers"
ON subscription_tiers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_users_user ON subscription_tiers_users(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_users_tier ON subscription_tiers_users(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tier_history_user ON subscription_tier_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_spending ON subscription_tiers(min_spending);

-- Comments
COMMENT ON TABLE subscription_tiers IS 'Subscription membership tiers (Bronze/Silver/Gold/Platinum)';
COMMENT ON TABLE subscription_tiers_users IS 'User current subscription tier';
COMMENT ON TABLE subscription_tier_history IS 'History of tier changes';
