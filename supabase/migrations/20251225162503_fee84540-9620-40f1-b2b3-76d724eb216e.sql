
-- Fix security issues for purchase_history, profiles, and user_roles tables
-- These tables should only be accessible by authenticated users

-- 1. Fix purchase_history - ensure only authenticated users can access their own data
DROP POLICY IF EXISTS "Users can view their own purchase history" ON public.purchase_history;
CREATE POLICY "Users can view their own purchase history" 
ON public.purchase_history 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchase_history;
CREATE POLICY "Users can insert their own purchases" 
ON public.purchase_history 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix profiles - ensure only authenticated users can access their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix user_roles - ensure only authenticated users can view roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
