-- Fix grading entries RLS policy
-- Run this script in the Supabase SQL editor to fix the 403 error when creating grading entries

-- Drop all existing policies for grading_entries (handle any naming variations)
DROP POLICY IF EXISTS "Grading - admin select all" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - staff select via delivery" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - insert staff/admin via delivery" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - staff select all" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - insert by authenticated staff/admin" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - update by authenticated staff/admin" ON public.grading_entries;
DROP POLICY IF EXISTS "Grading - delete by admin only" ON public.grading_entries;

-- Create new policies that are less restrictive for staff
CREATE POLICY "Grading - admin select all" ON public.grading_entries
FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Grading - staff select all" ON public.grading_entries
FOR SELECT USING (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Grading - insert by authenticated staff/admin" ON public.grading_entries
FOR INSERT WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Grading - update by authenticated staff/admin" ON public.grading_entries
FOR UPDATE USING (get_user_role(auth.uid()) IS NOT NULL)
WITH CHECK (get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Grading - delete by admin only" ON public.grading_entries
FOR DELETE USING (get_user_role(auth.uid()) = 'admin');
