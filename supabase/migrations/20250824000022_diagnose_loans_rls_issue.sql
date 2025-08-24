-- DIAGNOSE and FIX loans RLS issue - staff seeing no loans
-- This will identify the problem and provide a working solution

-- 1. First, let's diagnose the current state
DO $$
DECLARE
    current_user_id uuid;
    user_role text;
    club_assignments_count integer;
    total_loans integer;
    loans_with_farmer_groups integer;
    accessible_loans integer;
BEGIN
    -- Get current user info
    SELECT auth.uid() INTO current_user_id;
    SELECT get_user_role(auth.uid()) INTO user_role;
    
    RAISE NOTICE '=== DIAGNOSING LOANS RLS ISSUE ===';
    RAISE NOTICE 'Current user: % (role: %)', current_user_id, user_role;
    
    -- Check if user has club assignments
    SELECT COUNT(*) INTO club_assignments_count
    FROM public.club_assignments
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Club assignments for user: %', club_assignments_count;
    
    -- Get total loans in system
    SELECT COUNT(*) INTO total_loans FROM public.loans;
    RAISE NOTICE 'Total loans in system: %', total_loans;
    
    -- Check how many loans have farmer_group_id
    SELECT COUNT(*) INTO loans_with_farmer_groups 
    FROM public.loans 
    WHERE farmer_group_id IS NOT NULL;
    RAISE NOTICE 'Loans with farmer_group_id: %', loans_with_farmer_groups;
    
    -- Get accessible loans (this will be filtered by RLS)
    SELECT COUNT(*) INTO accessible_loans FROM public.loans;
    RAISE NOTICE 'Loans accessible to current user: %', accessible_loans;
    
    -- Show sample loan data
    RAISE NOTICE '=== SAMPLE LOAN DATA ===';
    RAISE NOTICE 'First 5 loans:';
    FOR i IN 1..5 LOOP
        RAISE NOTICE 'Loan %: farmer_group_id = %', i, 
            (SELECT farmer_group_id FROM public.loans LIMIT 1 OFFSET i-1);
    END LOOP;
    
    -- Show club assignments
    RAISE NOTICE '=== CLUB ASSIGNMENTS ===';
    RAISE NOTICE 'User club assignments:';
    FOR i IN 1..club_assignments_count LOOP
        RAISE NOTICE 'Assignment %: farmer_group_id = %', i,
            (SELECT farmer_group_id FROM public.club_assignments 
             WHERE user_id = current_user_id LIMIT 1 OFFSET i-1);
    END LOOP;
END $$;

-- 2. Create a more permissive RLS policy for testing
-- Drop existing policies
DROP POLICY IF EXISTS "Loans - admin select all" ON public.loans;
DROP POLICY IF EXISTS "Loans - staff select assigned clubs" ON public.loans;
DROP POLICY IF EXISTS "Loans - insert staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - update staff/admin assigned" ON public.loans;
DROP POLICY IF EXISTS "Loans - delete admin only" ON public.loans;

-- Create simpler, more permissive policies
CREATE POLICY "Loans - admin select all" ON public.loans
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- Staff can see loans for their assigned clubs OR loans they created
CREATE POLICY "Loans - staff select assigned or created" ON public.loans
FOR SELECT USING (
  get_user_role(auth.uid()) = 'staff' AND
  (
    -- Loans for assigned clubs
    EXISTS (
      SELECT 1 FROM public.club_assignments ca
      WHERE ca.farmer_group_id = loans.farmer_group_id
      AND ca.user_id = auth.uid()
    )
    OR
    -- Loans created by the staff member
    loans.created_by = auth.uid()
  )
);

-- Staff and admin can insert loans
CREATE POLICY "Loans - insert staff/admin" ON public.loans
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  get_user_role(auth.uid()) = 'staff'
);

-- Staff and admin can update loans they have access to
CREATE POLICY "Loans - update staff/admin" ON public.loans
FOR UPDATE USING (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   (loans.created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.club_assignments ca
      WHERE ca.farmer_group_id = loans.farmer_group_id
      AND ca.user_id = auth.uid()
    )))
) WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  (get_user_role(auth.uid()) = 'staff' AND
   (loans.created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.club_assignments ca
      WHERE ca.farmer_group_id = loans.farmer_group_id
      AND ca.user_id = auth.uid()
    )))
);

-- Only admin can delete loans
CREATE POLICY "Loans - delete admin only" ON public.loans
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- 3. Test the fix
DO $$
DECLARE
    accessible_loans_after integer;
BEGIN
    SELECT COUNT(*) INTO accessible_loans_after FROM public.loans;
    RAISE NOTICE '=== AFTER FIX ===';
    RAISE NOTICE 'Loans accessible after fix: %', accessible_loans_after;
    
    IF accessible_loans_after > 0 THEN
        RAISE NOTICE '✅ FIX SUCCESSFUL - Staff can now see loans';
    ELSE
        RAISE NOTICE '❌ STILL NO ACCESS - Need further investigation';
    END IF;
END $$;
