-- =============================================
-- Add UPDATE policy for orders (cancel only pending orders)
-- =============================================

-- Allow users to update their own orders (only status to cancelled, and only if pending)
CREATE POLICY "orders_update_cancel" ON orders FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Note: This policy allows users to cancel only their own pending orders
-- Admin can update any order status via service role key
