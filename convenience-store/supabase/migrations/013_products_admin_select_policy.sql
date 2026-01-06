-- Fix products SELECT policy for admin
-- Admin should see ALL products (including inactive)

-- Drop existing public policy
DROP POLICY IF EXISTS "products_public" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_admin_select" ON products;

-- Create new SELECT policy: public sees active, admin sees all
CREATE POLICY "products_select" ON products FOR SELECT
  USING (
    is_active = true 
    OR is_admin() 
    OR is_staff_or_above()
  );

-- Ensure realtime is enabled for products table
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable realtime for categories table
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
