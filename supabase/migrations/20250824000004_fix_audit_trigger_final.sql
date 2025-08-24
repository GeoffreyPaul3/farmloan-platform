-- Final fix for the ambiguous column reference issue
-- This removes input_distributions from the general audit trigger loop

-- 1. First, let's update the is_user_assigned_to_club function to be more explicit
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

-- 2. Drop all existing input_distributions policies
DROP POLICY IF EXISTS "Input dist - admin select all" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - insert staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - update staff/admin assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input dist - delete staff/admin assigned" ON public.input_distributions;

-- 3. Create new policies with explicit table references
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

-- 4. Drop ALL existing audit triggers for input_distributions
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;

-- 5. Create a new, more specific audit trigger for input_distributions
CREATE OR REPLACE FUNCTION public.log_audit_input_distributions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_table text := 'input_distributions';
  v_action text := TG_OP;
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
BEGIN
  IF (v_action = 'INSERT') THEN
    -- Explicitly specify the columns to avoid ambiguity
    v_new := jsonb_build_object(
      'id', NEW.id,
      'item_id', NEW.item_id,
      'farmer_group_id', NEW.farmer_group_id,
      'farmer_id', NEW.farmer_id,
      'quantity', NEW.quantity,
      'distribution_date', NEW.distribution_date,
      'distributed_by', NEW.distributed_by,
      'acknowledgement_received', NEW.acknowledgement_received,
      'acknowledgement_path', NEW.acknowledgement_path,
      'season_id', NEW.season_id,
      'notes', NEW.notes,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    );
    v_id := NEW.id;
    INSERT INTO public.audit_logs (table_name, action, record_id, user_id, new_values, created_at)
    VALUES (v_table, v_action, v_id, COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_new, now());
    RETURN NEW;
  ELSIF (v_action = 'UPDATE') THEN
    v_old := jsonb_build_object(
      'id', OLD.id,
      'item_id', OLD.item_id,
      'farmer_group_id', OLD.farmer_group_id,
      'farmer_id', OLD.farmer_id,
      'quantity', OLD.quantity,
      'distribution_date', OLD.distribution_date,
      'distributed_by', OLD.distributed_by,
      'acknowledgement_received', OLD.acknowledgement_received,
      'acknowledgement_path', OLD.acknowledgement_path,
      'season_id', OLD.season_id,
      'notes', OLD.notes,
      'created_at', OLD.created_at,
      'updated_at', OLD.updated_at
    );
    v_new := jsonb_build_object(
      'id', NEW.id,
      'item_id', NEW.item_id,
      'farmer_group_id', NEW.farmer_group_id,
      'farmer_id', NEW.farmer_id,
      'quantity', NEW.quantity,
      'distribution_date', NEW.distribution_date,
      'distributed_by', NEW.distributed_by,
      'acknowledgement_received', NEW.acknowledgement_received,
      'acknowledgement_path', NEW.acknowledgement_path,
      'season_id', NEW.season_id,
      'notes', NEW.notes,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    );
    v_id := NEW.id;
    INSERT INTO public.audit_logs (table_name, action, record_id, user_id, old_values, new_values, created_at)
    VALUES (v_table, v_action, v_id, COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_old, v_new, now());
    RETURN NEW;
  ELSIF (v_action = 'DELETE') THEN
    v_old := jsonb_build_object(
      'id', OLD.id,
      'item_id', OLD.item_id,
      'farmer_group_id', OLD.farmer_group_id,
      'farmer_id', OLD.farmer_id,
      'quantity', OLD.quantity,
      'distribution_date', OLD.distribution_date,
      'distributed_by', OLD.distributed_by,
      'acknowledgement_received', OLD.acknowledgement_received,
      'acknowledgement_path', OLD.acknowledgement_path,
      'season_id', OLD.season_id,
      'notes', OLD.notes,
      'created_at', OLD.created_at,
      'updated_at', OLD.updated_at
    );
    v_id := OLD.id;
    INSERT INTO public.audit_logs (table_name, action, record_id, user_id, old_values, created_at)
    VALUES (v_table, v_action, v_id, COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_old, now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 6. Create the new audit trigger for input_distributions
CREATE TRIGGER input_distributions_audit 
AFTER INSERT OR UPDATE OR DELETE ON public.input_distributions 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_input_distributions();

-- 7. Also fix any potential issues with input_stock policies that might be interfering
DROP POLICY IF EXISTS "Input stock - select all auth" ON public.input_stock;
DROP POLICY IF EXISTS "Input stock - staff/admin manage" ON public.input_stock;

CREATE POLICY "Input stock - select all auth" ON public.input_stock
FOR SELECT USING (true);

CREATE POLICY "Input stock - staff/admin manage" ON public.input_stock
FOR ALL USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

-- 8. Recreate the audit trigger loop WITHOUT input_distributions
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
