-- =============================================
-- Cancel Order RPC Function
-- Bypasses RLS to allow users to cancel their own pending orders
-- =============================================

CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'กรุณาเข้าสู่ระบบ');
  END IF;

  -- Get order
  SELECT id, user_id, status INTO v_order
  FROM orders
  WHERE id = p_order_id;

  -- Check if order exists
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'ไม่พบคำสั่งซื้อนี้');
  END IF;

  -- Check if user owns the order
  IF v_order.user_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้');
  END IF;

  -- Check if order is pending
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'ไม่สามารถยกเลิกคำสั่งซื้อที่ดำเนินการแล้ว');
  END IF;

  -- Update order status
  UPDATE orders
  SET 
    status = 'cancelled',
    notes = CASE 
      WHEN p_reason IS NOT NULL AND p_reason != '' 
      THEN COALESCE(notes, '') || ' [ยกเลิก: ' || p_reason || ']'
      ELSE notes
    END,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว',
    'order_id', p_order_id
  );
END;
$$;
