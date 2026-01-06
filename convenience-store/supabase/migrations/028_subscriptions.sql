-- Subscription System for Auto-ordering
-- ระบบสมัครสมาชิกสำหรับสั่งซื้ออัตโนมัติ

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'รายการสั่งซื้อประจำ',
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  next_delivery_date DATE NOT NULL,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  is_active BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false, -- Auto confirm or wait for user
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription items
CREATE TABLE IF NOT EXISTS subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, product_id)
);

-- Subscription history (orders created from subscriptions)
CREATE TABLE IF NOT EXISTS subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'created', 'skipped', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery ON subscriptions(next_delivery_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription ON subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_subscription ON subscription_orders(subscription_id);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_orders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription items policies
CREATE POLICY "Users can view own subscription items"
  ON subscription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_items.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own subscription items"
  ON subscription_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_items.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

-- Subscription orders policies
CREATE POLICY "Users can view own subscription orders"
  ON subscription_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_orders.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

-- Function to calculate next delivery date
CREATE OR REPLACE FUNCTION calculate_next_delivery_date(
  current_date DATE,
  frequency VARCHAR(20)
) RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN RETURN current_date + INTERVAL '7 days';
    WHEN 'biweekly' THEN RETURN current_date + INTERVAL '14 days';
    WHEN 'monthly' THEN RETURN current_date + INTERVAL '1 month';
    ELSE RETURN current_date + INTERVAL '7 days';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to process subscription (create order)
CREATE OR REPLACE FUNCTION process_subscription(p_subscription_id UUID)
RETURNS JSON AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_order_id UUID;
  v_subtotal DECIMAL(10,2) := 0;
  v_delivery_fee DECIMAL(10,2);
  v_total DECIMAL(10,2);
  v_item RECORD;
  v_product products%ROWTYPE;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription FROM subscriptions WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Subscription not found');
  END IF;
  
  IF NOT v_subscription.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Subscription is not active');
  END IF;
  
  -- Calculate subtotal
  FOR v_item IN 
    SELECT si.*, p.price, p.is_active, p.stock
    FROM subscription_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.subscription_id = p_subscription_id
  LOOP
    IF NOT v_item.is_active THEN
      CONTINUE; -- Skip inactive products
    END IF;
    v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
  END LOOP;
  
  IF v_subtotal = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No valid items in subscription');
  END IF;
  
  -- Calculate delivery fee
  v_delivery_fee := CASE WHEN v_subtotal >= 200 THEN 0 ELSE 30 END;
  v_total := v_subtotal + v_delivery_fee;
  
  -- Create order
  INSERT INTO orders (
    user_id, address_id, subtotal, delivery_fee, discount, total,
    payment_method, notes, status
  ) VALUES (
    v_subscription.user_id,
    v_subscription.address_id,
    v_subtotal,
    v_delivery_fee,
    0,
    v_total,
    v_subscription.payment_method,
    'สั่งซื้ออัตโนมัติจาก: ' || v_subscription.name,
    CASE WHEN v_subscription.auto_confirm THEN 'confirmed' ELSE 'pending' END
  ) RETURNING id INTO v_order_id;
  
  -- Create order items
  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
  SELECT 
    v_order_id,
    si.product_id,
    p.name,
    p.price,
    si.quantity,
    p.price * si.quantity
  FROM subscription_items si
  JOIN products p ON p.id = si.product_id
  WHERE si.subscription_id = p_subscription_id
  AND p.is_active = true;
  
  -- Record subscription order
  INSERT INTO subscription_orders (subscription_id, order_id, scheduled_date, status)
  VALUES (p_subscription_id, v_order_id, v_subscription.next_delivery_date, 'created');
  
  -- Update next delivery date
  UPDATE subscriptions
  SET next_delivery_date = calculate_next_delivery_date(next_delivery_date, frequency),
      updated_at = NOW()
  WHERE id = p_subscription_id;
  
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_delivery_date(DATE, VARCHAR) TO authenticated;
