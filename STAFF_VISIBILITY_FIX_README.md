# Staff Visibility Fix

## Problem
Staff members were unable to see or manage data they create because the system requires users to be approved before they can access data. However, new staff members need to be able to create and see data while waiting for admin approval.

**SPECIFIC ISSUE**: Staff members who register clubs cannot see them because the RLS policies were too restrictive and didn't allow staff to see data they created.

## Root Cause
The `get_user_role` function only returns a role for users with `approved = true`, but the `handle_new_user` function wasn't setting the `approved` field properly. This created a chicken-and-egg problem where staff couldn't see anything because they weren't approved, but they needed to be able to work while waiting for approval.

Additionally, the RLS policies for SELECT operations were too restrictive and didn't allow staff to see the clubs and data they created.

## Solution
The fix includes:

1. **Updated `handle_new_user` function** - Now properly sets the `approved` field (auto-approves admins, staff need manual approval)
2. **New `can_user_access_data` function** - Allows staff to access data even if not approved
3. **Updated RLS policies** - Allow unapproved staff to see and manage data they create
4. **Updated `get_user_role` function** - More permissive for staff who have created data
5. **CRITICAL FIX: Updated SELECT policies** - Allow staff to see clubs they created and all related data (farmers, loans, field visits, deliveries, etc.)

## How to Apply the Fix

### Option 1: Run the SQL manually (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix_staff_visibility_manual.sql`
4. Run the SQL

### Option 2: Use Supabase CLI
```bash
npx supabase db push
```

## What This Fixes
- Staff members can now see and manage data they create even before being approved
- **Staff can now see the clubs they register** (this was the main issue)
- Staff can see farmers, loans, field visits, deliveries, and other data in their clubs
- New staff registrations properly set the `approved` field
- Admins are automatically approved
- Staff still need admin approval for full access, but can work with their own data
- All existing RLS policies are updated to support this workflow

## Testing
After applying the fix:
1. Create a new staff account
2. Register a new club
3. **Verify the staff can see the club they just created** (this was failing before)
4. Add farmers to the club
5. Verify they can see the farmers in their club
6. Verify admins can still approve/reject staff accounts
7. Verify approved staff have full access to all data

## Files Modified
- `fix_staff_visibility_manual.sql` - Main fix file with critical SELECT policy updates
- `supabase/migrations/20250821072616_fix_staff_visibility.sql` - Migration file (if using CLI)

## Key Changes Made
The most important changes are the SELECT policies that now allow staff to see data they created:

```sql
-- Allow staff to see clubs they created
CREATE POLICY "Clubs - staff select assigned" ON public.farmer_groups
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    public.is_user_assigned_to_club(id, auth.uid()) OR
    created_by = auth.uid() -- Allow staff to see clubs they created
  );

-- Allow staff to see farmers in their clubs
CREATE POLICY "Farmers - staff select assigned" ON public.farmers
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin' OR 
    public.is_user_assigned_to_club(farmer_group_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.farmer_groups fg 
      WHERE fg.id = farmer_group_id AND fg.created_by = auth.uid()
    ) -- Allow staff to see farmers in clubs they created
  );
```

## Notes
- This fix maintains security while allowing staff to work before approval
- Staff can only see data they create until approved
- Admins retain full control over the approval process
- All existing functionality remains intact
- **The fix specifically addresses the issue where staff couldn't see clubs they registered**
