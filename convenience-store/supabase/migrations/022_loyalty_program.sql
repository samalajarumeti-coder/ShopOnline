-- Loyalty Tiers/Levels
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  level INTEGER NOT NULL UNIQUE,
  min_points INTEGER NOT NULL,
  max_points INTEGER,
  benefits JSONB DEFAULT '[]',
  perks JSONB DEFAULT '{}',
  badge_icon TEXT,
  badge_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Loyalty Status
CREATE TABLE IF NOT EXISTS user_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_id UUID REFERENCES loyalty_tiers(id),
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  tier_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'refund')),
  source TEXT NOT NULL CHECK (source IN ('purchase', 'reward', 'referral', 'challenge', 'birthday', 'review', 'manual')),
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Rewards Catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_product', 'free_shipping', 'early_access', 'exclusive_product')),
  reward_value JSONB NOT NULL,
  stock INTEGER,
  min_tier_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  image TEXT,
  valid_days INTEGER DEFAULT 30,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Redeemed Rewards
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  code TEXT UNIQUE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Challenges
CREATE TABLE IF NOT EXISTS loyalty_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('purchase_count', 'purchase_amount', 'category_purchase', 'streak', 'referral', 'review', 'share')),
  target_value INTEGER NOT NULL,
  reward_points INTEGER NOT NULL,
  reward_badge TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT CHECK (recurrence_period IN ('daily', 'weekly', 'monthly')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES loyalty_challenges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Indexes
CREATE INDEX idx_user_loyalty_user ON user_loyalty(user_id);
CREATE INDEX idx_user_loyalty_tier ON user_loyalty(tier_id);
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_created ON points_transactions(created_at DESC);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status) WHERE status = 'active';
CREATE INDEX idx_challenge_progress_user ON user_challenge_progress(user_id);
CREATE INDEX idx_challenge_progress_challenge ON user_challenge_progress(challenge_id);

-- RLS Policies
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Everyone can view tiers
CREATE POLICY "Anyone can view loyalty tiers"
  ON loyalty_tiers FOR SELECT
  USING (true);

-- Users can view their own loyalty status
CREATE POLICY "Users can view own loyalty status"
  ON user_loyalty FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view active rewards
CREATE POLICY "Anyone can view active rewards"
  ON loyalty_rewards FOR SELECT
  USING (is_active = true);

-- Users can view their own redeemed rewards
CREATE POLICY "Users can view own rewards"
  ON user_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
  ON loyalty_challenges FOR SELECT
  USING (is_active = true);

-- Users can view their own challenge progress
CREATE POLICY "Users can view own challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Function to calculate points from order
CREATE OR REPLACE FUNCTION calculate_order_points(order_total DECIMAL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1 point per 10 baht spent
  RETURN FLOOR(order_total / 10)::INTEGER;
END;
$$;

-- Function to award points for order
CREATE OR REPLACE FUNCTION award_order_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_earned INTEGER;
  user_loyalty_record RECORD;
  bonus_multiplier DECIMAL := 1.0;
BEGIN
  -- Only award points for confirmed orders
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Calculate base points
  points_earned := calculate_order_points(NEW.total);

  -- Get user loyalty status for bonus multiplier
  SELECT * INTO user_loyalty_record
  FROM user_loyalty
  WHERE user_id = NEW.user_id;

  -- Apply tier bonus (example: Bronze 1x, Silver 1.2x, Gold 1.5x)
  IF user_loyalty_record.tier_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN level = 1 THEN 1.0
        WHEN level = 2 THEN 1.2
        WHEN level = 3 THEN 1.5
        WHEN level >= 4 THEN 2.0
        ELSE 1.0
      END INTO bonus_multiplier
    FROM loyalty_tiers
    WHERE id = user_loyalty_record.tier_id;
  END IF;

  points_earned := FLOOR(points_earned * bonus_multiplier)::INTEGER;

  -- Create points transaction
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    source,
    reference_id,
    reference_type,
    description,
    expires_at
  ) VALUES (
    NEW.user_id,
    points_earned,
    'earn',
    'purchase',
    NEW.id,
    'order',
    'คะแนนจากการสั่งซื้อ #' || NEW.id::TEXT,
    NOW() + INTERVAL '1 year'
  );

  -- Update user loyalty
  UPDATE user_loyalty
  SET 
    total_points = total_points + points_earned,
    available_points = available_points + points_earned,
    lifetime_points = lifetime_points + points_earned,
    last_purchase_date = NOW(),
    current_streak = CASE 
      WHEN last_purchase_date >= NOW() - INTERVAL '2 days' THEN current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, 
      CASE 
        WHEN last_purchase_date >= NOW() - INTERVAL '2 days' THEN current_streak + 1
        ELSE 1
      END
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Update tier if needed
  PERFORM update_user_tier(NEW.user_id);

  -- Update challenge progress
  PERFORM update_challenge_progress(NEW.user_id, 'purchase_count', 1);
  PERFORM update_challenge_progress(NEW.user_id, 'purchase_amount', NEW.total::INTEGER);

  RETURN NEW;
END;
$$;

-- Trigger to award points on order confirmation
CREATE TRIGGER award_points_on_order
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_order_points();

