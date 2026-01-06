-- =============================================
-- Admin RLS Policies
-- Allow full CRUD access for admin operations
-- =============================================

-- Products: Allow all operations (for admin)
DROP POLICY IF EXISTS "products_public" ON products;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true);
CREATE POLICY "products_delete" ON products FOR DELETE USING (true);

-- Categories: Allow all operations
DROP POLICY IF EXISTS "categories_public" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (true);

-- Banners: Allow all operations
DROP POLICY IF EXISTS "banners_public" ON banners;
CREATE POLICY "banners_select_all" ON banners FOR SELECT USING (true);
CREATE POLICY "banners_insert" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "banners_update" ON banners FOR UPDATE USING (true);
CREATE POLICY "banners_delete" ON banners FOR DELETE USING (true);

-- Coupons: Allow all operations
DROP POLICY IF EXISTS "coupons_public" ON coupons;
CREATE POLICY "coupons_select_all" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (true);
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (true);

-- Orders: Allow admin to view and update all orders
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select_all" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update_all" ON orders FOR UPDATE USING (true);

-- Order items: Allow admin to view all
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select_all" ON order_items FOR SELECT USING (true);

-- Profiles: Allow admin to view all profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

-- Addresses: Allow admin to view all addresses
DROP POLICY IF EXISTS "addresses_select" ON addresses;
CREATE POLICY "addresses_select_all" ON addresses FOR SELECT USING (true);
