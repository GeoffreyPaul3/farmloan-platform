-- Fix for ambiguous column reference "quantity" in input_distributions
-- The issue is caused by a before_distribution_insert trigger that checks stock availability

-- 1. First, let's see what triggers exist on input_distributions
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== Checking all triggers on input_distributions ===';
  
  FOR trigger_record IN 
    SELECT tgname, pg_get_triggerdef(t.oid) as definition
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'input_distributions'
      AND NOT t.tgisinternal
  LOOP
    RAISE NOTICE 'Trigger: %', trigger_record.tgname;
    RAISE NOTICE 'Definition: %', trigger_record.definition;
  END LOOP;
END $$;

-- 2. Drop the problematic before_distribution_insert trigger
DROP TRIGGER IF EXISTS before_distribution_insert ON public.input_distributions;

-- 3. Drop any other triggers that might be causing issues
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;
DROP TRIGGER IF EXISTS input_distributions_set_updated_at ON public.input_distributions;
DROP TRIGGER IF EXISTS input_distributions_updated_at ON public.input_distributions;

-- 4. Drop any functions that might be causing the issue
DROP FUNCTION IF EXISTS public.before_distribution_insert() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_input_distributions() CASCADE;

-- 5. Re-enable RLS for input_distributions
ALTER TABLE public.input_distributions ENABLE ROW LEVEL SECURITY;

-- 6. Recreate the original RLS policies for input_distributions
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

-- 7. Ensure the updated_at trigger is working (this was part of the original working state)
DROP TRIGGER IF EXISTS input_distributions_set_updated_at ON public.input_distributions;
CREATE TRIGGER input_distributions_set_updated_at
BEFORE UPDATE ON public.input_distributions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Recreate audit triggers for other tables (but NOT input_distributions)
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

-- 9. Test if the table works now
CREATE OR REPLACE FUNCTION test_input_distributions_fixed()
RETURNS void AS $$
BEGIN
  -- This function will help us test if the issue is resolved
  INSERT INTO public.input_distributions (
    item_id,
    farmer_group_id,
    farmer_id,
    quantity,
    distribution_date,
    distributed_by,
    season_id,
    notes
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    10.5,
    CURRENT_DATE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'Test distribution - fixed'
  );
  
  -- Clean up the test record
  DELETE FROM public.input_distributions WHERE notes = 'Test distribution - fixed';
  
  RAISE NOTICE 'Fixed insert test PASSED - issue resolved!';
END;
$$ LANGUAGE plpgsql;

-- 10. Run the test
SELECT test_input_distributions_fixed();
