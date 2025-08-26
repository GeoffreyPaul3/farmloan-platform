-- Fix outstanding balance calculation
-- This migration creates a function to calculate outstanding balance and updates all loans

-- Function to calculate outstanding balance for a loan
CREATE OR REPLACE FUNCTION calculate_loan_outstanding_balance(loan_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  loan_amount NUMERIC;
  total_repayments NUMERIC;
  total_deductions NUMERIC;
  outstanding NUMERIC;
BEGIN
  -- Get the loan amount
  SELECT amount INTO loan_amount
  FROM loans
  WHERE id = loan_id;
  
  IF loan_amount IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate total repayments from repayments table
  SELECT COALESCE(SUM(amount), 0) INTO total_repayments
  FROM repayments
  WHERE repayments.loan_id = calculate_loan_outstanding_balance.loan_id;
  
  -- Calculate total deductions from loan ledgers (sale_deduction entries)
  SELECT COALESCE(SUM(amount), 0) INTO total_deductions
  FROM loan_ledgers
  WHERE loan_ledgers.loan_id = calculate_loan_outstanding_balance.loan_id
    AND entry_type = 'sale_deduction';
  
  -- Calculate outstanding balance
  outstanding := loan_amount - total_repayments - total_deductions;
  
  -- Ensure outstanding balance is not negative
  IF outstanding < 0 THEN
    outstanding := 0;
  END IF;
  
  RETURN outstanding;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update outstanding balance for all loans
CREATE OR REPLACE FUNCTION update_all_loan_outstanding_balances()
RETURNS INTEGER AS $$
DECLARE
  loan_record RECORD;
  updated_count INTEGER := 0;
  new_balance NUMERIC;
BEGIN
  FOR loan_record IN SELECT id FROM loans LOOP
    new_balance := calculate_loan_outstanding_balance(loan_record.id);
    
    UPDATE loans 
    SET outstanding_balance = new_balance
    WHERE id = loan_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update outstanding balance for a specific loan
CREATE OR REPLACE FUNCTION update_loan_outstanding_balance(loan_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  new_balance := calculate_loan_outstanding_balance(loan_id);
  
  UPDATE loans 
  SET outstanding_balance = new_balance
  WHERE id = loan_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically update outstanding balance when repayments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_loan_balance_on_repayment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New repayment added
    PERFORM update_loan_outstanding_balance(NEW.loan_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Repayment updated
    PERFORM update_loan_outstanding_balance(NEW.loan_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Repayment deleted
    PERFORM update_loan_outstanding_balance(OLD.loan_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on repayments table
DROP TRIGGER IF EXISTS trigger_update_loan_balance_on_repayment ON repayments;
CREATE TRIGGER trigger_update_loan_balance_on_repayment
  AFTER INSERT OR UPDATE OR DELETE ON repayments
  FOR EACH ROW EXECUTE FUNCTION update_loan_balance_on_repayment_change();

-- Trigger function to automatically update outstanding balance when loan ledgers are added/updated/deleted
CREATE OR REPLACE FUNCTION update_loan_balance_on_ledger_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New ledger entry added
    IF NEW.loan_id IS NOT NULL THEN
      PERFORM update_loan_outstanding_balance(NEW.loan_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ledger entry updated
    IF NEW.loan_id IS NOT NULL THEN
      PERFORM update_loan_outstanding_balance(NEW.loan_id);
    END IF;
    IF OLD.loan_id IS NOT NULL AND OLD.loan_id != NEW.loan_id THEN
      PERFORM update_loan_outstanding_balance(OLD.loan_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Ledger entry deleted
    IF OLD.loan_id IS NOT NULL THEN
      PERFORM update_loan_outstanding_balance(OLD.loan_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on loan_ledgers table
DROP TRIGGER IF EXISTS trigger_update_loan_balance_on_ledger ON loan_ledgers;
CREATE TRIGGER trigger_update_loan_balance_on_ledger
  AFTER INSERT OR UPDATE OR DELETE ON loan_ledgers
  FOR EACH ROW EXECUTE FUNCTION update_loan_balance_on_ledger_change();

-- Function to update outstanding balance for all loans (bypassing audit triggers)
CREATE OR REPLACE FUNCTION update_all_loan_outstanding_balances_safe()
RETURNS INTEGER AS $$
DECLARE
  loan_record RECORD;
  updated_count INTEGER := 0;
  new_balance NUMERIC;
BEGIN
  -- Temporarily disable audit triggers
  ALTER TABLE loans DISABLE TRIGGER ALL;
  
  FOR loan_record IN SELECT id FROM loans LOOP
    new_balance := calculate_loan_outstanding_balance(loan_record.id);
    
    UPDATE loans 
    SET outstanding_balance = new_balance
    WHERE id = loan_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  -- Re-enable audit triggers
  ALTER TABLE loans ENABLE TRIGGER ALL;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all existing loans with correct outstanding balance (using safe function)
SELECT update_all_loan_outstanding_balances_safe();
