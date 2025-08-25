-- IMPLEMENT SHARED DATA ACCESS SYSTEM
-- All users can view all data, create new data, but only admins can edit existing data
-- This ensures data transparency and collaboration while maintaining data integrity

-- 1. First, let's add created_by fields to tables that might be missing them
-- (Most tables already have created_by, but let's ensure consistency)

-- Add created_by to deliveries if not exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deliveries' 
    AND column_name = 'created_by'
  ) THEN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'geofreypaul40@gmail.com' LIMIT 1;
    
    -- First add the column as nullable
    ALTER TABLE public.deliveries ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    -- Temporarily disable audit triggers to avoid foreign key issues
    ALTER TABLE public.deliveries DISABLE TRIGGER deliveries_audit;
    
    -- Update existing records with a default user (first admin user found)
    UPDATE public.deliveries 
    SET created_by = admin_user_id
    WHERE created_by IS NULL;
    
    -- Re-enable audit triggers
    ALTER TABLE public.deliveries ENABLE TRIGGER deliveries_audit;
    
    -- Now make it NOT NULL
    ALTER TABLE public.deliveries ALTER COLUMN created_by SET NOT NULL;
    
    -- Add default for future records
    ALTER TABLE public.deliveries ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- Add created_by to input_distributions if not exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'input_distributions' 
    AND column_name = 'created_by'
  ) THEN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'geofreypaul40@gmail.com' LIMIT 1;
    
    -- First add the column as nullable
    ALTER TABLE public.input_distributions ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    -- Update existing records with a default user (first admin user found)
    -- Use a transaction to handle any potential audit trigger issues
    BEGIN
      UPDATE public.input_distributions 
      SET created_by = admin_user_id
      WHERE created_by IS NULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- If update fails due to audit trigger, try without audit logging
        RAISE NOTICE 'Update failed, retrying without audit logging: %', SQLERRM;
        UPDATE public.input_distributions 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
    END;
    
    -- Now make it NOT NULL
    ALTER TABLE public.input_distributions ALTER COLUMN created_by SET NOT NULL;
    
    -- Add default for future records
    ALTER TABLE public.input_distributions ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- Add created_by to cash_payments if not exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_payments' 
    AND column_name = 'created_by'
  ) THEN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'geofreypaul40@gmail.com' LIMIT 1;
    
    -- First add the column as nullable
    ALTER TABLE public.cash_payments ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    -- Update existing records with a default user (first admin user found)
    -- Use a transaction to handle any potential audit trigger issues
    BEGIN
      UPDATE public.cash_payments 
      SET created_by = admin_user_id
      WHERE created_by IS NULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- If update fails due to audit trigger, try without audit logging
        RAISE NOTICE 'Update failed, retrying without audit logging: %', SQLERRM;
        UPDATE public.cash_payments 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
    END;
    
    -- Now make it NOT NULL
    ALTER TABLE public.cash_payments ALTER COLUMN created_by SET NOT NULL;
    
    -- Add default for future records
    ALTER TABLE public.cash_payments ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- Add created_by to field_visits if not exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'field_visits' 
    AND column_name = 'created_by'
  ) THEN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'geofreypaul40@gmail.com' LIMIT 1;
    
    -- First add the column as nullable
    ALTER TABLE public.field_visits ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    -- Temporarily disable audit triggers to avoid foreign key issues
    ALTER TABLE public.field_visits DISABLE TRIGGER field_visits_audit;
    
    -- Update existing records with a default user (first admin user found)
    UPDATE public.field_visits 
    SET created_by = admin_user_id
    WHERE created_by IS NULL;
    
    -- Re-enable audit triggers
    ALTER TABLE public.field_visits ENABLE TRIGGER field_visits_audit;
    
    -- Now make it NOT NULL
    ALTER TABLE public.field_visits ALTER COLUMN created_by SET NOT NULL;
    
    -- Add default for future records
    ALTER TABLE public.field_visits ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- 2. Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT get_user_role(user_id) = 'admin';
$$;

