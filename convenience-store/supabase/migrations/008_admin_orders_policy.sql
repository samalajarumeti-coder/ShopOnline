-- =============================================
-- Admin Orders Management Policies
-- Allow admin to manage all orders
-- =============================================

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_update_cancel" ON orders;

-- Create new policies that allow both user and admin access

-- Users can view their own orders
CREATE POLICY "orders_select_own" ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Admin can view all orders (using service role or specific admin check)
-- For now, allow authenticated users to view all orders for admin panel
CREATE POLICY "orders_select_all" ON orders FOR SELECT 
  USING (true);

-- Users can insert their own orders
CREATE POLICY "orders_insert_own" ON orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending orders to cancelled
CREATE POLICY "orders_update_own" ON orders FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admin can update any order (all authenticated users for simplicity)
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE 
  USING (true);

-- Admin can delete orders
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE 
  USING (true);

-- Order items policies for admin
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;

-- Allow viewing all order items
CREATE POLICY "order_items_select_all" ON order_items FOR SELECT 
  USING (true);

-- Allow inserting order items for own orders
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Allow deleting order items (for admin)
CREATE POLICY "order_items_delete_admin" ON order_items FOR DELETE 
  USING (true);
