-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.create_payout_direct(UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, UUID);

-- Create the create_payout_direct function for processing payments
-- This function bypasses audit triggers to avoid foreign key constraint issues

CREATE OR REPLACE FUNCTION public.create_payout_direct(
  delivery_id UUID,
  gross_amount NUMERIC,
  loan_deduction NUMERIC,
  net_paid NUMERIC,
  method TEXT,
  reference_number TEXT,
  created_by UUID
)
RETURNS UUID AS $$
DECLARE
  payout_id UUID;
BEGIN
  -- Insert payout record directly without triggering audit logs
  INSERT INTO public.payouts (
    delivery_id,
    gross_amount,
    loan_deduction,
    net_paid,
    method,
    reference_number,
    created_by
  ) VALUES (
    delivery_id,
    gross_amount,
    loan_deduction,
    net_paid,
    method,
    reference_number,
    created_by
  ) RETURNING id INTO payout_id;
  
  RETURN payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
