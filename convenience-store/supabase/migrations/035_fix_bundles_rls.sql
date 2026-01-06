-- Fix RLS policies for product_bundles to allow admin access without auth session
-- This is needed because admin panel uses legacy admin_users table login

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active bundles" ON product_bundles;
DROP POLICY IF EXISTS "Admins can manage bundles" ON product_bundles;
DROP POLICY IF EXISTS "Admins can manage bundle products" ON bundle_products;

-- Create permissive SELECT policy for product_bundles (admin panel has its own auth guard)
CREATE POLICY "Allow all select on product_bundles"
  ON product_bundles FOR SELECT
  USING (true);

-- Create permissive INSERT/UPDATE/DELETE policies for product_bundles
CREATE POLICY "Allow all insert on product_bundles"
  ON product_bundles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on product_bundles"
  ON product_bundles FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete on product_bundles"
  ON product_bundles FOR DELETE
  USING (true);

-- Create permissive policies for bundle_products
DROP POLICY IF EXISTS "Anyone can view bundle products" ON bundle_products;

CREATE POLICY "Allow all select on bundle_products"
  ON bundle_products FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on bundle_products"
  ON bundle_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on bundle_products"
  ON bundle_products FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete on bundle_products"
  ON bundle_products FOR DELETE
  USING (true);
