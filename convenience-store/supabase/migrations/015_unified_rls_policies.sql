-- =============================================
-- Unified RLS Policies for All Admin Tables
-- Using is_admin() and is_staff_or_above() functions
-- =============================================

-- CATEGORIES TABLE
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_public" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (is_admin());

-- BANNERS TABLE
DROP POLICY IF EXISTS "banners_select_all" ON banners;
DROP POLICY IF EXISTS "banners_public" ON banners;
DROP POLICY IF EXISTS "Anyone can view active banners" ON banners;
DROP POLICY IF EXISTS "banners_admin_insert" ON banners;
DROP POLICY IF EXISTS "banners_admin_update" ON banners;
DROP POLICY IF EXISTS "banners_admin_delete" ON banners;
DROP POLICY IF EXISTS "banners_insert" ON banners;
DROP POLICY IF EXISTS "banners_update" ON banners;
DROP POLICY IF EXISTS "banners_delete" ON banners;

CREATE POLICY "banners_select" ON banners FOR SELECT USING (is_active = true OR is_staff_or_above());
CREATE POLICY "banners_insert" ON banners FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "banners_update" ON banners FOR UPDATE USING (is_admin());
CREATE POLICY "banners_delete" ON banners FOR DELETE USING (is_admin());

-- COUPONS TABLE
DROP POLICY IF EXISTS "coupons_select_all" ON coupons;
DROP POLICY IF EXISTS "coupons_public" ON coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "coupons_admin_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_admin_update" ON coupons;
DROP POLICY IF EXISTS "coupons_admin_delete" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;

CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (is_active = true OR is_staff_or_above());
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_admin());
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_admin());

-- PROFILES TABLE - Admin can view all, users can view own
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT 
  USING (auth.uid() = id OR is_staff_or_above());

-- Admin can update any profile (for role management)
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE 
  USING (auth.uid() = id OR is_admin());
