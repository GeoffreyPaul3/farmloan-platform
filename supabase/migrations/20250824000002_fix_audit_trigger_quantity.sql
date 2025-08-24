-- Fix the audit trigger that's causing ambiguous column reference
-- The issue is in the log_audit function when converting records to JSONB

-- Drop the existing audit trigger for input_distributions
DROP TRIGGER IF EXISTS input_distributions_audit ON public.input_distributions;

-- Create a new, more specific audit trigger for input_distributions
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

-- Create the new audit trigger for input_distributions
CREATE TRIGGER input_distributions_audit 
AFTER INSERT OR UPDATE OR DELETE ON public.input_distributions 
FOR EACH ROW EXECUTE FUNCTION public.log_audit_input_distributions();
