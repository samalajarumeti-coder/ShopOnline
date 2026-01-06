-- =============================================
-- Create order function with transaction
-- This bypasses RLS timing issues
-- =============================================

-- Function to create order with items in single transaction
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_address_id INTEGER,
  p_subtotal DECIMAL,
  p_delivery_fee DECIMAL,
  p_discount DECIMAL,
  p_total DECIMAL,
  p_payment_method TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_order_id INTEGER;
  v_user_id UUID;
  v_item JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Create order
  INSERT INTO orders (user_id, address_id, subtotal, delivery_fee, discount, total, payment_method, notes, status)
  VALUES (v_user_id, p_address_id, p_subtotal, p_delivery_fee, p_discount, p_total, p_payment_method, p_notes, 'pending')
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::INTEGER,
      v_item->>'product_name',
      (v_item->>'product_price')::DECIMAL,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'subtotal')::DECIMAL
    );
  END LOOP;

  -- Return created order
  RETURN jsonb_build_object(
    'id', v_order_id,
    'user_id', v_user_id,
    'status', 'pending',
    'total', p_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
