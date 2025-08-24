-- FIX for Payments page RLS - ensure staff only see data for their assigned clubs
-- This affects: payouts, cash_payments, input_distributions, loan_ledgers, loans

-- 1. Fix PAYOUTS RLS policies
DROP POLICY IF EXISTS "Payouts - admin select all" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - staff select assigned" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - insert staff/admin assigned" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - update staff/admin assigned" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - delete staff/admin assigned" ON public.payouts;

CREATE POLICY "Payouts - admin select all" ON public.payouts
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Payouts - staff select assigned via delivery" ON public.payouts
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  EXISTS (
    SELECT 1 FROM public.deliveries d
    JOIN public.club_assignments ca ON ca.farmer_group_id = d.farmer_group_id
    WHERE d.id = payouts.delivery_id
    AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Payouts - insert staff/admin assigned" ON public.payouts
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.deliveries d
     JOIN public.club_assignments ca ON ca.farmer_group_id = d.farmer_group_id
     WHERE d.id = payouts.delivery_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Payouts - update staff/admin assigned" ON public.payouts
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.deliveries d
     JOIN public.club_assignments ca ON ca.farmer_group_id = d.farmer_group_id
     WHERE d.id = payouts.delivery_id
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.deliveries d
     JOIN public.club_assignments ca ON ca.farmer_group_id = d.farmer_group_id
     WHERE d.id = payouts.delivery_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Payouts - delete admin only" ON public.payouts
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- 2. Fix CASH_PAYMENTS RLS policies
DROP POLICY IF EXISTS "Cash payments - admin select all" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - staff select assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - insert staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - update staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - delete staff/admin assigned" ON public.cash_payments;

CREATE POLICY "Cash payments - admin select all" ON public.cash_payments
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Cash payments - staff select assigned via farmer group" ON public.cash_payments
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = cash_payments.farmer_group_id
    AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Cash payments - insert staff/admin assigned" ON public.cash_payments
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = cash_payments.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Cash payments - update staff/admin assigned" ON public.cash_payments
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = cash_payments.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = cash_payments.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Cash payments - delete admin only" ON public.cash_payments
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- 3. Fix INPUT_DISTRIBUTIONS RLS policies (if not already fixed)
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

CREATE POLICY "Input dist - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input dist - staff select assigned via farmer group" ON public.input_distributions
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = input_distributions.farmer_group_id
    AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Input dist - insert staff/admin assigned" ON public.input_distributions
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = input_distributions.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Input dist - update staff/admin assigned" ON public.input_distributions
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = input_distributions.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = input_distributions.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

CREATE POLICY "Input dist - delete admin only" ON public.input_distributions
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
