-- Fix farmers RLS policy
-- This migration updates the RLS policies for farmers to ensure staff only see farmers they registered
-- while admins can see all farmers

-- Drop all existing policies for farmers (handle any naming variations)
DROP POLICY IF EXISTS "Farmers - admin select all" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - staff select assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - insert staff/admin with assigned club" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - update staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - delete staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - staff select own" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - insert by authenticated staff/admin" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - update by creator or admin" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - delete by admin only" ON public.farmers;

-- Create new policies that ensure staff only see their own registered farmers
CREATE POLICY "Farmers - admin select all" ON public.farmers
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Farmers - staff select own" ON public.farmers
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Farmers - insert by authenticated staff/admin" ON public.farmers
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Farmers - update by creator or admin" ON public.farmers
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Farmers - delete by admin only" ON public.farmers
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