-- Function to update user tier
CREATE OR REPLACE FUNCTION update_user_tier(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_points INTEGER;
  new_tier_id UUID;
BEGIN
  -- Get user's total points
  SELECT total_points INTO user_points
  FROM user_loyalty
  WHERE user_id = p_user_id;

  -- Find appropriate tier
  SELECT id INTO new_tier_id
  FROM loyalty_tiers
  WHERE min_points <= user_points
    AND (max_points IS NULL OR max_points >= user_points)
  ORDER BY level DESC
  LIMIT 1;

  -- Update user's tier
  UPDATE user_loyalty
  SET 
    tier_id = new_tier_id,
    tier_expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_type TEXT,
  p_increment INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
  progress_record RECORD;
BEGIN
  -- Get active challenges of this type
  FOR challenge_record IN
    SELECT * FROM loyalty_challenges
    WHERE challenge_type = p_challenge_type
      AND is_active = true
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
  LOOP
    -- Get or create progress record
    INSERT INTO user_challenge_progress (
      user_id,
      challenge_id,
      current_value,
      period_start,
      period_end
    ) VALUES (
      p_user_id,
      challenge_record.id,
      p_increment,
      NOW(),
      CASE challenge_record.recurrence_period
        WHEN 'daily' THEN NOW() + INTERVAL '1 day'
        WHEN 'weekly' THEN NOW() + INTERVAL '1 week'
        WHEN 'monthly' THEN NOW() + INTERVAL '1 month'
        ELSE NULL
      END
    )
    ON CONFLICT (user_id, challenge_id, period_start)
    DO UPDATE SET
      current_value = user_challenge_progress.current_value + p_increment,
      updated_at = NOW();

    -- Check if challenge is completed
    SELECT * INTO progress_record
    FROM user_challenge_progress
    WHERE user_id = p_user_id
      AND challenge_id = challenge_record.id
      AND completed = false;

    IF progress_record.current_value >= challenge_record.target_value THEN
      -- Mark as completed
      UPDATE user_challenge_progress
      SET 
        completed = true,
        completed_at = NOW()
      WHERE id = progress_record.id;

      -- Award points
      INSERT INTO points_transactions (
        user_id,
        points,
        type,
        source,
        reference_id,
        reference_type,
        description
      ) VALUES (
        p_user_id,
        challenge_record.reward_points,
        'earn',
        'challenge',
        challenge_record.id,
        'challenge',
        'ทำภารกิจสำเร็จ: ' || challenge_record.name
      );

      -- Update user points
      UPDATE user_loyalty
      SET 
        total_points = total_points + challenge_record.reward_points,
        available_points = available_points + challenge_record.reward_points,
        lifetime_points = lifetime_points + challenge_record.reward_points
      WHERE user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$;

-- Function to redeem reward
CREATE OR REPLACE FUNCTION redeem_loyalty_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reward_record RECORD;
  user_loyalty_record RECORD;
  reward_code TEXT;
  new_reward_id UUID;
BEGIN
  -- Get reward details
  SELECT * INTO reward_record
  FROM loyalty_rewards
  WHERE id = p_reward_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;

  -- Get user loyalty status
  SELECT * INTO user_loyalty_record
  FROM user_loyalty
  WHERE user_id = p_user_id;

  -- Check if user has enough points
  IF user_loyalty_record.available_points < reward_record.points_cost THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Check tier requirement
  IF reward_record.min_tier_level > (
    SELECT level FROM loyalty_tiers WHERE id = user_loyalty_record.tier_id
  ) THEN
    RAISE EXCEPTION 'Tier level too low';
  END IF;

  -- Check stock
  IF reward_record.stock IS NOT NULL AND reward_record.stock <= 0 THEN
    RAISE EXCEPTION 'Reward out of stock';
  END IF;

  -- Generate unique code
  reward_code := 'LR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Create user reward
  INSERT INTO user_rewards (
    user_id,
    reward_id,
    points_spent,
    code,
    expires_at
  ) VALUES (
    p_user_id,
    p_reward_id,
    reward_record.points_cost,
    reward_code,
    NOW() + (reward_record.valid_days || ' days')::INTERVAL
  )
  RETURNING id INTO new_reward_id;

  -- Deduct points
  UPDATE user_loyalty
  SET available_points = available_points - reward_record.points_cost
  WHERE user_id = p_user_id;

  -- Create transaction
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    source,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_user_id,
    -reward_record.points_cost,
    'redeem',
    'reward',
    new_reward_id,
    'user_reward',
    'แลกของรางวัล: ' || reward_record.name
  );

  -- Update stock
  IF reward_record.stock IS NOT NULL THEN
    UPDATE loyalty_rewards
    SET stock = stock - 1
    WHERE id = p_reward_id;
  END IF;

  RETURN new_reward_id;
END;
$$;

-- Insert default tiers
INSERT INTO loyalty_tiers (name, name_en, level, min_points, max_points, benefits, badge_color) VALUES
('สมาชิกทั่วไป', 'Member', 1, 0, 999, '["รับคะแนน 1x"]', '#94a3b8'),
('สมาชิกเงิน', 'Silver', 2, 1000, 4999, '["รับคะแนน 1.2x", "ส่วนลดพิเศษ 5%"]', '#c0c0c0'),
('สมาชิกทอง', 'Gold', 3, 5000, 14999, '["รับคะแนน 1.5x", "ส่วนลดพิเศษ 10%", "Early Access Flash Sales"]', '#ffd700'),
('สมาชิกแพลทินัม', 'Platinum', 4, 15000, NULL, '["รับคะแนน 2x", "ส่วนลดพิเศษ 15%", "Early Access", "ของรางวัลพิเศษ"]', '#e5e4e2');
