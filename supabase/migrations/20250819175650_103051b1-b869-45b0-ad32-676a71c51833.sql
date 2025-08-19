-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'staff');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmer groups table
CREATE TABLE public.farmer_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_members INTEGER NOT NULL DEFAULT 0,
  credit_score DECIMAL(3,2) DEFAULT 0.00 CHECK (credit_score >= 0 AND credit_score <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create individual farmers table
CREATE TABLE public.farmers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_group_id UUID NOT NULL REFERENCES public.farmer_groups(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  national_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  farm_size_acres DECIMAL(10,2),
  crops_grown TEXT[],
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_group_id UUID NOT NULL REFERENCES public.farmer_groups(id),
  loan_type TEXT NOT NULL CHECK (loan_type IN ('seasonal', 'equipment', 'emergency', 'development')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 12.00 CHECK (interest_rate >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  disbursement_date DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted')),
  outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL,
  collateral_description TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tractors', 'plows', 'harvesters', 'irrigation', 'tools', 'other')),
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'maintenance', 'retired')),
  location TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment issuance table
CREATE TABLE public.equipment_issuance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id),
  farmer_group_id UUID NOT NULL REFERENCES public.farmer_groups(id),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  condition_at_issue TEXT NOT NULL CHECK (condition_at_issue IN ('excellent', 'good', 'fair', 'poor')),
  condition_at_return TEXT CHECK (condition_at_return IN ('excellent', 'good', 'fair', 'poor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  notes TEXT,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  returned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repayments table
CREATE TABLE public.repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'produce_sale', 'offset')),
  reference_number TEXT,
  receipt_number TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_issuance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE profiles.user_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Farmer groups policies
CREATE POLICY "Authenticated users can view farmer groups" ON public.farmer_groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create farmer groups" ON public.farmer_groups
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Staff can update farmer groups" ON public.farmer_groups
  FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Farmers policies
CREATE POLICY "Authenticated users can view farmers" ON public.farmers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage farmers" ON public.farmers
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Loans policies
CREATE POLICY "Authenticated users can view loans" ON public.loans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage loans" ON public.loans
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Equipment policies
CREATE POLICY "Authenticated users can view equipment" ON public.equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage equipment" ON public.equipment
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Equipment issuance policies
CREATE POLICY "Authenticated users can view equipment issuance" ON public.equipment_issuance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage equipment issuance" ON public.equipment_issuance
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Repayments policies
CREATE POLICY "Authenticated users can view repayments" ON public.repayments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage repayments" ON public.repayments
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IS NOT NULL);

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmer_groups_updated_at
  BEFORE UPDATE ON public.farmer_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_issuance_updated_at
  BEFORE UPDATE ON public.equipment_issuance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();