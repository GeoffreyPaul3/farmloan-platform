-- Function to create payout with proper audit logging
CREATE OR REPLACE FUNCTION create_payout_with_audit(
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
  audit_user_id UUID;
BEGIN
  -- Set the user context for audit triggers
  -- Use the created_by parameter as the audit user
  audit_user_id := created_by;
  
  -- Set the user context for the current session
  PERFORM set_config('request.jwt.claims', json_build_object('sub', audit_user_id::text), false);
  
  -- Insert the payout (this will now trigger audit logs with proper user context)
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

-- Also create a function to update loan balances with audit logging
CREATE OR REPLACE FUNCTION update_loan_balance_with_audit(
  loan_id UUID,
  new_balance NUMERIC,
  created_by UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Set the user context for audit triggers
  PERFORM set_config('request.jwt.claims', json_build_object('sub', created_by::text), false);
  
  -- Update the loan balance (this will trigger audit logs)
  UPDATE loans 
  SET outstanding_balance = new_balance
  WHERE id = loan_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create loan ledger entry with audit logging
CREATE OR REPLACE FUNCTION create_loan_ledger_with_audit(
  farmer_id UUID,
  season_id UUID,
  loan_id UUID,
  entry_type TEXT,
  amount NUMERIC,
  balance_after NUMERIC,
  reference_table TEXT,
  reference_id UUID,
  created_by UUID
) RETURNS JSON AS $$
DECLARE
  ledger_record RECORD;
BEGIN
  -- Set the user context for audit triggers
  PERFORM set_config('request.jwt.claims', json_build_object('sub', created_by::text), false);
  
  -- Insert the loan ledger entry (this will trigger audit logs)
  INSERT INTO loan_ledgers (
    farmer_id,
    season_id,
    loan_id,
    entry_type,
    amount,
    balance_after,
    reference_table,
    reference_id,
    created_by
  ) VALUES (
    farmer_id,
    season_id,
    loan_id,
    entry_type,
    amount,
    balance_after,
    reference_table,
    reference_id,
    created_by
  ) RETURNING * INTO ledger_record;
  
  -- Return the created ledger entry
  RETURN json_build_object(
    'id', ledger_record.id,
    'farmer_id', ledger_record.farmer_id,
    'loan_id', ledger_record.loan_id,
    'entry_type', ledger_record.entry_type,
    'amount', ledger_record.amount,
    'balance_after', ledger_record.balance_after,
    'created_at', ledger_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
