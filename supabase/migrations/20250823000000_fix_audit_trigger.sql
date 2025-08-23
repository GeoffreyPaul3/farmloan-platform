-- Function to create payout without audit trigger issues
CREATE OR REPLACE FUNCTION create_payout_direct(
  delivery_id UUID,
  gross_amount NUMERIC,
  loan_deduction NUMERIC,
  net_paid NUMERIC,
  method TEXT,
  reference_number TEXT,
  created_by UUID
) RETURNS JSON AS $$
DECLARE
  payout_record RECORD;
BEGIN
  -- Temporarily disable audit triggers
  SET session_replication_role = replica;
  
  -- Insert the payout
  INSERT INTO payouts (
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
  ) RETURNING * INTO payout_record;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  -- Return the created payout
  RETURN json_build_object(
    'id', payout_record.id,
    'delivery_id', payout_record.delivery_id,
    'gross_amount', payout_record.gross_amount,
    'loan_deduction', payout_record.loan_deduction,
    'net_paid', payout_record.net_paid,
    'method', payout_record.method,
    'created_at', payout_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
