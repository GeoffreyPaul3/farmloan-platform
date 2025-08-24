-- Fix ambiguous column reference in input_distributions RLS policies
-- The issue is that both input_distributions and input_stock have a 'quantity' column
-- and the RLS policy is causing ambiguity

-- Drop existing policies
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

-- Create new policies with explicit column references
CREATE POLICY "Input dist - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input dist - staff select assigned" ON public.input_distributions
FOR SELECT USING (public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid()));

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
