-- Fix security vulnerabilities for profiles and purchase_history tables
-- Ensure RLS is enforced and only authenticated users can access their own data

-- =============================================
-- 1. PROFILES TABLE SECURITY
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create strict policies - only authenticated users can access their own data
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. PURCHASE_HISTORY TABLE SECURITY
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well
ALTER TABLE public.purchase_history FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own purchase history" ON public.purchase_history;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchase_history;
DROP POLICY IF EXISTS "Anyone can view purchase history" ON public.purchase_history;
DROP POLICY IF EXISTS "Public can view purchase history" ON public.purchase_history;

-- Create strict policies - only authenticated users can access their own data
CREATE POLICY "purchase_history_select_own"
ON public.purchase_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "purchase_history_insert_own"
ON public.purchase_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. USER_CARTS TABLE SECURITY (also sensitive)
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well
ALTER TABLE public.user_carts FORCE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Users can add to their own cart" ON public.user_carts;
DROP POLICY IF EXISTS "Users can remove from their own cart" ON public.user_carts;

-- Create strict policies
CREATE POLICY "user_carts_select_own"
ON public.user_carts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_carts_insert_own"
ON public.user_carts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_carts_delete_own"
ON public.user_carts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- 4. USER_ROLES TABLE SECURITY
-- =============================================

-- Ensure RLS is enabled (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================
-- 5. Revoke direct public access
-- =============================================

-- Revoke all permissions from anon role on sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.purchase_history FROM anon;
REVOKE ALL ON public.user_carts FROM anon;

-- Grant only to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.purchase_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_carts TO authenticated;

