
-- 1) Add approval gating to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Update get_user_role to only return a role for approved users
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE profiles.user_id = $1
      AND profiles.approved = true
  );
END;
$function$;

-- Allow admins to update any profile (needed for approvals and role changes)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Promote the specified email to admin and approved
UPDATE public.profiles
SET role = 'admin', approved = true
WHERE email = 'geofreypaul40@gmail.com';

-- 2) Prevent duplicate/ghost national IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_farmers_national_id_unique
ON public.farmers (national_id)
WHERE national_id IS NOT NULL;

-- 3) Add foreign keys required for relational selects + useful indexes

-- Farmers -> Farmer Groups
ALTER TABLE public.farmers
  ADD CONSTRAINT farmers_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_farmers_farmer_group_id ON public.farmers(farmer_group_id);

-- Deliveries -> Farmers, Farmer Groups, Seasons
ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_farmer_id_fkey
  FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE RESTRICT,
  ADD CONSTRAINT deliveries_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT,
  ADD CONSTRAINT deliveries_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deliveries_farmer_id ON public.deliveries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_farmer_group_id ON public.deliveries(farmer_group_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_season_id ON public.deliveries(season_id);

-- Grading entries -> Deliveries
ALTER TABLE public.grading_entries
  ADD CONSTRAINT grading_entries_delivery_id_fkey
  FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_grading_entries_delivery_id ON public.grading_entries(delivery_id);

-- Payouts -> Deliveries
ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_delivery_id_fkey
  FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payouts_delivery_id ON public.payouts(delivery_id);

-- Field visits -> Farmers, Farmer Groups, Seasons
ALTER TABLE public.field_visits
  ADD CONSTRAINT field_visits_farmer_id_fkey
  FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE RESTRICT,
  ADD CONSTRAINT field_visits_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT,
  ADD CONSTRAINT field_visits_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_field_visits_farmer_id ON public.field_visits(farmer_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_farmer_group_id ON public.field_visits(farmer_group_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_season_id ON public.field_visits(season_id);

-- Input stock -> Input items, Seasons
ALTER TABLE public.input_stock
  ADD CONSTRAINT input_stock_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.input_items(id) ON DELETE RESTRICT,
  ADD CONSTRAINT input_stock_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_input_stock_item_id ON public.input_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_input_stock_season_id ON public.input_stock(season_id);

-- Input distributions -> Input items, Farmer groups, Farmers, Seasons
ALTER TABLE public.input_distributions
  ADD CONSTRAINT input_distributions_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.input_items(id) ON DELETE RESTRICT,
  ADD CONSTRAINT input_distributions_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT,
  ADD CONSTRAINT input_distributions_farmer_id_fkey
  FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE SET NULL,
  ADD CONSTRAINT input_distributions_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_input_distributions_item_id ON public.input_distributions(item_id);
CREATE INDEX IF NOT EXISTS idx_input_distributions_farmer_group_id ON public.input_distributions(farmer_group_id);
CREATE INDEX IF NOT EXISTS idx_input_distributions_farmer_id ON public.input_distributions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_input_distributions_season_id ON public.input_distributions(season_id);

-- Loans -> Farmer groups
ALTER TABLE public.loans
  ADD CONSTRAINT loans_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_loans_farmer_group_id ON public.loans(farmer_group_id);

-- Loan ledgers -> Farmers, Loans, Seasons
ALTER TABLE public.loan_ledgers
  ADD CONSTRAINT loan_ledgers_farmer_id_fkey
  FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE RESTRICT,
  ADD CONSTRAINT loan_ledgers_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE SET NULL,
  ADD CONSTRAINT loan_ledgers_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loan_ledgers_farmer_id ON public.loan_ledgers(farmer_id);
CREATE INDEX IF NOT EXISTS idx_loan_ledgers_loan_id ON public.loan_ledgers(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_ledgers_season_id ON public.loan_ledgers(season_id);

-- Equipment issuance -> Equipment, Farmer groups
ALTER TABLE public.equipment_issuance
  ADD CONSTRAINT equipment_issuance_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE RESTRICT,
  ADD CONSTRAINT equipment_issuance_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_equipment_issuance_equipment_id ON public.equipment_issuance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_issuance_farmer_group_id ON public.equipment_issuance(farmer_group_id);

-- Club assignments -> Farmer groups
ALTER TABLE public.club_assignments
  ADD CONSTRAINT club_assignments_farmer_group_id_fkey
  FOREIGN KEY (farmer_group_id) REFERENCES public.farmer_groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_club_assignments_farmer_group_id ON public.club_assignments(farmer_group_id);
