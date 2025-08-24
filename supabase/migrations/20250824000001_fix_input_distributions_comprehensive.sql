-- Comprehensive fix for ambiguous column reference in input_distributions
-- This addresses the root cause of the issue

-- 1. First, let's update the is_user_assigned_to_club function to be more explicit
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_club(_club_id uuid, _user_id uuid default auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = _club_id
      AND ca.user_id = _user_id
  );
$$;

-- 2. Drop all existing input_distributions policies
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

-- 3. Create new policies with explicit table references
CREATE POLICY "Input dist - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input dist - staff select assigned" ON public.input_distributions
FOR SELECT USING (
  public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
);

CREATE POLICY "Input dist - insert staff/admin assigned" ON public.input_distributions
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
);

CREATE POLICY "Input dist - update staff/admin assigned" ON public.input_distributions
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
);

CREATE POLICY "Input dist - delete staff/admin assigned" ON public.input_distributions
FOR DELETE USING (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
);

-- 4. Also fix any potential issues with input_stock policies that might be interfering
DROP POLICY IF EXISTS "Input stock - select all auth" ON public.input_stock;
DROP POLICY IF EXISTS "Input stock - staff/admin manage" ON public.input_stock;

CREATE POLICY "Input stock - select all auth" ON public.input_stock
FOR SELECT USING (true);

CREATE POLICY "Input stock - staff/admin manage" ON public.input_stock
FOR ALL USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);
