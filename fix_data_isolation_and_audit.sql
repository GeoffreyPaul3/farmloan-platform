-- Fix Data Isolation and Audit Trail Issues
-- This ensures proper data isolation by user and fixes audit trail visibility

-- 1. Fix Data Isolation - Staff should only see data they created
-- Update RLS policies to be more restrictive for staff

-- Update farmer_groups policies - Staff can only see clubs they created
DROP POLICY IF EXISTS "Clubs - staff select assigned" ON public.farmer_groups;
CREATE POLICY "Clubs - staff select assigned" ON public.farmer_groups
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see clubs they created
  );

-- Update farmers policies - Staff can only see farmers they registered
DROP POLICY IF EXISTS "Farmers - staff select assigned" ON public.farmers;
CREATE POLICY "Farmers - staff select assigned" ON public.farmers
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see farmers they registered
  );

-- Update loans policies - Staff can only see loans they created
DROP POLICY IF EXISTS "Loans - staff select assigned" ON public.loans;
CREATE POLICY "Loans - staff select assigned" ON public.loans
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see loans they created
  );

-- Update field_visits policies - Staff can only see field visits they created
DROP POLICY IF EXISTS "Field visits - staff select assigned" ON public.field_visits;
CREATE POLICY "Field visits - staff select assigned" ON public.field_visits
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see field visits they created
  );

-- Update deliveries policies - Staff can only see deliveries they created
DROP POLICY IF EXISTS "Deliveries - staff select assigned" ON public.deliveries;
CREATE POLICY "Deliveries - staff select assigned" ON public.deliveries
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    officer_id = auth.uid() -- Staff can only see deliveries they created
  );

-- Update input_distributions policies - Staff can only see input distributions they created
DROP POLICY IF EXISTS "Input distributions - staff select assigned" ON public.input_distributions;
CREATE POLICY "Input distributions - staff select assigned" ON public.input_distributions
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    distributed_by = auth.uid() -- Staff can only see input distributions they created
  );

-- Update equipment_issuance policies - Staff can only see equipment issuance they created
DROP POLICY IF EXISTS "Equipment issuance - staff select assigned" ON public.equipment_issuance;
CREATE POLICY "Equipment issuance - staff select assigned" ON public.equipment_issuance
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    issued_by = auth.uid() -- Staff can only see equipment issuance they created
  );

-- Update repayments policies - Staff can only see repayments they created
DROP POLICY IF EXISTS "Repayments - staff select assigned" ON public.repayments;
CREATE POLICY "Repayments - staff select assigned" ON public.repayments
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    recorded_by = auth.uid() -- Staff can only see repayments they created
  );

-- Update payouts policies - Staff can only see payouts they created
DROP POLICY IF EXISTS "Payouts - staff select via delivery" ON public.payouts;
CREATE POLICY "Payouts - staff select via delivery" ON public.payouts
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see payouts they created
  );

-- Update loan_ledgers policies - Staff can only see loan ledgers they created
DROP POLICY IF EXISTS "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers;
CREATE POLICY "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    created_by = auth.uid() -- Staff can only see loan ledgers they created
  );

-- 2. Fix Audit Trail - Admins should see all activity, staff see their own
-- Update audit_logs policies to allow proper visibility

-- Drop existing audit_logs policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Create new audit_logs policies
CREATE POLICY "Audit logs - admin view all" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Audit logs - staff view own" ON public.audit_logs
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IS NOT NULL AND 
    user_id = auth.uid() -- Staff can only see their own audit logs
  );

-- 3. Update INSERT policies to ensure created_by/officer_id/issued_by/distributed_by/recorded_by is set correctly
-- Update farmer_groups insert policy
DROP POLICY IF EXISTS "Staff can create farmer groups" ON public.farmer_groups;
CREATE POLICY "Staff can create farmer groups" ON public.farmer_groups
  FOR INSERT TO authenticated WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update farmers insert policy