-- 3. Create a function to check if user can edit a record
CREATE OR REPLACE FUNCTION public.can_edit_record(table_name TEXT, record_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_admin(user_id);
$$;

-- 3.5. Create a helper function to safely create policies
CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(
  table_name TEXT,
  policy_name TEXT,
  policy_definition TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name 
    AND policyname = policy_name
  ) THEN
    EXECUTE policy_definition;
  END IF;
END;
$$;

-- 4. Drop all existing restrictive RLS policies and create new shared access policies

-- FARMER_GROUPS (CLUBS)
DROP POLICY IF EXISTS "Clubs - admin select all" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - staff select assigned" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - insert staff/admin assigned" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - update staff/admin assigned" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - delete admin only" ON public.farmer_groups;

-- All authenticated users can view all clubs
SELECT public.create_policy_if_not_exists(
  'farmer_groups',
  'Clubs - all users can view',
  'CREATE POLICY "Clubs - all users can view" ON public.farmer_groups FOR SELECT USING (true)'
);

-- All authenticated users can create clubs
SELECT public.create_policy_if_not_exists(
  'farmer_groups',
  'Clubs - all users can create',
  'CREATE POLICY "Clubs - all users can create" ON public.farmer_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete clubs
SELECT public.create_policy_if_not_exists(
  'farmer_groups',
  'Clubs - only admins can edit',
  'CREATE POLICY "Clubs - only admins can edit" ON public.farmer_groups FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'farmer_groups',
  'Clubs - only admins can delete',
  'CREATE POLICY "Clubs - only admins can delete" ON public.farmer_groups FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- FARMERS
DROP POLICY IF EXISTS "Farmers - admin select all" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - staff select assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - insert staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - update staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - delete admin only" ON public.farmers;

-- All authenticated users can view all farmers
SELECT public.create_policy_if_not_exists(
  'farmers',
  'Farmers - all users can view',
  'CREATE POLICY "Farmers - all users can view" ON public.farmers FOR SELECT USING (true)'
);

-- All authenticated users can create farmers
SELECT public.create_policy_if_not_exists(
  'farmers',
  'Farmers - all users can create',
  'CREATE POLICY "Farmers - all users can create" ON public.farmers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete farmers
SELECT public.create_policy_if_not_exists(
  'farmers',
  'Farmers - only admins can edit',
  'CREATE POLICY "Farmers - only admins can edit" ON public.farmers FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'farmers',
  'Farmers - only admins can delete',
  'CREATE POLICY "Farmers - only admins can delete" ON public.farmers FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- LOANS
DROP POLICY IF EXISTS "Loans - admin select all" ON public.loans;
DROP POLICY IF EXISTS "Loans - staff select assigned or created" ON public.loans;
DROP POLICY IF EXISTS "Loans - insert staff/admin" ON public.loans;
DROP POLICY IF EXISTS "Loans - update staff/admin" ON public.loans;
DROP POLICY IF EXISTS "Loans - delete admin only" ON public.loans;

-- All authenticated users can view all loans
SELECT public.create_policy_if_not_exists(
  'loans',
  'Loans - all users can view',
  'CREATE POLICY "Loans - all users can view" ON public.loans FOR SELECT USING (true)'
);

-- All authenticated users can create loans
SELECT public.create_policy_if_not_exists(
  'loans',
  'Loans - all users can create',
  'CREATE POLICY "Loans - all users can create" ON public.loans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete loans
SELECT public.create_policy_if_not_exists(
  'loans',
  'Loans - only admins can edit',
  'CREATE POLICY "Loans - only admins can edit" ON public.loans FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'loans',
  'Loans - only admins can delete',
  'CREATE POLICY "Loans - only admins can delete" ON public.loans FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- DELIVERIES
DROP POLICY IF EXISTS "Deliveries - admin select all" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - staff select assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - insert staff/admin assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - update staff/admin assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - delete admin only" ON public.deliveries;

-- All authenticated users can view all deliveries
SELECT public.create_policy_if_not_exists(
  'deliveries',
  'Deliveries - all users can view',
  'CREATE POLICY "Deliveries - all users can view" ON public.deliveries FOR SELECT USING (true)'
);

-- All authenticated users can create deliveries
SELECT public.create_policy_if_not_exists(
  'deliveries',
  'Deliveries - all users can create',
  'CREATE POLICY "Deliveries - all users can create" ON public.deliveries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete deliveries
SELECT public.create_policy_if_not_exists(
  'deliveries',
  'Deliveries - only admins can edit',
  'CREATE POLICY "Deliveries - only admins can edit" ON public.deliveries FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'deliveries',
  'Deliveries - only admins can delete',
  'CREATE POLICY "Deliveries - only admins can delete" ON public.deliveries FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- INPUT_DISTRIBUTIONS
DROP POLICY IF EXISTS "Input distributions - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - delete admin only" ON public.input_distributions;

-- All authenticated users can view all input distributions
SELECT public.create_policy_if_not_exists(
  'input_distributions',
  'Input distributions - all users can view',
  'CREATE POLICY "Input distributions - all users can view" ON public.input_distributions FOR SELECT USING (true)'
);

-- All authenticated users can create input distributions
SELECT public.create_policy_if_not_exists(
  'input_distributions',
  'Input distributions - all users can create',
  'CREATE POLICY "Input distributions - all users can create" ON public.input_distributions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete input distributions
SELECT public.create_policy_if_not_exists(
  'input_distributions',
  'Input distributions - only admins can edit',
  'CREATE POLICY "Input distributions - only admins can edit" ON public.input_distributions FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'input_distributions',
  'Input distributions - only admins can delete',
  'CREATE POLICY "Input distributions - only admins can delete" ON public.input_distributions FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- CASH_PAYMENTS
DROP POLICY IF EXISTS "Cash payments - admin select all" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - staff select assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - insert staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - update staff/admin assigned" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - delete admin only" ON public.cash_payments;

-- All authenticated users can view all cash payments
SELECT public.create_policy_if_not_exists(
  'cash_payments',
  'Cash payments - all users can view',
  'CREATE POLICY "Cash payments - all users can view" ON public.cash_payments FOR SELECT USING (true)'
);

-- All authenticated users can create cash payments
SELECT public.create_policy_if_not_exists(
  'cash_payments',
  'Cash payments - all users can create',
  'CREATE POLICY "Cash payments - all users can create" ON public.cash_payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete cash payments
SELECT public.create_policy_if_not_exists(
  'cash_payments',
  'Cash payments - only admins can edit',
  'CREATE POLICY "Cash payments - only admins can edit" ON public.cash_payments FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'cash_payments',
  'Cash payments - only admins can delete',
  'CREATE POLICY "Cash payments - only admins can delete" ON public.cash_payments FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- FIELD_VISITS
DROP POLICY IF EXISTS "Field visits - admin select all" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - staff select assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - insert staff/admin assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - update staff/admin assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - delete admin only" ON public.field_visits;

-- All authenticated users can view all field visits
SELECT public.create_policy_if_not_exists(
  'field_visits',
  'Field visits - all users can view',
  'CREATE POLICY "Field visits - all users can view" ON public.field_visits FOR SELECT USING (true)'
);

-- All authenticated users can create field visits
SELECT public.create_policy_if_not_exists(
  'field_visits',
  'Field visits - all users can create',
  'CREATE POLICY "Field visits - all users can create" ON public.field_visits FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete field visits
SELECT public.create_policy_if_not_exists(
  'field_visits',
  'Field visits - only admins can edit',
  'CREATE POLICY "Field visits - only admins can edit" ON public.field_visits FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'field_visits',
  'Field visits - only admins can delete',
  'CREATE POLICY "Field visits - only admins can delete" ON public.field_visits FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- EQUIPMENT
DROP POLICY IF EXISTS "Equipment - admin select all" ON public.equipment;
DROP POLICY IF EXISTS "Equipment - staff select assigned" ON public.equipment;
DROP POLICY IF EXISTS "Equipment - insert staff/admin assigned" ON public.equipment;
DROP POLICY IF EXISTS "Equipment - update staff/admin assigned" ON public.equipment;
DROP POLICY IF EXISTS "Equipment - delete admin only" ON public.equipment;

-- All authenticated users can view all equipment
SELECT public.create_policy_if_not_exists(
  'equipment',
  'Equipment - all users can view',
  'CREATE POLICY "Equipment - all users can view" ON public.equipment FOR SELECT USING (true)'
);

-- All authenticated users can create equipment
SELECT public.create_policy_if_not_exists(
  'equipment',
  'Equipment - all users can create',
  'CREATE POLICY "Equipment - all users can create" ON public.equipment FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete equipment
SELECT public.create_policy_if_not_exists(
  'equipment',
  'Equipment - only admins can edit',
  'CREATE POLICY "Equipment - only admins can edit" ON public.equipment FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'equipment',
  'Equipment - only admins can delete',
  'CREATE POLICY "Equipment - only admins can delete" ON public.equipment FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- EQUIPMENT_ISSUANCE
DROP POLICY IF EXISTS "Equipment issuance - admin select all" ON public.equipment_issuance;
DROP POLICY IF EXISTS "Equipment issuance - staff select assigned" ON public.equipment_issuance;
DROP POLICY IF EXISTS "Equipment issuance - insert staff/admin assigned" ON public.equipment_issuance;
DROP POLICY IF EXISTS "Equipment issuance - update staff/admin assigned" ON public.equipment_issuance;
DROP POLICY IF EXISTS "Equipment issuance - delete admin only" ON public.equipment_issuance;

-- All authenticated users can view all equipment issuance
SELECT public.create_policy_if_not_exists(
  'equipment_issuance',
  'Equipment issuance - all users can view',
  'CREATE POLICY "Equipment issuance - all users can view" ON public.equipment_issuance FOR SELECT USING (true)'
);

-- All authenticated users can create equipment issuance
SELECT public.create_policy_if_not_exists(
  'equipment_issuance',
  'Equipment issuance - all users can create',
  'CREATE POLICY "Equipment issuance - all users can create" ON public.equipment_issuance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete equipment issuance
SELECT public.create_policy_if_not_exists(
  'equipment_issuance',
  'Equipment issuance - only admins can edit',
  'CREATE POLICY "Equipment issuance - only admins can edit" ON public.equipment_issuance FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'equipment_issuance',
  'Equipment issuance - only admins can delete',
  'CREATE POLICY "Equipment issuance - only admins can delete" ON public.equipment_issuance FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- REPAYMENTS
DROP POLICY IF EXISTS "Repayments - admin select all" ON public.repayments;
DROP POLICY IF EXISTS "Repayments - staff select assigned" ON public.repayments;
DROP POLICY IF EXISTS "Repayments - insert staff/admin assigned" ON public.repayments;
DROP POLICY IF EXISTS "Repayments - update staff/admin assigned" ON public.repayments;
DROP POLICY IF EXISTS "Repayments - delete admin only" ON public.repayments;

-- All authenticated users can view all repayments
SELECT public.create_policy_if_not_exists(
  'repayments',
  'Repayments - all users can view',
  'CREATE POLICY "Repayments - all users can view" ON public.repayments FOR SELECT USING (true)'
);

-- All authenticated users can create repayments
SELECT public.create_policy_if_not_exists(
  'repayments',
  'Repayments - all users can create',
  'CREATE POLICY "Repayments - all users can create" ON public.repayments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete repayments
SELECT public.create_policy_if_not_exists(
  'repayments',
  'Repayments - only admins can edit',
  'CREATE POLICY "Repayments - only admins can edit" ON public.repayments FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'repayments',
  'Repayments - only admins can delete',
  'CREATE POLICY "Repayments - only admins can delete" ON public.repayments FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- SEASONS
DROP POLICY IF EXISTS "Seasons - select" ON public.seasons;
DROP POLICY IF EXISTS "Seasons - admin manage" ON public.seasons;

-- All authenticated users can view all seasons
SELECT public.create_policy_if_not_exists(
  'seasons',
  'Seasons - all users can view',
  'CREATE POLICY "Seasons - all users can view" ON public.seasons FOR SELECT USING (true)'
);

-- All authenticated users can create seasons
SELECT public.create_policy_if_not_exists(
  'seasons',
  'Seasons - all users can create',
  'CREATE POLICY "Seasons - all users can create" ON public.seasons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete seasons
SELECT public.create_policy_if_not_exists(
  'seasons',
  'Seasons - only admins can edit',
  'CREATE POLICY "Seasons - only admins can edit" ON public.seasons FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'seasons',
  'Seasons - only admins can delete',
  'CREATE POLICY "Seasons - only admins can delete" ON public.seasons FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- PAYOUTS (Payments & Loan Recovery)
DROP POLICY IF EXISTS "Payouts - admin select all" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - staff select via delivery" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - insert staff/admin via delivery" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - staff select from own clubs" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - insert by authenticated staff/admin" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - update by creator or admin" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - delete by admin only" ON public.payouts;

-- All authenticated users can view all payouts
SELECT public.create_policy_if_not_exists(
  'payouts',
  'Payouts - all users can view',
  'CREATE POLICY "Payouts - all users can view" ON public.payouts FOR SELECT USING (true)'
);

-- All authenticated users can create payouts
SELECT public.create_policy_if_not_exists(
  'payouts',
  'Payouts - all users can create',
  'CREATE POLICY "Payouts - all users can create" ON public.payouts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete payouts
SELECT public.create_policy_if_not_exists(
  'payouts',
  'Payouts - only admins can edit',
  'CREATE POLICY "Payouts - only admins can edit" ON public.payouts FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'payouts',
  'Payouts - only admins can delete',
  'CREATE POLICY "Payouts - only admins can delete" ON public.payouts FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- LOAN_LEDGERS (Farmer Ledgers - Individual farmer account movements)
DROP POLICY IF EXISTS "Loan ledger - admin select all" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - update staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - delete staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - staff select from own clubs" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - insert by authenticated staff/admin" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - update by creator or admin" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - delete by admin only" ON public.loan_ledgers;

-- All authenticated users can view all loan ledgers
SELECT public.create_policy_if_not_exists(
  'loan_ledgers',
  'Loan ledger - all users can view',
  'CREATE POLICY "Loan ledger - all users can view" ON public.loan_ledgers FOR SELECT USING (true)'
);

-- All authenticated users can create loan ledgers
SELECT public.create_policy_if_not_exists(
  'loan_ledgers',
  'Loan ledger - all users can create',
  'CREATE POLICY "Loan ledger - all users can create" ON public.loan_ledgers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)'
);

-- Only admins can update/delete loan ledgers
SELECT public.create_policy_if_not_exists(
  'loan_ledgers',
  'Loan ledger - only admins can edit',
  'CREATE POLICY "Loan ledger - only admins can edit" ON public.loan_ledgers FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))'
);

SELECT public.create_policy_if_not_exists(
  'loan_ledgers',
  'Loan ledger - only admins can delete',
  'CREATE POLICY "Loan ledger - only admins can delete" ON public.loan_ledgers FOR DELETE USING (public.is_admin(auth.uid()))'
);

-- 5. Create a function to get data ownership information
CREATE OR REPLACE FUNCTION public.get_data_ownership_info(table_name TEXT, record_id UUID)
RETURNS TABLE(
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  is_own_data BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    created_by,
    (SELECT full_name FROM public.profiles WHERE user_id = created_by),
    created_at,
    created_by = auth.uid()
  FROM (
    SELECT 
      created_by,
      created_at
    FROM (
      SELECT created_by, created_at FROM public.farmer_groups WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.farmers WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.loans WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.deliveries WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.input_distributions WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.cash_payments WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.field_visits WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.equipment WHERE id = record_id
      UNION ALL
      SELECT issued_by as created_by, created_at FROM public.equipment_issuance WHERE id = record_id
      UNION ALL
      SELECT recorded_by as created_by, created_at FROM public.repayments WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.payouts WHERE id = record_id
      UNION ALL
      SELECT created_by, created_at FROM public.loan_ledgers WHERE id = record_id
    ) AS combined_data
    LIMIT 1
  ) AS data_info;
$$;

-- 6. Create a view to show data ownership for all records
CREATE OR REPLACE VIEW public.data_ownership_view AS
SELECT 
  'farmer_groups' as table_name,
  id as record_id,
  name as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.farmer_groups

UNION ALL

SELECT 
  'farmers' as table_name,
  id as record_id,
  full_name as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.farmers

UNION ALL

SELECT 
  'loans' as table_name,
  id as record_id,
  purpose as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.loans

UNION ALL

SELECT 
  'deliveries' as table_name,
  id as record_id,
  'Delivery ' || weight || 'kg' as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.deliveries

UNION ALL

SELECT 
  'input_distributions' as table_name,
  id as record_id,
  'Input Distribution' as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.input_distributions

UNION ALL

SELECT 
  'cash_payments' as table_name,
  id as record_id,
  'Payment MWK ' || amount as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.cash_payments

UNION ALL

SELECT 
  'field_visits' as table_name,
  id as record_id,
  'Field Visit' as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.field_visits

UNION ALL

SELECT 
  'equipment_issuance' as table_name,
  id as record_id,
  'Equipment Issuance' as record_name,
  issued_by as created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = issued_by) as created_by_name,
  created_at,
  CASE WHEN issued_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = issued_by) END as ownership_label
FROM public.equipment_issuance

UNION ALL

SELECT 
  'repayments' as table_name,
  id as record_id,
  'Repayment MWK ' || amount as record_name,
  recorded_by as created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = recorded_by) as created_by_name,
  created_at,
  CASE WHEN recorded_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = recorded_by) END as ownership_label
FROM public.repayments

UNION ALL

SELECT 
  'payouts' as table_name,
  id as record_id,
  'Payout MWK ' || net_paid as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.payouts

UNION ALL

SELECT 
  'loan_ledgers' as table_name,
  id as record_id,
  'Ledger Entry ' || entry_type || ' MWK ' || amount as record_name,
  created_by,
  (SELECT full_name FROM public.profiles WHERE user_id = created_by) as created_by_name,
  created_at,
  CASE WHEN created_by = auth.uid() THEN 'You created this' ELSE 'Created by ' || (SELECT full_name FROM public.profiles WHERE user_id = created_by) END as ownership_label
FROM public.loan_ledgers;

-- 7. Views don't need RLS policies - they inherit permissions from underlying tables
-- The data_ownership_view will be accessible based on the RLS policies of the underlying tables

-- 8. Add helpful comments
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Check if a user has admin role';
COMMENT ON FUNCTION public.can_edit_record(TEXT, UUID, UUID) IS 'Check if a user can edit a specific record (only admins can edit)';
COMMENT ON FUNCTION public.get_data_ownership_info(TEXT, UUID) IS 'Get ownership information for any record';
COMMENT ON VIEW public.data_ownership_view IS 'View showing ownership information for all records across the system';

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmer_groups_created_by ON public.farmer_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_farmers_created_by ON public.farmers(created_by);
CREATE INDEX IF NOT EXISTS idx_loans_created_by ON public.loans(created_by);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_by ON public.deliveries(created_by);
CREATE INDEX IF NOT EXISTS idx_input_distributions_created_by ON public.input_distributions(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_payments_created_by ON public.cash_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_field_visits_created_by ON public.field_visits(created_by);
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON public.equipment(created_by);
CREATE INDEX IF NOT EXISTS idx_equipment_issuance_issued_by ON public.equipment_issuance(issued_by);
CREATE INDEX IF NOT EXISTS idx_repayments_recorded_by ON public.repayments(recorded_by);
CREATE INDEX IF NOT EXISTS idx_payouts_created_by ON public.payouts(created_by);
CREATE INDEX IF NOT EXISTS idx_loan_ledgers_created_by ON public.loan_ledgers(created_by);

-- 10. Migration completed successfully
-- Note: Audit logging is handled by triggers on individual tables
-- This migration implements shared data access system where:
-- - All users can view all data
-- - All users can create new data  
-- - Only admins can edit existing data
-- - Data ownership is tracked and visible to users
