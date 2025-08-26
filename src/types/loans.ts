// Extended loan types to include joined data
import { Database } from '@/integrations/supabase/types';

type LoanRow = Database['public']['Tables']['loans']['Row'];
type FarmerGroupRow = Database['public']['Tables']['farmer_groups']['Row'];

// Extended loan type with joined farmer_groups data
export interface LoanWithRelations extends LoanRow {
  farmer_groups?: {
    name: string;
  } | null;
}

// Extended delivery type to include missing properties
export interface DeliveryWithRelations {
  id: string;
  created_at: string;
  delivery_date: string;
  farmer_group_id: string;
  farmer_id: string;
  gross_amount: number;
  officer_id: string;
  price_per_kg: number;
  season_id: string;
  updated_at: string;
  weight: number;
  farmers?: {
    full_name: string;
  } | null;
  farmer_groups?: {
    name: string;
  } | null;
  grade?: string; // Optional property
  loan_offset?: number; // Optional property
}

// Extended input item type
export interface InputItemWithRelations {
  name: string;
  unit_price?: number; // Optional property
}

// Extended input distribution type
export interface InputDistributionWithRelations {
  id: string;
  farmer_group_id: string;
  farmer_id?: string;
  item_id: string;
  quantity: number;
  distribution_date: string;
  season_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  farmers?: {
    full_name: string;
  } | null;
  farmer_groups?: {
    name: string;
  } | null;
  input_items?: InputItemWithRelations | null;
}
