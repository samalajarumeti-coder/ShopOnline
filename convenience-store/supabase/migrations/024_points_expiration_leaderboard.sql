-- Points Expiration & Leaderboard System

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS loyalty_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  points_earned INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  referrals_completed INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

-- Leaderboard Rewards Table
CREATE TABLE IF NOT EXISTS leaderboard_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  rank_from INTEGER NOT NULL,
  rank_to INTEGER NOT NULL,
  reward_points INTEGER NOT NULL,
  reward_badge TEXT,
  reward_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Leaderboard Rewards (claimed)
CREATE TABLE IF NOT EXISTS user_leaderboard_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_id UUID NOT NULL REFERENCES loyalty_leaderboard(id),
  reward_id UUID NOT NULL REFERENCES leaderboard_rewards(id),
  rank INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leaderboard_period ON loyalty_leaderboard(period, period_start, period_end);
CREATE INDEX idx_leaderboard_user ON loyalty_leaderboard(user_id);
CREATE INDEX idx_leaderboard_rank ON loyalty_leaderboard(period, rank) WHERE rank IS NOT NULL;
CREATE INDEX idx_leaderboard_rewards_period ON leaderboard_rewards(period) WHERE is_active = true;

-- RLS Policies
ALTER TABLE loyalty_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_leaderboard_rewards ENABLE ROW LEVEL SECURITY;

-- Everyone can view leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON loyalty_leaderboard FOR SELECT
  USING (true);

-- Everyone can view leaderboard rewards
CREATE POLICY "Anyone can view leaderboard rewards"
  ON leaderboard_rewards FOR SELECT
  USING (is_active = true);

-- Users can view their own leaderboard rewards
CREATE POLICY "Users can view own leaderboard rewards"
  ON user_leaderboard_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get expiring points
CREATE OR REPLACE FUNCTION get_expiring_points(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  points INTEGER,
  expires_at TIMESTAMPTZ,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.points,
    pt.expires_at,
    EXTRACT(DAY FROM pt.expires_at - NOW())::INTEGER as days_remaining
  FROM points_transactions pt
  WHERE pt.user_id = p_user_id
    AND pt.type = 'earn'
    AND pt.expires_at IS NOT NULL
    AND pt.expires_at > NOW()
    AND pt.expires_at <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM points_transactions pt2
      WHERE pt2.reference_id = pt.id
      AND pt2.type = 'expire'
    )
  ORDER BY pt.expires_at;
END;
$$;

-- Function to expire old points
CREATE OR REPLACE FUNCTION expire_old_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_record RECORD;
BEGIN
  -- Get expired points grouped by user
  FOR expired_record IN
    SELECT
      user_id,
      SUM(points) as expired_points
    FROM points_transactions
    WHERE type = 'earn'
      AND expires_at < NOW()
      AND id NOT IN (
        SELECT reference_id
        FROM points_transactions
        WHERE type = 'expire'
        AND reference_id IS NOT NULL
      )
    GROUP BY user_id
  LOOP
    -- Create expiration transaction
    INSERT INTO points_transactions (
      user_id,
      points,
      type,
      source,
      description
    ) VALUES (
      expired_record.user_id,
      -expired_record.expired_points,
      'expire',
      'manual',
      'คะแนนหมดอายุ'
    );

    -- Update user loyalty
    UPDATE user_loyalty
    SET 
      available_points = GREATEST(0, available_points - expired_record.expired_points),
      updated_at = NOW()
    WHERE user_id = expired_record.user_id;
  END LOOP;
