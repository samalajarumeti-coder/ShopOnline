-- =============================================
-- Granular Permission Matrix
-- Admin: Full access
-- Manager: Create, Read, Update (no Delete)
-- Staff: Read only
-- =============================================

-- PRODUCTS TABLE - Granular permissions
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;

CREATE POLICY "products_select" ON products FOR SELECT
  USING (is_active = true OR is_staff_or_above());
CREATE POLICY "products_insert" ON products FOR INSERT
  WITH CHECK (is_manager_or_above());
CREATE POLICY "products_update" ON products FOR UPDATE
  USING (is_manager_or_above());
CREATE POLICY "products_delete" ON products FOR DELETE
  USING (is_admin());

-- CATEGORIES TABLE - Granular permissions
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (is_manager_or_above());
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (is_manager_or_above());
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (is_admin());

-- BANNERS TABLE - Granular permissions
DROP POLICY IF EXISTS "banners_select" ON banners;
DROP POLICY IF EXISTS "banners_insert" ON banners;
DROP POLICY IF EXISTS "banners_update" ON banners;
DROP POLICY IF EXISTS "banners_delete" ON banners;

CREATE POLICY "banners_select" ON banners FOR SELECT USING (is_active = true OR is_staff_or_above());
CREATE POLICY "banners_insert" ON banners FOR INSERT WITH CHECK (is_manager_or_above());
CREATE POLICY "banners_update" ON banners FOR UPDATE USING (is_manager_or_above());
CREATE POLICY "banners_delete" ON banners FOR DELETE USING (is_admin());

-- COUPONS TABLE - Granular permissions
DROP POLICY IF EXISTS "coupons_select" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;

CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (is_active = true OR is_staff_or_above());
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_manager_or_above());
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_manager_or_above());
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_admin());

-- ORDERS TABLE - Staff can view and update status
DROP POLICY IF EXISTS "orders_select_all" ON orders;
DROP POLICY IF EXISTS "orders_admin_update" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;

CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_staff_or_above());
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (is_staff_or_above());
CREATE POLICY "orders_delete" ON orders FOR DELETE
  USING (is_admin());

-- =============================================
-- Helper Functions for Last Admin Protection
-- =============================================

CREATE OR REPLACE FUNCTION is_last_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_count INTEGER;
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  IF user_role != 'admin' THEN
    RETURN FALSE;
  END IF;
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  RETURN admin_count <= 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to safely change user role with validation
CREATE OR REPLACE FUNCTION change_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSON AS $$
DECLARE
  target_user_role TEXT;
  target_user_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Only admin can change roles');
  END IF;
  
  SELECT role, full_name INTO target_user_role, target_user_name 
  FROM public.profiles WHERE id = target_user_id;
  
  IF target_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF new_role NOT IN ('admin', 'manager', 'staff', 'customer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;
  
  IF target_user_role = 'admin' AND new_role != 'admin' THEN
    IF is_last_admin(target_user_id) THEN
      RETURN json_build_object('success', false, 'error', 'ไม่สามารถลดสิทธิ์ Admin คนสุดท้ายได้');
    END IF;
  END IF;
  
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;
  
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    'role_change',
    'user',
    target_user_id::TEXT,
    json_build_object('role', target_user_role, 'name', target_user_name),
    json_build_object('role', new_role, 'changed_by', auth.uid())
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Role updated successfully',
    'old_role', target_user_role,
    'new_role', new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION is_last_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role(UUID, TEXT) TO authenticated;
