-- Restore input_distributions to working state
-- This temporarily disables the audit trigger that's causing the ambiguous column reference

-- 1. Drop the audit trigger for input_distributions (this was causing the issue)
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;

-- 2. Re-enable RLS for input_distributions (restore original security)
ALTER TABLE public.input_distributions ENABLE ROW LEVEL SECURITY;

-- 3. Recreate the original RLS policies for input_distributions
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

CREATE POLICY "Input dist - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input dist - staff select assigned" ON public.input_distributions
FOR SELECT USING (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

CREATE POLICY "Input dist - insert staff/admin assigned" ON public.input_distributions
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin' OR public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

CREATE POLICY "Input dist - update staff/admin assigned" ON public.input_distributions
FOR UPDATE USING (get_user_role(auth.uid()) = 'admin' OR public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
WITH CHECK (get_user_role(auth.uid()) = 'admin' OR public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

CREATE POLICY "Input dist - delete staff/admin assigned" ON public.input_distributions
FOR DELETE USING (get_user_role(auth.uid()) = 'admin' OR public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

-- 4. Ensure the updated_at trigger is working (this was part of the original working state)
DROP TRIGGER IF EXISTS input_distributions_set_updated_at ON public.input_distributions;
CREATE TRIGGER input_distributions_set_updated_at
BEFORE UPDATE ON public.input_distributions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Recreate audit triggers for other tables (but NOT input_distributions)
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
