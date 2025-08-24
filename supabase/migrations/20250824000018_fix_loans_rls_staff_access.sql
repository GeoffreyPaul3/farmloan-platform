-- FIX for Loans not showing correct data for staff users
-- This ensures staff can see loans for farmers in their assigned clubs

-- 1. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Loans - admin select all" ON public.loans;
DROP POLICY IF EXISTS "Loans - staff select assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - insert staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - update staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - delete staff/admin assigned" ON public.loans;

-- 2. Recreate the policies with proper logic
-- Admin can see all loans
CREATE POLICY "Loans - admin select all" ON public.loans
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Staff can see loans for farmers in their assigned clubs
CREATE POLICY "Loans - staff select assigned via farmer group" ON public.loans
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = loans.farmer_group_id
    AND ca.user_id = auth.uid()
  )
);

-- Staff and admin can insert loans for their assigned farmers
CREATE POLICY "Loans - insert staff/admin assigned" ON public.loans
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

-- Staff and admin can update loans for their assigned farmers
CREATE POLICY "Loans - update staff/admin assigned" ON public.loans
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

-- Only admin can delete loans
CREATE POLICY "Loans - delete admin only" ON public.loans
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
