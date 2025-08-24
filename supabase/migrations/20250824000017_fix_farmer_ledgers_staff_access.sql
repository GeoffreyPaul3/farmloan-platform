-- FIX for Farmer Ledgers not showing data for staff users
-- This ensures staff can see loan ledgers for farmers in their assigned clubs

-- 1. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Loan ledger - admin select all" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - update staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - delete staff/admin assigned" ON public.loan_ledgers;

-- 2. Recreate the policies with proper logic
-- Admin can see all loan ledgers
CREATE POLICY "Loan ledger - admin select all" ON public.loan_ledgers
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Staff can see loan ledgers for farmers in their assigned clubs
CREATE POLICY "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND 
  EXISTS (
    SELECT 1 FROM public.farmers f
    JOIN public.club_assignments ca ON ca.farmer_group_id = f.farmer_group_id
    WHERE f.id = loan_ledgers.farmer_id 
    AND ca.user_id = auth.uid()
  )
);

-- Staff and admin can insert loan ledgers for their assigned farmers
CREATE POLICY "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR 
  (get_user_role(auth.uid()) = 'staff' AND 
   EXISTS (
     SELECT 1 FROM public.farmers f
     JOIN public.club_assignments ca ON ca.farmer_group_id = f.farmer_group_id
     WHERE f.id = loan_ledgers.farmer_id 
     AND ca.user_id = auth.uid()
   ))
);

-- Staff and admin can update loan ledgers for their assigned farmers
CREATE POLICY "Loan ledger - update staff/admin assigned" ON public.loan_ledgers
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR 
  (get_user_role(auth.uid()) = 'staff' AND 
   EXISTS (
     SELECT 1 FROM public.farmers f
     JOIN public.club_assignments ca ON ca.farmer_group_id = f.farmer_group_id
     WHERE f.id = loan_ledgers.farmer_id 
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR 
  (get_user_role(auth.uid()) = 'staff' AND 
   EXISTS (
     SELECT 1 FROM public.farmers f
     JOIN public.club_assignments ca ON ca.farmer_group_id = f.farmer_group_id
     WHERE f.id = loan_ledgers.farmer_id 
     AND ca.user_id = auth.uid()
   ))
);

-- Only admin can delete loan ledgers
CREATE POLICY "Loan ledger - delete admin only" ON public.loan_ledgers
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
