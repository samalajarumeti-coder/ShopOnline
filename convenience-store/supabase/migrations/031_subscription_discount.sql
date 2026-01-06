-- Migration: Subscription Discount System
-- ระบบส่วนลดสำหรับ Subscription Orders (ลด 5% อัตโนมัติ)

-- Add discount columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS discount_enabled BOOLEAN DEFAULT true;

-- Add discount tracking to subscription_orders
ALTER TABLE subscription_orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS final_total DECIMAL(10,2);

-- Create subscription_discount_settings table for admin configuration
CREATE TABLE IF NOT EXISTS subscription_discount_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_discount_percent DECIMAL(5,2) DEFAULT 5.00,
  min_subscription_days INTEGER DEFAULT 0, -- Minimum days subscribed to get discount
  max_discount_percent DECIMAL(5,2) DEFAULT 15.00, -- Maximum discount allowed
  loyalty_bonus_enabled BOOLEAN DEFAULT true, -- Extra discount for loyal subscribers
  loyalty_bonus_percent DECIMAL(5,2) DEFAULT 2.00, -- Extra % per month subscribed (max 3 months)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO subscription_discount_settings (
  default_discount_percent,
  min_subscription_days,
  max_discount_percent,
  loyalty_bonus_enabled,
  loyalty_bonus_percent
) VALUES (5.00, 0, 15.00, true, 2.00)
ON CONFLICT DO NOTHING;

-- Function to calculate subscription discount
CREATE OR REPLACE FUNCTION calculate_subscription_discount(
  p_subscription_id UUID,
  p_subtotal DECIMAL
)
RETURNS TABLE (
  discount_percent DECIMAL,
  discount_amount DECIMAL,
  final_total DECIMAL,
  discount_breakdown JSONB
) AS $$
DECLARE
  v_subscription RECORD;
  v_settings RECORD;
  v_base_discount DECIMAL;
  v_loyalty_bonus DECIMAL := 0;
  v_total_discount DECIMAL;
  v_months_subscribed INTEGER;
  v_breakdown JSONB;
BEGIN
  -- Get subscription details
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  -- Get discount settings
  SELECT * INTO v_settings
  FROM subscription_discount_settings
  LIMIT 1;
  
  -- Check if discount is enabled for this subscription
  IF NOT v_subscription.discount_enabled THEN
    RETURN QUERY SELECT 
      0::DECIMAL,
      0::DECIMAL,
      p_subtotal,
      '{"reason": "discount_disabled"}'::JSONB;
    RETURN;
  END IF;
  
  -- Calculate base discount
  v_base_discount := COALESCE(v_subscription.discount_percent, v_settings.default_discount_percent);
  
  -- Calculate loyalty bonus if enabled
  IF v_settings.loyalty_bonus_enabled THEN
    v_months_subscribed := EXTRACT(MONTH FROM AGE(NOW(), v_subscription.created_at))::INTEGER;
    v_months_subscribed := LEAST(v_months_subscribed, 3); -- Cap at 3 months
    v_loyalty_bonus := v_months_subscribed * v_settings.loyalty_bonus_percent;
  END IF;
  
  -- Calculate total discount (capped at max)
  v_total_discount := LEAST(v_base_discount + v_loyalty_bonus, v_settings.max_discount_percent);
  
  -- Build breakdown
  v_breakdown := jsonb_build_object(
    'base_discount', v_base_discount,
    'loyalty_bonus', v_loyalty_bonus,
    'months_subscribed', v_months_subscribed,
    'total_discount', v_total_discount,
    'max_discount', v_settings.max_discount_percent
  );
  
  RETURN QUERY SELECT 
    v_total_discount,
    ROUND(p_subtotal * v_total_discount / 100, 2),
    ROUND(p_subtotal * (1 - v_total_discount / 100), 2),
    v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE subscription_discount_settings ENABLE ROW LEVEL SECURITY;

-- Admin can manage discount settings
CREATE POLICY "Admin can manage discount settings"
ON subscription_discount_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Users can view discount settings (for display purposes)
CREATE POLICY "Users can view discount settings"
ON subscription_discount_settings
FOR SELECT
TO authenticated
USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_discount_enabled 
ON subscriptions(discount_enabled) WHERE discount_enabled = true;

-- Comment
COMMENT ON TABLE subscription_discount_settings IS 'Global settings for subscription discount system';
COMMENT ON FUNCTION calculate_subscription_discount IS 'Calculate discount for a subscription order including loyalty bonus';
