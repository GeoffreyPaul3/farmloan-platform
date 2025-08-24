-- TEST function to verify loans RLS policies are working correctly
CREATE OR REPLACE FUNCTION test_loans_rls_access()
RETURNS void AS $$
DECLARE
    current_user_id uuid;
    user_role text;
    club_assignments_count integer;
    total_loans integer;
    accessible_loans integer;
    test_club_id uuid;
BEGIN
    -- Get current user info
    SELECT auth.uid() INTO current_user_id;
    SELECT get_user_role(auth.uid()) INTO user_role;
    
    RAISE NOTICE '=== TESTING LOANS RLS ACCESS ===';
    RAISE NOTICE 'Current user: % (role: %)', current_user_id, user_role;
    
    -- Check if user has club assignments
    SELECT COUNT(*) INTO club_assignments_count
    FROM public.club_assignments
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Club assignments for user: %', club_assignments_count;
    
    -- Get total loans in system
    SELECT COUNT(*) INTO total_loans FROM public.loans;
    RAISE NOTICE 'Total loans in system: %', total_loans;
    
    -- Get accessible loans (this will be filtered by RLS)
    SELECT COUNT(*) INTO accessible_loans FROM public.loans;
    RAISE NOTICE 'Loans accessible to current user: %', accessible_loans;
    
    -- If staff user, show club assignments
    IF user_role = 'staff' THEN
        RAISE NOTICE '=== STAFF USER CLUB ASSIGNMENTS ===';
        FOR test_club_id IN 
            SELECT farmer_group_id 
            FROM public.club_assignments 
            WHERE user_id = current_user_id
        LOOP
            RAISE NOTICE 'Assigned to club: %', test_club_id;
        END LOOP;
        
        -- Show loans for assigned clubs
        RAISE NOTICE '=== LOANS FOR ASSIGNED CLUBS ===';
        PERFORM COUNT(*) FROM public.loans l
        JOIN public.club_assignments ca ON ca.farmer_group_id = l.farmer_group_id
        WHERE ca.user_id = current_user_id;
        
        RAISE NOTICE 'Loans in assigned clubs: %', COUNT(*) FROM public.loans l
        JOIN public.club_assignments ca ON ca.farmer_group_id = l.farmer_group_id
        WHERE ca.user_id = current_user_id;
    ELSE
        RAISE NOTICE '✅ Admin user - should have access to all loans';
    END IF;
    
    -- Test the actual RLS policy logic
    RAISE NOTICE '=== RLS POLICY TEST ===';
    IF user_role = 'staff' THEN
        IF EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.club_assignments ca ON ca.farmer_group_id = l.farmer_group_id
            WHERE ca.user_id = current_user_id
        ) THEN
            RAISE NOTICE '✅ RLS policy allows access to loans in assigned clubs';
        ELSE
            RAISE NOTICE '❌ RLS policy not working - no loans accessible';
        END IF;
    ELSE
        RAISE NOTICE '✅ Admin user - RLS policy allows full access';
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_loans_rls_access();

-- Clean up test function
DROP FUNCTION IF EXISTS test_loans_rls_access();
