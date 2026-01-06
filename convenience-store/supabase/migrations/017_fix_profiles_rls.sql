-- =============================================
-- Fix Profiles RLS - Remove ALL Circular Dependencies
-- =============================================

-- The issue: Multiple policies on profiles table were querying profiles again
-- to check roles, creating circular dependencies that cause 500 errors.
-- 
-- Solution: Use simple policies that only check auth.uid() = id
-- Admin access is handled by SECURITY DEFINER functions (is_admin())

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_secure" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_update_secure" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create NEW simple policies without circular dependencies
-- SELECT: Users can only view their own profile
-- Admin access is handled by SECURITY DEFINER functions
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- UPDATE: Users can update their own profile OR admin can update any
-- is_admin() uses SECURITY DEFINER so it bypasses RLS
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE 
  USING (auth.uid() = id OR is_admin());

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
