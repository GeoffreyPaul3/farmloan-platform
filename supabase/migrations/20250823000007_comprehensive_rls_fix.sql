-- Comprehensive RLS fix for all tables
-- This migration ensures staff only see their own data while admins see everything
-- Applies to: deliveries, loans, input_distributions, field_visits, cash_payments, etc.

-- Enable RLS on all tables
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.input_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_ledgers ENABLE ROW LEVEL SECURITY;

-- ===== DELIVERIES =====
-- Drop existing policies
DROP POLICY IF EXISTS "Deliveries - admin select all" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - staff select assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - insert staff/admin assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - update staff/admin assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - delete staff/admin assigned" ON public.deliveries;

-- Create new policies for deliveries (no created_by column, use officer_id)
CREATE POLICY "Deliveries - admin select all" ON public.deliveries
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Deliveries - staff select from own clubs" ON public.deliveries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Deliveries - insert by authenticated staff/admin" ON public.deliveries
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Deliveries - update by officer or admin" ON public.deliveries
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR officer_id = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR officer_id = auth.uid()
);

CREATE POLICY "Deliveries - delete by admin only" ON public.deliveries
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== LOANS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Loans - admin select all" ON public.loans;
DROP POLICY IF EXISTS "Loans - staff select assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - insert staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - update staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - delete staff/admin assigned" ON public.loans;

-- Create new policies for loans
CREATE POLICY "Loans - admin select all" ON public.loans
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Loans - staff select from own clubs" ON public.loans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Loans - insert by authenticated staff/admin" ON public.loans
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Loans - update by creator or admin" ON public.loans
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Loans - delete by admin only" ON public.loans
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== INPUT DISTRIBUTIONS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Input distributions - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - delete staff/admin assigned" ON public.input_distributions;

-- Create new policies for input_distributions (no created_by column, use distributed_by)
CREATE POLICY "Input distributions - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input distributions - staff select from own clubs" ON public.input_distributions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Input distributions - insert by authenticated staff/admin" ON public.input_distributions
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Input distributions - update by distributor or admin" ON public.input_distributions
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR distributed_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR distributed_by = auth.uid()
);

CREATE POLICY "Input distributions - delete by admin only" ON public.input_distributions
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== FIELD VISITS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Field visits - admin select all" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - staff select assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - insert staff/admin assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - update staff/admin assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - delete staff/admin assigned" ON public.field_visits;

-- Create new policies for field_visits
CREATE POLICY "Field visits - admin select all" ON public.field_visits
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Field visits - staff select from own clubs" ON public.field_visits
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Field visits - insert by authenticated staff/admin" ON public.field_visits
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Field visits - update by creator or admin" ON public.field_visits
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Field visits - delete by admin only" ON public.field_visits
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== CASH PAYMENTS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Cash payments - admin select all" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - staff select all" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - insert by authenticated staff/admin" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - update by authenticated staff/admin" ON public.cash_payments;
DROP POLICY IF EXISTS "Cash payments - delete by admin only" ON public.cash_payments;

-- Create new policies for cash_payments
CREATE POLICY "Cash payments - admin select all" ON public.cash_payments
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Cash payments - staff select from own clubs" ON public.cash_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Cash payments - insert by authenticated staff/admin" ON public.cash_payments
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Cash payments - update by creator or admin" ON public.cash_payments
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Cash payments - delete by admin only" ON public.cash_payments
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== PAYOUTS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Payouts - admin select all" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - staff select via delivery" ON public.payouts;
DROP POLICY IF EXISTS "Payouts - insert staff/admin via delivery" ON public.payouts;

-- Create new policies for payouts
CREATE POLICY "Payouts - admin select all" ON public.payouts
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Payouts - staff select from own clubs" ON public.payouts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.deliveries d
    JOIN public.farmer_groups fg ON fg.id = d.farmer_group_id
    WHERE d.id = delivery_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Payouts - insert by authenticated staff/admin" ON public.payouts
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Payouts - update by creator or admin" ON public.payouts
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Payouts - delete by admin only" ON public.payouts
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ===== LOAN LEDGERS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Loan ledger - admin select all" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - staff select assigned via farmer group" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - insert staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - update staff/admin assigned" ON public.loan_ledgers;
DROP POLICY IF EXISTS "Loan ledger - delete staff/admin assigned" ON public.loan_ledgers;

-- Create new policies for loan_ledgers
CREATE POLICY "Loan ledger - admin select all" ON public.loan_ledgers
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Loan ledger - staff select from own clubs" ON public.loan_ledgers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmers f
    JOIN public.farmer_groups fg ON fg.id = f.farmer_group_id
    WHERE f.id = farmer_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Loan ledger - insert by authenticated staff/admin" ON public.loan_ledgers
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Loan ledger - update by creator or admin" ON public.loan_ledgers
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Loan ledger - delete by admin only" ON public.loan_ledgers
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