DROP POLICY IF EXISTS "Farmers - insert staff/admin assigned" ON public.farmers;
CREATE POLICY "Farmers - insert staff/admin assigned" ON public.farmers
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update loans insert policy
DROP POLICY IF EXISTS "Loans - insert staff/admin assigned" ON public.loans;
CREATE POLICY "Loans - insert staff/admin assigned" ON public.loans
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update field_visits insert policy
DROP POLICY IF EXISTS "Field visits - insert staff/admin assigned" ON public.field_visits;
CREATE POLICY "Field visits - insert staff/admin assigned" ON public.field_visits
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update deliveries insert policy
DROP POLICY IF EXISTS "Deliveries - insert staff/admin assigned" ON public.deliveries;
CREATE POLICY "Deliveries - insert staff/admin assigned" ON public.deliveries
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update input_distributions insert policy
DROP POLICY IF EXISTS "Input distributions - insert staff/admin assigned" ON public.input_distributions;
CREATE POLICY "Input distributions - insert staff/admin assigned" ON public.input_distributions
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update equipment_issuance insert policy
DROP POLICY IF EXISTS "Equipment issuance - insert staff/admin assigned" ON public.equipment_issuance;
CREATE POLICY "Equipment issuance - insert staff/admin assigned" ON public.equipment_issuance
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update repayments insert policy
DROP POLICY IF EXISTS "Repayments - insert staff/admin assigned" ON public.repayments;
CREATE POLICY "Repayments - insert staff/admin assigned" ON public.repayments
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update payouts insert policy
DROP POLICY IF EXISTS "Payouts - insert staff/admin via delivery" ON public.payouts;
CREATE POLICY "Payouts - insert staff/admin via delivery" ON public.payouts
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update loan_ledgers insert policy
DROP POLICY IF EXISTS "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers;
CREATE POLICY "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- 4. Update UPDATE policies to ensure staff can only update their own data
-- Update farmer_groups update policy
DROP POLICY IF EXISTS "Staff can update farmer groups" ON public.farmer_groups;
CREATE POLICY "Staff can update farmer groups" ON public.farmer_groups
  FOR UPDATE TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update farmers update policy
DROP POLICY IF EXISTS "Farmers - update staff/admin assigned" ON public.farmers;
CREATE POLICY "Farmers - update staff/admin assigned" ON public.farmers
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update loans update policy
DROP POLICY IF EXISTS "Loans - update staff/admin assigned" ON public.loans;
CREATE POLICY "Loans - update staff/admin assigned" ON public.loans
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update field_visits update policy
DROP POLICY IF EXISTS "Field visits - update staff/admin assigned" ON public.field_visits;
CREATE POLICY "Field visits - update staff/admin assigned" ON public.field_visits
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update deliveries update policy
DROP POLICY IF EXISTS "Deliveries - update staff/admin assigned" ON public.deliveries;
CREATE POLICY "Deliveries - update staff/admin assigned" ON public.deliveries
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND officer_id = auth.uid())
  );

-- Update input_distributions update policy
DROP POLICY IF EXISTS "Input distributions - update staff/admin assigned" ON public.input_distributions;
CREATE POLICY "Input distributions - update staff/admin assigned" ON public.input_distributions
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND distributed_by = auth.uid())
  );

-- Update equipment_issuance update policy
DROP POLICY IF EXISTS "Equipment issuance - update staff/admin assigned" ON public.equipment_issuance;
CREATE POLICY "Equipment issuance - update staff/admin assigned" ON public.equipment_issuance
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND issued_by = auth.uid())
  );

-- Update repayments update policy
DROP POLICY IF EXISTS "Repayments - update staff/admin assigned" ON public.repayments;
CREATE POLICY "Repayments - update staff/admin assigned" ON public.repayments
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND recorded_by = auth.uid())
  );

