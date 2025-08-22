-- Fix Total Members display issue
-- This creates triggers to automatically update total_members when farmers are added/removed

-- Function to update total_members count for a club
CREATE OR REPLACE FUNCTION public.update_club_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total_members for the affected club
  IF TG_OP = 'INSERT' THEN
    -- When a farmer is added
    UPDATE public.farmer_groups 
    SET total_members = (
      SELECT COUNT(*) 
      FROM public.farmers 
      WHERE farmer_group_id = NEW.farmer_group_id
    )
    WHERE id = NEW.farmer_group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- When a farmer is removed
    UPDATE public.farmer_groups 
    SET total_members = (
      SELECT COUNT(*) 
      FROM public.farmers 
      WHERE farmer_group_id = OLD.farmer_group_id
    )
    WHERE id = OLD.farmer_group_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- When a farmer is moved to a different club
    IF OLD.farmer_group_id != NEW.farmer_group_id THEN
      -- Update old club count
      UPDATE public.farmer_groups 
      SET total_members = (
        SELECT COUNT(*) 
        FROM public.farmers 
        WHERE farmer_group_id = OLD.farmer_group_id
      )
      WHERE id = OLD.farmer_group_id;
      
      -- Update new club count
      UPDATE public.farmer_groups 
      SET total_members = (
        SELECT COUNT(*) 
        FROM public.farmers 
        WHERE farmer_group_id = NEW.farmer_group_id
      )
      WHERE id = NEW.farmer_group_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for farmers table
DROP TRIGGER IF EXISTS update_club_member_count_insert ON public.farmers;
CREATE TRIGGER update_club_member_count_insert
  AFTER INSERT ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_club_member_count();

DROP TRIGGER IF EXISTS update_club_member_count_delete ON public.farmers;
CREATE TRIGGER update_club_member_count_delete
  AFTER DELETE ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_club_member_count();

DROP TRIGGER IF EXISTS update_club_member_count_update ON public.farmers;
CREATE TRIGGER update_club_member_count_update
  AFTER UPDATE ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_club_member_count();

-- Update existing clubs with correct member counts
UPDATE public.farmer_groups 
SET total_members = (
  SELECT COUNT(*) 
  FROM public.farmers 
  WHERE farmer_group_id = farmer_groups.id
);

-- Also create a function to manually recalculate all club member counts
CREATE OR REPLACE FUNCTION public.recalculate_all_club_member_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.farmer_groups 
  SET total_members = (
    SELECT COUNT(*) 
    FROM public.farmers 
    WHERE farmer_group_id = farmer_groups.id
  );
END;
$$;
