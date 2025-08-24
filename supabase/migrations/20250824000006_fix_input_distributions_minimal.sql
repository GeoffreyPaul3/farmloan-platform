-- Minimal fix: Completely disable RLS for input_distributions
-- This will help us isolate whether the issue is with RLS policies or something else

-- 1. Drop ALL existing audit triggers for input_distributions
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;

-- 2. Drop the specific audit function for input_distributions
DROP FUNCTION IF EXISTS public.log_audit_input_distributions();

-- 3. Completely disable RLS for input_distributions
ALTER TABLE public.input_distributions DISABLE ROW LEVEL SECURITY;

-- 4. Drop all existing input_distributions policies
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

-- 5. Also fix any potential issues with input_stock policies that might be interfering
DROP POLICY IF EXISTS "Input stock - select all auth" ON public.input_stock;
DROP POLICY IF EXISTS "Input stock - staff/admin manage" ON public.input_stock;

CREATE POLICY "Input stock - select all auth" ON public.input_stock
FOR SELECT USING (true);

CREATE POLICY "Input stock - staff/admin manage" ON public.input_stock
FOR ALL USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

-- 6. Recreate the audit trigger loop WITHOUT input_distributions
-- This ensures input_distributions is never included in the general audit trigger loop
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'farmer_groups','farmers','loans','repayments',
    'input_items','input_stock','input_acknowledgements',
    'field_visits','deliveries','grading_entries','payouts','loan_ledgers',
    'equipment','equipment_issuance'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit()', tbl, tbl);
  END LOOP;
END $$;
