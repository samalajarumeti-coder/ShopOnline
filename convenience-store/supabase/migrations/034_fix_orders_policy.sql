-- =============================================
-- Fix Orders SELECT Policy
-- Ensure admin/manager/staff can view all orders
-- =============================================

-- Update is_staff_or_above to include manager role
CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create is_manager_or_above function if not exists
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all existing orders SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_select_all" ON orders;

-- Create single unified SELECT policy
-- Users see their own orders, staff/manager/admin see all
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_staff_or_above());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_staff_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager_or_above() TO authenticated;
