-- Migration: Implement stock consolidation and automatic deduction
-- This migration adds automatic stock consolidation when creating stock with same item_id and unit_cost
-- and automatic stock deduction when distributing inputs

-- Function to consolidate stock when adding new stock with same item_id and unit_cost
CREATE OR REPLACE FUNCTION public.consolidate_input_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_stock_id UUID;
  existing_quantity NUMERIC;
BEGIN
  -- Check if there's existing stock with the same item_id and unit_cost
  SELECT id, quantity INTO existing_stock_id, existing_quantity
  FROM public.input_stock
  WHERE item_id = NEW.item_id 
    AND unit_cost = NEW.unit_cost
    AND id != NEW.id
    AND season_id = NEW.season_id
  LIMIT 1;
  
  -- If found, consolidate by updating existing record and deleting the new one
  IF existing_stock_id IS NOT NULL THEN
    -- Update existing stock with combined quantity
    UPDATE public.input_stock 
    SET 
      quantity = quantity + NEW.quantity,
      updated_at = NOW()
    WHERE id = existing_stock_id;
    
    -- Delete the new record since we consolidated it
    DELETE FROM public.input_stock WHERE id = NEW.id;
    
    -- Return NULL to prevent the insert
    RETURN NULL;
  END IF;
  
  -- If no consolidation needed, proceed with normal insert
  RETURN NEW;
END; $$;

-- Function to automatically deduct stock when distributing inputs
CREATE OR REPLACE FUNCTION public.deduct_input_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  remaining_quantity NUMERIC := NEW.quantity;
  stock_record RECORD;
  deduction_amount NUMERIC;
BEGIN
  -- Get available stock for this item, ordered by received_date (FIFO)
  FOR stock_record IN 
    SELECT id, quantity, unit_cost
    FROM public.input_stock
    WHERE item_id = NEW.item_id 
      AND quantity > 0
    ORDER BY received_date ASC
  LOOP
    -- Calculate how much to deduct from this stock record
    deduction_amount := LEAST(stock_record.quantity, remaining_quantity);
    
    -- Update the stock record
    UPDATE public.input_stock
    SET 
      quantity = quantity - deduction_amount,
      updated_at = NOW()
    WHERE id = stock_record.id;
    
    -- Reduce remaining quantity to distribute
    remaining_quantity := remaining_quantity - deduction_amount;
    
    -- If we've distributed all the quantity, break
    IF remaining_quantity <= 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Check if we have enough stock
  IF remaining_quantity > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for item %: requested %, available %', 
      NEW.item_id, 
      NEW.quantity, 
      NEW.quantity - remaining_quantity;
  END IF;
  
  RETURN NEW;
END; $$;

-- Function to get available stock for an item
CREATE OR REPLACE FUNCTION public.get_available_stock(item_uuid UUID)
RETURNS NUMERIC LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM public.input_stock
  WHERE item_id = item_uuid;
$$;

-- Function to check if there's sufficient stock before distribution
CREATE OR REPLACE FUNCTION public.check_stock_availability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  available_stock NUMERIC;
BEGIN
  -- Get available stock for this item
  SELECT public.get_available_stock(NEW.item_id) INTO available_stock;
  
  -- Check if we have enough stock
  IF NEW.quantity > available_stock THEN
    RAISE EXCEPTION 'Insufficient stock for distribution: requested %, available %', 
      NEW.quantity, 
      available_stock;
  END IF;
  
  RETURN NEW;
END; $$;

-- Create triggers for stock consolidation
DROP TRIGGER IF EXISTS consolidate_stock_trigger ON public.input_stock;
CREATE TRIGGER consolidate_stock_trigger
  BEFORE INSERT ON public.input_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.consolidate_input_stock();

-- Create triggers for stock deduction
DROP TRIGGER IF EXISTS check_stock_before_distribution ON public.input_distributions;
CREATE TRIGGER check_stock_before_distribution
  BEFORE INSERT ON public.input_distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_stock_availability();

DROP TRIGGER IF EXISTS deduct_stock_after_distribution ON public.input_distributions;
CREATE TRIGGER deduct_stock_after_distribution
  AFTER INSERT ON public.input_distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_input_stock();

-- Create a view for stock summary with available quantities
CREATE OR REPLACE VIEW public.input_stock_summary AS
SELECT 
  ii.id as item_id,
  ii.name as item_name,
  ii.category,
  ii.unit,
  COALESCE(SUM(stock.quantity), 0) as total_quantity,
  COALESCE(SUM(stock.quantity * COALESCE(stock.unit_cost, 0)), 0) as total_value,
  COUNT(DISTINCT stock.id) as stock_records_count,
  MIN(stock.received_date) as first_received_date,
  MAX(stock.received_date) as last_received_date
FROM public.input_items ii
LEFT JOIN public.input_stock stock ON ii.id = stock.item_id
WHERE ii.active = true
GROUP BY ii.id, ii.name, ii.category, ii.unit
ORDER BY ii.name;

-- Grant permissions on the view
GRANT SELECT ON public.input_stock_summary TO authenticated;

-- Create a function to get stock movement history
CREATE OR REPLACE FUNCTION public.get_stock_movement_history(
  item_uuid UUID DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  type TEXT,
  quantity NUMERIC,
  unit_cost NUMERIC,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT 
    received_date as date,
    'Stock Added' as type,
    quantity,
    unit_cost,
    id as reference_id,
    'input_stock' as reference_type,
    notes
  FROM public.input_stock
  WHERE (item_uuid IS NULL OR item_id = item_uuid)
    AND (start_date IS NULL OR received_date >= start_date)
    AND (end_date IS NULL OR received_date <= end_date)
  
  UNION ALL
  
  SELECT 
    distribution_date as date,
    'Stock Distributed' as type,
    -quantity as quantity,
    NULL as unit_cost,
    id as reference_id,
    'input_distributions' as reference_type,
    notes
  FROM public.input_distributions
  WHERE (item_uuid IS NULL OR item_id = item_uuid)
    AND (start_date IS NULL OR distribution_date >= start_date)
    AND (end_date IS NULL OR distribution_date <= end_date)
  
  ORDER BY date DESC, type;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_input_stock_item_cost_season 
ON public.input_stock(item_id, unit_cost, season_id);

CREATE INDEX IF NOT EXISTS idx_input_stock_received_date 
ON public.input_stock(received_date);

CREATE INDEX IF NOT EXISTS idx_input_distributions_item_date 
ON public.input_distributions(item_id, distribution_date);

-- Migration completed successfully
-- Note: Audit log entry skipped due to action type constraint
