-- Migration: Order Tracking System
-- ระบบ Tracking ID และติดตามสถานะ Order

-- Add tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivering_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Create order_tracking_history table for detailed tracking
CREATE TABLE IF NOT EXISTS order_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sequence for tracking ID
CREATE SEQUENCE IF NOT EXISTS tracking_id_seq START 1000;

-- Function to generate tracking ID
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_date_part VARCHAR(8);
  v_seq_part VARCHAR(6);
  v_tracking_id VARCHAR(20);
BEGIN
  -- Format: TRK-YYYYMMDD-XXXXXX
  v_date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  v_seq_part := LPAD(nextval('tracking_id_seq')::TEXT, 6, '0');
  v_tracking_id := 'TRK-' || v_date_part || '-' || v_seq_part;
  RETURN v_tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking ID on order creation
CREATE OR REPLACE FUNCTION set_order_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_id IS NULL THEN
    NEW.tracking_id := generate_tracking_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tracking_id ON orders;
CREATE TRIGGER trigger_set_tracking_id
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_tracking_id();

-- Function to update order status with timestamp
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id INTEGER,
  p_status VARCHAR,
  p_notes TEXT DEFAULT NULL,
  p_driver_name VARCHAR DEFAULT NULL,
  p_driver_phone VARCHAR DEFAULT NULL,
  p_location VARCHAR DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_result JSONB;
BEGIN
  -- Get current order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Update order status and timestamp
  UPDATE orders SET
    status = p_status,
    confirmed_at = CASE WHEN p_status = 'confirmed' AND confirmed_at IS NULL THEN NOW() ELSE confirmed_at END,
    preparing_at = CASE WHEN p_status = 'preparing' AND preparing_at IS NULL THEN NOW() ELSE preparing_at END,
    delivering_at = CASE WHEN p_status = 'delivering' AND delivering_at IS NULL THEN NOW() ELSE delivering_at END,
    completed_at = CASE WHEN p_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
    cancel_reason = CASE WHEN p_status = 'cancelled' THEN COALESCE(p_notes, cancel_reason) ELSE cancel_reason END,
    actual_delivery = CASE WHEN p_status = 'completed' THEN NOW() ELSE actual_delivery END,
    driver_name = COALESCE(p_driver_name, driver_name),
    driver_phone = COALESCE(p_driver_phone, driver_phone),
    driver_notes = CASE WHEN p_driver_name IS NOT NULL THEN p_notes ELSE driver_notes END,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Add tracking history
  INSERT INTO order_tracking_history (order_id, status, location, latitude, longitude, notes, created_by)
  VALUES (p_order_id, p_status, p_location, p_latitude, p_longitude, p_notes, auth.uid());

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', p_status,
    'tracking_id', v_order.tracking_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order by tracking ID
CREATE OR REPLACE FUNCTION get_order_by_tracking(p_tracking_id VARCHAR)
RETURNS TABLE (
  id INTEGER,
  tracking_id VARCHAR,
  status VARCHAR,
  total DECIMAL,
  created_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  delivering_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  driver_name VARCHAR,
  driver_phone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.tracking_id,
    o.status::VARCHAR,
    o.total,
    o.created_at,
    o.confirmed_at,
    o.preparing_at,
    o.delivering_at,
    o.completed_at,
    o.cancelled_at,
    o.estimated_delivery,
    o.driver_name,
    o.driver_phone
  FROM orders o
  WHERE o.tracking_id = p_tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tracking history
CREATE OR REPLACE FUNCTION get_tracking_history(p_order_id INTEGER)
RETURNS TABLE (
  id UUID,
  status VARCHAR,
  location VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.status,
    h.location,
    h.latitude,
    h.longitude,
    h.notes,
    h.created_at
  FROM order_tracking_history h
  WHERE h.order_id = p_order_id
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE order_tracking_history ENABLE ROW LEVEL SECURITY;

-- Users can view tracking history for their orders
CREATE POLICY "Users can view own order tracking"
ON order_tracking_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_tracking_history.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Admin can manage all tracking
CREATE POLICY "Admin can manage tracking"
ON order_tracking_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tracking_history_order ON order_tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_created ON order_tracking_history(created_at DESC);

-- Update existing orders with tracking IDs
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM orders WHERE tracking_id IS NULL
  LOOP
    UPDATE orders SET tracking_id = generate_tracking_id() WHERE id = r.id;
  END LOOP;
END $$;

-- Comments
COMMENT ON TABLE order_tracking_history IS 'Detailed tracking history for orders';
COMMENT ON FUNCTION generate_tracking_id IS 'Generate unique tracking ID for orders';
COMMENT ON FUNCTION update_order_status IS 'Update order status with automatic timestamp and history';
