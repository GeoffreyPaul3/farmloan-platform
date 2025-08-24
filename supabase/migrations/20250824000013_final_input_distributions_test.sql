-- Final test to verify the input_distributions fix works with real data
-- This test will use actual existing data instead of fake UUIDs

-- 1. First, let's check what triggers exist on input_distributions (should be minimal now)
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== Final check: triggers on input_distributions ===';
  
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
  
  -- If no triggers found, that's good!
  IF NOT FOUND THEN
    RAISE NOTICE 'No user triggers found on input_distributions - this is GOOD!';
  END IF;
END $$;

-- 2. Test with real data - get actual item_id and farmer_group_id
CREATE OR REPLACE FUNCTION test_input_distributions_with_real_data()
RETURNS void AS $$
DECLARE
  real_item_id uuid;
  real_farmer_group_id uuid;
  real_user_id uuid;
BEGIN
  -- Get a real item_id
  SELECT id INTO real_item_id FROM public.input_items LIMIT 1;
  
  -- Get a real farmer_group_id
  SELECT id INTO real_farmer_group_id FROM public.farmer_groups LIMIT 1;
  
  -- Get a real user_id (or use a test one)
  SELECT auth.uid() INTO real_user_id;
  
  -- If we don't have real data, create some test data
  IF real_item_id IS NULL THEN
    INSERT INTO public.input_items (name, description, unit, unit_cost) 
    VALUES ('Test Item', 'Test Description', 'kg', 10.00)
    RETURNING id INTO real_item_id;
  END IF;
  
  IF real_farmer_group_id IS NULL THEN
    INSERT INTO public.farmer_groups (name, contact_person, contact_phone, traditional_authority, epa, notes, created_by) 
    VALUES ('Test Group', 'Test Contact', '123456789', 'Test Authority', 'Test EPA', 'Test Notes', real_user_id)
    RETURNING id INTO real_farmer_group_id;
  END IF;
  
  IF real_user_id IS NULL THEN
    real_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;
  
  RAISE NOTICE 'Using real_item_id: %', real_item_id;
  RAISE NOTICE 'Using real_farmer_group_id: %', real_farmer_group_id;
  RAISE NOTICE 'Using real_user_id: %', real_user_id;
  
  -- Test the insert with real data
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
    real_item_id,
    real_farmer_group_id,
    NULL,
    10.5,
    CURRENT_DATE,
    real_user_id,
    NULL,
    'Test distribution - REAL DATA - SUCCESS!'
  );
  
  -- Clean up the test record
  DELETE FROM public.input_distributions WHERE notes = 'Test distribution - REAL DATA - SUCCESS!';
  
  RAISE NOTICE '✅ SUCCESS: Input distributions are working correctly!';
  RAISE NOTICE '✅ The ambiguous column reference issue has been RESOLVED!';
  RAISE NOTICE '✅ You can now record input distributions in your application.';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
    RAISE NOTICE '❌ The issue might still exist.';
END;
$$ LANGUAGE plpgsql;

-- 3. Run the test
SELECT test_input_distributions_with_real_data();

-- 4. Clean up the test function
DROP FUNCTION IF EXISTS test_input_distributions_with_real_data();
