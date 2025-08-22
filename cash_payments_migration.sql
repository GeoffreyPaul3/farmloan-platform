-- Cash Payments Migration
-- This adds support for cash payments that can be either loans or grants

-- Create cash payments table
CREATE TABLE IF NOT EXISTS public.cash_payments (
  id uuid primary key default gen_random_uuid(),
  farmer_group_id uuid not null references public.farmer_groups(id) on delete restrict,
  farmer_id uuid references public.farmers(id) on delete set null,
  amount numeric not null check (amount > 0),
  payment_type text not null check (payment_type in ('loan', 'grant')),
  payment_method text not null check (payment_method in ('cash', 'bank')),
  bank_details text, -- For bank payments
  payment_date date not null default current_date,
  season_id uuid references public.seasons(id) on delete set null,
  loan_id uuid references public.loans(id) on delete set null, -- If payment_type is 'loan'
  purpose text not null,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.cash_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cash payments
CREATE POLICY "Cash payments - admin select all" ON public.cash_payments
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Cash payments - staff select assigned" ON public.cash_payments
FOR SELECT USING (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

CREATE POLICY "Cash payments - insert staff/admin assigned" ON public.cash_payments
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(farmer_group_id, auth.uid())
);

CREATE POLICY "Cash payments - update staff/admin assigned" ON public.cash_payments
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(farmer_group_id, auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(farmer_group_id, auth.uid())
);

CREATE POLICY "Cash payments - delete staff/admin assigned" ON public.cash_payments
FOR DELETE USING (
  get_user_role(auth.uid()) = 'admin' 
  OR public.is_user_assigned_to_club(farmer_group_id, auth.uid())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_payments_farmer_group_id ON public.cash_payments(farmer_group_id);
CREATE INDEX IF NOT EXISTS idx_cash_payments_farmer_id ON public.cash_payments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cash_payments_payment_date ON public.cash_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_cash_payments_payment_type ON public.cash_payments(payment_type);

-- Create trigger for updated_at
CREATE TRIGGER cash_payments_set_updated_at
BEFORE UPDATE ON public.cash_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create automatic loan for cash payment
CREATE OR REPLACE FUNCTION public.create_cash_payment_loan(
  payment_id uuid,
  farmer_group_id uuid,
  farmer_id uuid,
  amount numeric,
  purpose text,
  payment_date date,
  created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loan_id uuid;
  farmer_name text;
  club_name text;
  purpose_text text;
BEGIN
  -- Get farmer name if specified
  IF farmer_id IS NOT NULL THEN
    SELECT full_name INTO farmer_name
    FROM public.farmers
    WHERE id = create_cash_payment_loan.farmer_id;
  END IF;
  
  -- Get club name
  SELECT name INTO club_name
  FROM public.farmer_groups
  WHERE id = create_cash_payment_loan.farmer_group_id;
  
  -- Set purpose text
  IF farmer_id IS NOT NULL THEN
    purpose_text := format('Cash payment: %s to %s of %s', purpose, farmer_name, club_name);
  ELSE
    purpose_text := format('Cash payment: %s to %s', purpose, club_name);
  END IF;
  
  -- Create the loan
  INSERT INTO public.loans (
    farmer_group_id,
    loan_type,
    amount,
    interest_rate,
    duration_months,
    disbursement_date,
    status,
    outstanding_balance,
    purpose,
    collateral_description,
    created_by
  ) VALUES (
    create_cash_payment_loan.farmer_group_id,
    'seasonal',
    amount,
    12.00, -- Default interest rate
    12, -- Default duration 12 months
    payment_date,
    'disbursed', -- Automatically disbursed since it's a cash payment
    amount, -- Outstanding balance equals loan amount
    purpose_text,
    format('Cash payment ID: %s', payment_id),
    create_cash_payment_loan.created_by
  ) RETURNING id INTO loan_id;
  
  -- Create loan ledger entry for the farmer if specified
  IF farmer_id IS NOT NULL THEN
    INSERT INTO public.loan_ledgers (
      farmer_id,
      loan_id,
      entry_type,
      amount,
      balance_after,
      reference_table,
      reference_id,
      created_by
    ) VALUES (
      create_cash_payment_loan.farmer_id,
      loan_id,
      'loan_disbursed',
      amount,
      amount,
      'cash_payments',
      payment_id,
      create_cash_payment_loan.created_by
    );
  END IF;
  
  RETURN loan_id;
END;
$$;

-- Trigger function to create loan for cash payments
CREATE OR REPLACE FUNCTION public.before_cash_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loan_id uuid;
BEGIN
  -- If payment type is loan, create automatic loan
  IF NEW.payment_type = 'loan' THEN
    SELECT public.create_cash_payment_loan(
      NEW.id,
      NEW.farmer_group_id,
      NEW.farmer_id,
      NEW.amount,
      NEW.purpose,
      NEW.payment_date,
      NEW.created_by
    ) INTO loan_id;
    
    -- Store the loan ID in the cash payment record
    NEW.loan_id := loan_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER before_cash_payment_insert_trigger
  BEFORE INSERT ON public.cash_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.before_cash_payment_insert();
