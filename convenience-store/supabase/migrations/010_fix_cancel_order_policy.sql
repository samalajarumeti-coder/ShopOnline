-- =============================================
-- Fix Cancel Order Policy
-- Allow users to cancel their own pending orders
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "orders_update_own" ON orders;

-- Create new policy that allows users to update their own orders
-- The application code handles the business logic (only cancel pending orders)
CREATE POLICY "orders_update_own" ON orders FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: The orders_update_admin policy with USING(true) already exists
-- and allows admin to update any order, so we don't need to change it
