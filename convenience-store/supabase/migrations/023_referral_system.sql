-- Referral System Migration

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  referrer_reward_points INTEGER DEFAULT 100,
  referred_reward_points INTEGER DEFAULT 50,
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Indexes
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code) WHERE is_active = true;
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral code
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own referral code
CREATE POLICY "Users can create own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view referrals they made or received
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 6));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_points INTEGER := 100;
  v_referred_points INTEGER := 50;
BEGIN
  -- Get referrer
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;
  
  -- Check if user already used a referral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RAISE EXCEPTION 'User already used a referral code';
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    referrer_reward_points,
    referred_reward_points
  ) VALUES (
    v_referrer_id,
    p_referred_id,
    p_referral_code,
    v_referrer_points,
    v_referred_points
  );
  
  -- Update code usage
  UPDATE referral_codes
  SET uses_count = uses_count + 1
  WHERE code = p_referral_code;
  
  -- Award points to referred user immediately
  INSERT INTO points_transactions (
    user_id,
    points,
    type,
    source,
    description
  ) VALUES (
    p_referred_id,
    v_referred_points,
    'earn',
    'referral',
    'คะแนนต้อนรับจากการสมัครผ่านเพื่อน'
  );
  
  -- Ensure user_loyalty record exists
  INSERT INTO user_loyalty (user_id, total_points, available_points, lifetime_points)
  VALUES (p_referred_id, v_referred_points, v_referred_points, v_referred_points)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_loyalty.total_points + v_referred_points,
    available_points = user_loyalty.available_points + v_referred_points,
    lifetime_points = user_loyalty.lifetime_points + v_referred_points;
END;
$$;

-- Trigger to award referrer when referred makes first purchase
CREATE OR REPLACE FUNCTION award_referrer_on_first_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Check if this is first confirmed order
  IF NEW.status = 'confirmed' AND NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND status = 'confirmed'
  ) THEN
    -- Get pending referral
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_id = NEW.user_id
    AND status = 'pending';
    
    IF FOUND THEN
      -- Award points to referrer
      INSERT INTO points_transactions (
        user_id,
        points,
        type,
        source,
        reference_id,
        reference_type,
        description
      ) VALUES (
        v_referral.referrer_id,
        v_referral.referrer_reward_points,
        'earn',
        'referral',
        v_referral.id,
        'referral',
        'คะแนนจากการชวนเพื่อน'
      );
      
      -- Ensure referrer has user_loyalty record
      INSERT INTO user_loyalty (user_id, total_points, available_points, lifetime_points)
      VALUES (
        v_referral.referrer_id, 
        v_referral.referrer_reward_points, 
        v_referral.referrer_reward_points, 
        v_referral.referrer_reward_points
      )
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_loyalty.total_points + v_referral.referrer_reward_points,
        available_points = user_loyalty.available_points + v_referral.referrer_reward_points,
        lifetime_points = user_loyalty.lifetime_points + v_referral.referrer_reward_points;
      
      -- Update referral status
      UPDATE referrals
      SET 
        status = 'rewarded',
        completed_at = NOW(),
        rewarded_at = NOW()
      WHERE id = v_referral.id;
      
      -- Update challenge progress for referrer
      PERFORM update_challenge_progress(v_referral.referrer_id, 'referral', 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS award_referrer_trigger ON orders;
CREATE TRIGGER award_referrer_trigger
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_referrer_on_first_purchase();
