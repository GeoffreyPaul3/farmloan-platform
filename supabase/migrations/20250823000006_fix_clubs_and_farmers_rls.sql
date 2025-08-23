-- Fix clubs and farmers RLS policy for proper hierarchy
-- This migration implements: Staff → Clubs they registered → Farmers in those clubs
-- while admins can see everything

-- Drop existing policies for clubs
DROP POLICY IF EXISTS "Clubs - admin select all" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - staff select assigned" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - insert by staff or admin" ON public.farmer_groups;
DROP POLICY IF EXISTS "Clubs - update staff assigned or admin" ON public.farmer_groups;

-- Create new policies for clubs
CREATE POLICY "Clubs - admin select all" ON public.farmer_groups
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Clubs - staff select own" ON public.farmer_groups
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Clubs - insert by authenticated staff/admin" ON public.farmer_groups
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Clubs - update by creator or admin" ON public.farmer_groups
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Clubs - delete by admin only" ON public.farmer_groups
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- Drop existing policies for farmers
DROP POLICY IF EXISTS "Farmers - admin select all" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - staff select assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - insert staff/admin with assigned club" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - update staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - delete staff/admin assigned" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - staff select own" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - insert by authenticated staff/admin" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - update by creator or admin" ON public.farmers;
DROP POLICY IF EXISTS "Farmers - delete by admin only" ON public.farmers;

-- Create new policies for farmers that respect club hierarchy
CREATE POLICY "Farmers - admin select all" ON public.farmers
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Farmers - staff select from own clubs" ON public.farmers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_groups fg
    WHERE fg.id = farmer_group_id
    AND fg.created_by = auth.uid()
  )
);

CREATE POLICY "Farmers - insert by authenticated staff/admin" ON public.farmers
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Farmers - update by creator or admin" ON public.farmers
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR created_by = auth.uid()
);

CREATE POLICY "Farmers - delete by admin only" ON public.farmers
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