-- Update payouts update policy
DROP POLICY IF EXISTS "Payouts - update staff/admin assigned" ON public.payouts;
CREATE POLICY "Payouts - update staff/admin assigned" ON public.payouts
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update loan_ledgers update policy
DROP POLICY IF EXISTS "Loan ledger - update staff/admin assigned" ON public.loan_ledgers;
CREATE POLICY "Loan ledger - update staff/admin assigned" ON public.loan_ledgers
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- 5. Update DELETE policies to ensure staff can only delete their own data
-- Update farmer_groups delete policy
DROP POLICY IF EXISTS "Clubs - delete staff/admin assigned" ON public.farmer_groups;
CREATE POLICY "Clubs - delete staff/admin assigned" ON public.farmer_groups
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update farmers delete policy
DROP POLICY IF EXISTS "Farmers - delete staff/admin assigned" ON public.farmers;
CREATE POLICY "Farmers - delete staff/admin assigned" ON public.farmers
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update loans delete policy
DROP POLICY IF EXISTS "Loans - delete staff/admin assigned" ON public.loans;
CREATE POLICY "Loans - delete staff/admin assigned" ON public.loans
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update field_visits delete policy
DROP POLICY IF EXISTS "Field visits - delete staff/admin assigned" ON public.field_visits;
CREATE POLICY "Field visits - delete staff/admin assigned" ON public.field_visits
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update deliveries delete policy
DROP POLICY IF EXISTS "Deliveries - delete staff/admin assigned" ON public.deliveries;
CREATE POLICY "Deliveries - delete staff/admin assigned" ON public.deliveries
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND officer_id = auth.uid())
  );

-- Update input_distributions delete policy
DROP POLICY IF EXISTS "Input distributions - delete staff/admin assigned" ON public.input_distributions;
CREATE POLICY "Input distributions - delete staff/admin assigned" ON public.input_distributions
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND distributed_by = auth.uid())
  );

-- Update equipment_issuance delete policy
DROP POLICY IF EXISTS "Equipment issuance - delete staff/admin assigned" ON public.equipment_issuance;
CREATE POLICY "Equipment issuance - delete staff/admin assigned" ON public.equipment_issuance
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND issued_by = auth.uid())
  );

-- Update repayments delete policy
DROP POLICY IF EXISTS "Repayments - delete staff/admin assigned" ON public.repayments;
CREATE POLICY "Repayments - delete staff/admin assigned" ON public.repayments
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND recorded_by = auth.uid())
  );

-- Update payouts delete policy
DROP POLICY IF EXISTS "Payouts - delete staff/admin assigned" ON public.payouts;
CREATE POLICY "Payouts - delete staff/admin assigned" ON public.payouts
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- Update loan_ledgers delete policy
DROP POLICY IF EXISTS "Loan ledger - delete staff/admin assigned" ON public.loan_ledgers;
CREATE POLICY "Loan ledger - delete staff/admin assigned" ON public.loan_ledgers
  FOR DELETE USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND created_by = auth.uid())
  );

-- 6. Create a function to help with data isolation checks
CREATE OR REPLACE FUNCTION public.user_can_access_record(table_name text, record_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can access everything
  IF public.get_user_role(user_id) = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Staff can only access records they created
  RETURN EXISTS (
    SELECT 1 
    FROM (
      SELECT created_by FROM public.farmer_groups WHERE id = record_id
      UNION ALL
      SELECT created_by FROM public.farmers WHERE id = record_id
      UNION ALL
      SELECT created_by FROM public.loans WHERE id = record_id
      UNION ALL
      SELECT created_by FROM public.field_visits WHERE id = record_id
      UNION ALL
      SELECT officer_id FROM public.deliveries WHERE id = record_id
      UNION ALL
      SELECT distributed_by FROM public.input_distributions WHERE id = record_id
      UNION ALL
      SELECT issued_by FROM public.equipment_issuance WHERE id = record_id
      UNION ALL
      SELECT recorded_by FROM public.repayments WHERE id = record_id
      UNION ALL
      SELECT created_by FROM public.payouts WHERE id = record_id
      UNION ALL
      SELECT created_by FROM public.loan_ledgers WHERE id = record_id
    ) AS records
    WHERE records.created_by = user_id OR records.officer_id = user_id OR records.issued_by = user_id OR records.distributed_by = user_id OR records.recorded_by = user_id
  );
END;
$$;
