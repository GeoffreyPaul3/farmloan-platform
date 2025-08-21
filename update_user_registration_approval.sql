-- Update user registration to require admin approval
-- Run this SQL in your Supabase SQL Editor

-- Update the handle_new_user function to set approved as false by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'staff'::user_role,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles to set approved = false for non-admin users
UPDATE public.profiles 
SET approved = false 
WHERE role = 'staff' AND approved IS NULL;

-- Ensure the get_user_role function only returns roles for approved users
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE profiles.user_id = $1
      AND profiles.approved = true
  );
END;
$$;
