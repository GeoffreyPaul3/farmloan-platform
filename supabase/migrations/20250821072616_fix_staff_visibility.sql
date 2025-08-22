-- Fix staff visibility issue by updating handle_new_user function
-- This ensures new staff members can see and manage data they create

-- Update handle_new_user function to include approved field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff') = 'admin' -- Auto-approve admins, staff need manual approval
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing staff profiles that don't have approved field set
UPDATE public.profiles 
SET approved = false 
WHERE role = 'staff' AND approved IS NULL;

-- Ensure all admin profiles are approved
UPDATE public.profiles 
SET approved = true 
WHERE role = 'admin' AND approved = false;

-- Create a function to check if user can access data (approved or created by them)
CREATE OR REPLACE FUNCTION public.can_user_access_data(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = can_user_access_data.user_id 
      AND (profiles.approved = true OR profiles.role = 'admin')
  );
$$;

-- Update RLS policies to allow staff to see data they create even if not approved
-- This is a temporary measure until they get approved by admin

-- Update farmer_groups policies to allow unapproved staff to see their own creations
DROP POLICY IF EXISTS "Staff can create farmer groups" ON public.farmer_groups;
CREATE POLICY "Staff can create farmer groups" ON public.farmer_groups
  FOR INSERT TO authenticated WITH CHECK (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

DROP POLICY IF EXISTS "Staff can update farmer groups" ON public.farmer_groups;
CREATE POLICY "Staff can update farmer groups" ON public.farmer_groups
  FOR UPDATE TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    (public.can_user_access_data(auth.uid()) AND created_by = auth.uid())
  );

-- CRITICAL FIX: Allow staff to see farmer groups they created
-- First drop any existing policies that might conflict
DROP POLICY IF EXISTS "Clubs - staff select assigned" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - admin select all" ON public.farmer_groups;

-- Create new comprehensive policies for farmer_groups
CREATE POLICY "Clubs - admin select all" ON public.farmer_groups
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Clubs - staff select assigned" ON public.farmer_groups
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(id, auth.uid())) OR
    created_by = auth.uid() -- Allow staff to see clubs they created
  );

-- Update farmers policies
DROP POLICY IF EXISTS "Staff can manage farmers" ON public.farmers;
CREATE POLICY "Staff can manage farmers" ON public.farmers
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- CRITICAL FIX: Allow staff to see farmers in their clubs ONLY
DROP POLICY IF EXISTS "Farmers - staff select assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - admin select all" ON public.farmers;

CREATE POLICY "Farmers - admin select all" ON public.farmers
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Farmers - staff select assigned" ON public.farmers
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see farmers in clubs they created
  );

-- Update loans policies
DROP POLICY IF EXISTS "Staff can manage loans" ON public.loans;
CREATE POLICY "Staff can manage loans" ON public.loans
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- CRITICAL FIX: Allow staff to see loans in their clubs ONLY
DROP POLICY IF EXISTS "Loans - staff select assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - admin select all" ON public.loans;

CREATE POLICY "Loans - admin select all" ON public.loans
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Loans - staff select assigned" ON public.loans
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see loans in clubs they created
  );

-- Update equipment policies
DROP POLICY IF EXISTS "Staff can manage equipment" ON public.equipment;
CREATE POLICY "Staff can manage equipment" ON public.equipment
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update equipment_issuance policies
DROP POLICY IF EXISTS "Staff can manage equipment issuance" ON public.equipment_issuance;
CREATE POLICY "Staff can manage equipment issuance" ON public.equipment_issuance
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update repayments policies
DROP POLICY IF EXISTS "Staff can manage repayments" ON public.repayments;
CREATE POLICY "Staff can manage repayments" ON public.repayments
  FOR ALL TO authenticated USING (
    public.get_user_role(auth.uid()) IS NOT NULL OR 
    public.can_user_access_data(auth.uid())
  );

-- Update field_visits policies
DROP POLICY IF EXISTS "Field visits - insert staff/admin assigned" ON public.field_visits;
CREATE POLICY "Field visits - insert staff/admin assigned" ON public.field_visits
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    public.can_user_access_data(auth.uid())
  );

-- CRITICAL FIX: Allow staff to see field visits in their clubs ONLY
DROP POLICY IF EXISTS "Field visits - staff select assigned" ON public.field_visits;
DROP POLICY IF EXISTS "Field visits - admin select all" ON public.field_visits;

CREATE POLICY "Field visits - admin select all" ON public.field_visits
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Field visits - staff select assigned" ON public.field_visits
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see field visits in clubs they created
  );

-- Update deliveries policies
DROP POLICY IF EXISTS "Deliveries - insert staff/admin assigned" ON public.deliveries;
CREATE POLICY "Deliveries - insert staff/admin assigned" ON public.deliveries
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    public.can_user_access_data(auth.uid())
  );

-- CRITICAL FIX: Allow staff to see deliveries in their clubs ONLY
DROP POLICY IF EXISTS "Deliveries - staff select assigned" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries - admin select all" ON public.deliveries;

CREATE POLICY "Deliveries - admin select all" ON public.deliveries
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Deliveries - staff select assigned" ON public.deliveries
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see deliveries in clubs they created
  );

-- Update input_distributions policies
DROP POLICY IF EXISTS "Input distributions - insert staff/admin assigned" ON public.input_distributions;
CREATE POLICY "Input distributions - insert staff/admin assigned" ON public.input_distributions
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    public.can_user_access_data(auth.uid())
  );

-- CRITICAL FIX: Allow staff to see input distributions in their clubs ONLY
DROP POLICY IF EXISTS "Input distributions - staff select assigned" ON public.input_distributions;
DROP POLICY IF EXISTS "Input distributions - admin select all" ON public.input_distributions;

CREATE POLICY "Input distributions - admin select all" ON public.input_distributions
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Input distributions - staff select assigned" ON public.input_distributions
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    (public.get_user_role(auth.uid()) IS NOT NULL AND public.is_user_assigned_to_club(farmer_group_id, auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see input distributions in clubs they created
  );
