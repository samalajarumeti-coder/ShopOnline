-- =============================================
-- Fix Products SELECT Policy
-- Create helper functions and fix policy
-- =============================================

-- Create is_admin function with secure search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create is_staff_or_above function with secure search_path
CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing products SELECT policies
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_public" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Create new SELECT policy: public sees active, admin/staff sees all
CREATE POLICY "products_select" ON products FOR SELECT
  USING (
    is_active = true 
    OR is_admin() 
    OR is_staff_or_above()
  );

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff_or_above() TO authenticated;
