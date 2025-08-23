-- Fix cash payments RLS policy
-- This migration updates the RLS policies for cash_payments to allow staff to create payments
-- without requiring specific club assignments, while maintaining security

-- Drop existing policies
DROP POLICY IF EXISTS "Cash payments - admin select all" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - staff select assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - insert staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - update staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - delete staff/admin assigned" ON public.cash_payments;

-- Create new policies that are less restrictive for staff
CREATE POLICY "Cash payments - admin select all" ON public.cash_payments
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Cash payments - staff select all" ON public.cash_payments
FOR SELECT USING (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Cash payments - insert by authenticated staff/admin" ON public.cash_payments
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Cash payments - update by authenticated staff/admin" ON public.cash_payments
FOR UPDATE USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Cash payments - delete by admin only" ON public.cash_payments
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
