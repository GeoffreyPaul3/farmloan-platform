-- FINAL FIX for Loans RLS - ensure staff only see loans for their assigned clubs
-- This will completely replace all existing loan policies with correct ones

-- 1. First, drop ALL existing policies on loans table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT polname 
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        WHERE c.relname = 'loans'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.loans', policy_record.polname);
    END LOOP;
END $$;

-- 2. Disable RLS temporarily to clear any cached policies
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 4. Create new policies with proper logic
-- Admin can see all loans
CREATE POLICY "Loans - admin select all" ON public.loans
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Staff can see loans for farmers in their assigned clubs
CREATE POLICY "Loans - staff select assigned clubs" ON public.loans
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  EXISTS (
    SELECT 1 FROM public.club_assignments ca
    WHERE ca.farmer_group_id = loans.farmer_group_id
    AND ca.user_id = auth.uid()
  )
);

-- Staff and admin can insert loans for their assigned farmers
CREATE POLICY "Loans - insert staff/admin assigned" ON public.loans
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

-- Staff and admin can update loans for their assigned farmers
CREATE POLICY "Loans - update staff/admin assigned" ON public.loans
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   EXISTS (
     SELECT 1 FROM public.club_assignments ca
     WHERE ca.farmer_group_id = loans.farmer_group_id
     AND ca.user_id = auth.uid()
   ))
);

-- Only admin can delete loans
CREATE POLICY "Loans - delete admin only" ON public.loans
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- 5. Verify the policies were created correctly
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'loans';
    
    RAISE NOTICE 'Created % policies on loans table', policy_count;
    
    IF policy_count = 5 THEN
        RAISE NOTICE '✅ All loan RLS policies created successfully';
    ELSE
        RAISE NOTICE '❌ Expected 5 policies, found %', policy_count;
    END IF;
END $$;
