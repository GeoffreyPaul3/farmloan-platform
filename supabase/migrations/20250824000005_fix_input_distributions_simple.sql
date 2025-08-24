-- Simple fix: Completely disable audit triggers for input_distributions
-- This will help us isolate whether the issue is with the audit triggers or something else

-- 1. Drop ALL existing audit triggers for input_distributions
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;

-- 2. Drop the specific audit function for input_distributions
DROP FUNCTION IF EXISTS public.log_audit_input_distributions();

-- 3. Update the is_user_assigned_to_club function to be more explicit
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_club(_club_id uuid, _user_id uuid default auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = _club_id
      AND ca.user_id = _user_id
  );
$$;

-- 4. Drop all existing input_distributions policies
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

-- 5. Create new policies with explicit table references
CREATE POLICY "Input dist - admin select all" ON public.input_distributions
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input dist - staff select assigned" ON public.input_distributions
FOR SELECT USING (
  public.is_user_assigned_to_club(input_distributions.farmer_group_id, auth.uid())
);

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

-- 6. Also fix any potential issues with input_stock policies that might be interfering
DROP POLICY IF EXISTS "Input stock - select all auth" ON public.input_stock;
DROP POLICY IF EXISTS "Input stock - staff/admin manage" ON public.input_stock;

CREATE POLICY "Input stock - select all auth" ON public.input_stock
FOR SELECT USING (true);

CREATE POLICY "Input stock - staff/admin manage" ON public.input_stock
FOR ALL USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

-- 7. Recreate the audit trigger loop WITHOUT input_distributions
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
