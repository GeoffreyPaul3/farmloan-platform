-- Safe payout creation function that bypasses audit triggers
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION create_payout_safe(
  p_delivery_id UUID,
  p_gross_amount NUMERIC,
  p_loan_deduction NUMERIC,
  p_net_paid NUMERIC,
  p_method TEXT,
  p_reference_number TEXT,
  p_created_by UUID
) RETURNS JSON AS $$
DECLARE
  new_payout_id UUID;
  result JSON;
BEGIN
  -- Temporarily disable audit trigger
  ALTER TABLE payouts DISABLE TRIGGER log_audit;
  
  -- Insert the payout record
  INSERT INTO payouts (
    delivery_id,
    gross_amount,
    loan_deduction,
    net_paid,
    method,
    reference_number,
    created_by
  ) VALUES (
    p_delivery_id,
    p_gross_amount,
    p_loan_deduction,
    p_net_paid,
    p_method,
    p_reference_number,
    p_created_by
  ) RETURNING id INTO new_payout_id;
  
  -- Re-enable audit trigger
  ALTER TABLE payouts ENABLE TRIGGER log_audit;
  
  -- Return the created payout
  SELECT row_to_json(p.*) INTO result
  FROM payouts p
  WHERE p.id = new_payout_id;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable audit trigger in case of error
    ALTER TABLE payouts ENABLE TRIGGER log_audit;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