END;
$$;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_period TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update leaderboard entries
  INSERT INTO loyalty_leaderboard (
    user_id,
    period,
    period_start,
    period_end,
    points_earned,
    challenges_completed,
    referrals_completed,
    total_score
  )
  SELECT
    ul.user_id,
    p_period,
    p_period_start,
    p_period_end,
    COALESCE(points.earned, 0) as points_earned,
    COALESCE(challenges.completed, 0) as challenges_completed,
    COALESCE(referrals.completed, 0) as referrals_completed,
    -- Total score: points + (challenges * 50) + (referrals * 100)
    COALESCE(points.earned, 0) + 
    (COALESCE(challenges.completed, 0) * 50) + 
    (COALESCE(referrals.completed, 0) * 100) as total_score
  FROM user_loyalty ul
  LEFT JOIN (
    SELECT 
      user_id,
      SUM(points) as earned
    FROM points_transactions
    WHERE type = 'earn'
      AND created_at >= p_period_start
      AND created_at < p_period_end
    GROUP BY user_id
  ) points ON points.user_id = ul.user_id
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as completed
    FROM user_challenge_progress
    WHERE completed = true
      AND completed_at >= p_period_start
      AND completed_at < p_period_end
    GROUP BY user_id
  ) challenges ON challenges.user_id = ul.user_id
  LEFT JOIN (
    SELECT
      referrer_id as user_id,
      COUNT(*) as completed
    FROM referrals
    WHERE status = 'rewarded'
      AND rewarded_at >= p_period_start
      AND rewarded_at < p_period_end
    GROUP BY referrer_id
  ) referrals ON referrals.user_id = ul.user_id
  WHERE COALESCE(points.earned, 0) > 0 
     OR COALESCE(challenges.completed, 0) > 0
     OR COALESCE(referrals.completed, 0) > 0
  ON CONFLICT (user_id, period, period_start)
  DO UPDATE SET
    points_earned = EXCLUDED.points_earned,
    challenges_completed = EXCLUDED.challenges_completed,
    referrals_completed = EXCLUDED.referrals_completed,
    total_score = EXCLUDED.total_score,
    updated_at = NOW();

  -- Update ranks
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, updated_at ASC) as new_rank
    FROM loyalty_leaderboard
    WHERE period = p_period
      AND period_start = p_period_start
  )
  UPDATE loyalty_leaderboard lb
  SET rank = ranked.new_rank
  FROM ranked
  WHERE lb.id = ranked.id;
END;
$$;

-- Function to award leaderboard rewards
CREATE OR REPLACE FUNCTION award_leaderboard_rewards(
  p_period TEXT,
  p_period_start TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  leaderboard_record RECORD;
  reward_record RECORD;
BEGIN
  -- Get top performers
  FOR leaderboard_record IN
    SELECT *
    FROM loyalty_leaderboard
    WHERE period = p_period
      AND period_start = p_period_start
      AND rank IS NOT NULL
    ORDER BY rank
  LOOP
    -- Find applicable reward
    SELECT * INTO reward_record
    FROM leaderboard_rewards
    WHERE period = p_period
      AND is_active = true
      AND rank_from <= leaderboard_record.rank
      AND rank_to >= leaderboard_record.rank
    LIMIT 1;

    IF FOUND THEN
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
        leaderboard_record.user_id,
        reward_record.reward_points,
        'earn',
        'manual',
        leaderboard_record.id,
        'leaderboard',
        'รางวัลอันดับ ' || leaderboard_record.rank || ' ประจำ' || 
        CASE p_period 
          WHEN 'weekly' THEN 'สัปดาห์'
          WHEN 'monthly' THEN 'เดือน'
        END
      );

      -- Update user loyalty
      UPDATE user_loyalty
      SET
        total_points = total_points + reward_record.reward_points,
        available_points = available_points + reward_record.reward_points,
        lifetime_points = lifetime_points + reward_record.reward_points
      WHERE user_id = leaderboard_record.user_id;

      -- Record reward claim
      INSERT INTO user_leaderboard_rewards (
        user_id,
        leaderboard_id,
        reward_id,
        rank,
        points_awarded
      ) VALUES (
        leaderboard_record.user_id,
        leaderboard_record.id,
        reward_record.id,
        leaderboard_record.rank,
        reward_record.reward_points
      );
    END IF;
  END LOOP;
END;
$$;

-- Insert default leaderboard rewards
INSERT INTO leaderboard_rewards (period, rank_from, rank_to, reward_points, reward_badge, reward_description) VALUES
-- Weekly rewards
('weekly', 1, 1, 500, '🥇', 'อันดับ 1 ประจำสัปดาห์'),
('weekly', 2, 2, 300, '🥈', 'อันดับ 2 ประจำสัปดาห์'),
('weekly', 3, 3, 200, '🥉', 'อันดับ 3 ประจำสัปดาห์'),
('weekly', 4, 10, 100, '🏆', 'Top 10 ประจำสัปดาห์'),

-- Monthly rewards
('monthly', 1, 1, 2000, '🥇', 'แชมป์ประจำเดือน'),
('monthly', 2, 2, 1500, '🥈', 'รองแชมป์ประจำเดือน'),
('monthly', 3, 3, 1000, '🥉', 'อันดับ 3 ประจำเดือน'),
('monthly', 4, 10, 500, '🏆', 'Top 10 ประจำเดือน'),
('monthly', 11, 20, 200, '⭐', 'Top 20 ประจำเดือน');
