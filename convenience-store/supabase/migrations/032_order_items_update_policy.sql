-- =============================================
-- Order Items Update Policy for Admin
-- Allow admin to update order items (quantity, subtotal)
-- =============================================

-- Add update policy for order_items (admin can update any)
DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;
CREATE POLICY "order_items_update_admin" ON order_items FOR UPDATE 
  USING (is_staff_or_above());

-- Add insert policy for admin to add items to any order
DROP POLICY IF EXISTS "order_items_insert_admin" ON order_items;
CREATE POLICY "order_items_insert_admin" ON order_items FOR INSERT 
  WITH CHECK (is_staff_or_above());
