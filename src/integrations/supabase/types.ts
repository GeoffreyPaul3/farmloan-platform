export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cash_payments: {
        Row: {
          amount: number
          bank_details: string | null
          created_at: string
          created_by: string
          farmer_group_id: string
          farmer_id: string | null
          id: string
          loan_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_type: string
          purpose: string
          season_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_details?: string | null
          created_at?: string
          created_by: string
          farmer_group_id: string
          farmer_id?: string | null
          id?: string
          loan_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_type: string
          purpose: string
          season_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_details?: string | null
          created_at?: string
          created_by?: string
          farmer_group_id?: string
          farmer_id?: string | null
          id?: string
          loan_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_type?: string
          purpose?: string
          season_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_payments_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_payments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_payments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      club_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          farmer_group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          farmer_group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          farmer_group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          created_by: string
          delivery_date: string
          farmer_group_id: string
          farmer_id: string
          gross_amount: number | null
          id: string
          officer_id: string
          price_per_kg: number | null
          season_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          delivery_date?: string
          farmer_group_id: string
          farmer_id: string
          gross_amount?: number | null
          id?: string
          officer_id: string
          price_per_kg?: number | null
          season_id?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_date?: string
          farmer_group_id?: string
          farmer_id?: string
          gross_amount?: number | null
          id?: string
          officer_id?: string
          price_per_kg?: number | null
          season_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          category: string
          condition: string
          created_at: string
          created_by: string
          current_value: number | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: string
          created_at?: string
          created_by: string
          current_value?: number | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string
          created_at?: string
          created_by?: string
          current_value?: number | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_issuance: {
        Row: {
          actual_return_date: string | null
          condition_at_issue: string
          condition_at_return: string | null
          created_at: string
          equipment_id: string
          expected_return_date: string
          farmer_group_id: string
          id: string
          issue_date: string
          issued_by: string
          notes: string | null
          returned_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          condition_at_issue: string
          condition_at_return?: string | null
          created_at?: string
          equipment_id: string
          expected_return_date: string
          farmer_group_id: string
          id?: string
          issue_date?: string
          issued_by: string
          notes?: string | null
          returned_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          condition_at_issue?: string
          condition_at_return?: string | null
          created_at?: string
          equipment_id?: string
          expected_return_date?: string
          farmer_group_id?: string
          id?: string
          issue_date?: string
          issued_by?: string
          notes?: string | null
          returned_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_issuance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_groups: {
        Row: {
          chairperson_name: string | null
          chairperson_phone: string | null
          club_type: string | null
          contact_email: string | null
          contact_person: string
          contact_phone: string
          contract_path: string | null
          created_at: string
          created_by: string
          credit_score: number | null
          epa: string | null
          group_village_headman: string | null
          id: string
          location: string
          name: string
          notes: string | null
          registration_date: string
          status: string
          total_members: number
          traditional_authority: string | null
          updated_at: string
          village_headman: string | null
        }
        Insert: {
          chairperson_name?: string | null
          chairperson_phone?: string | null
          club_type?: string | null
          contact_email?: string | null
          contact_person: string
          contact_phone: string
          contract_path?: string | null
          created_at?: string
          created_by: string
          credit_score?: number | null
          epa?: string | null
          group_village_headman?: string | null
          id?: string
          location: string
          name: string
          notes?: string | null
          registration_date?: string
          status?: string
          total_members?: number
          traditional_authority?: string | null
          updated_at?: string
          village_headman?: string | null
        }
        Update: {
          chairperson_name?: string | null
          chairperson_phone?: string | null
          club_type?: string | null
          contact_email?: string | null
          contact_person?: string
          contact_phone?: string
          contract_path?: string | null
          created_at?: string
          created_by?: string
          credit_score?: number | null
          epa?: string | null
          group_village_headman?: string | null
          id?: string
          location?: string
          name?: string
          notes?: string | null
          registration_date?: string
          status?: string
          total_members?: number
          traditional_authority?: string | null
          updated_at?: string
          village_headman?: string | null
        }
        Relationships: []
      }
      farmers: {
        Row: {
          created_at: string
          created_by: string
          crops_grown: string[] | null
          date_of_birth: string | null
          farm_size_acres: number | null
          farmer_group_id: string
          full_name: string
          gender: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          join_date: string
          national_id: string | null
          phone: string
          photo_path: string | null
          signature_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          crops_grown?: string[] | null
          date_of_birth?: string | null
          farm_size_acres?: number | null
          farmer_group_id: string
          full_name: string
          gender?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          join_date?: string
          national_id?: string | null
          phone: string
          photo_path?: string | null
          signature_path?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          crops_grown?: string[] | null
          date_of_birth?: string | null
          farm_size_acres?: number | null
          farmer_group_id?: string
          full_name?: string
          gender?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          join_date?: string
          national_id?: string | null
          phone?: string
          photo_path?: string | null
          signature_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmers_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      field_visits: {
        Row: {
          created_at: string
          created_by: string
          crop_stage: Database["public"]["Enums"]["crop_stage_enum"] | null
          expected_yield: number | null
          farmer_group_id: string
          farmer_id: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          observations: string | null
          photos: Json
          season_id: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          created_by: string
          crop_stage?: Database["public"]["Enums"]["crop_stage_enum"] | null
          expected_yield?: number | null
          farmer_group_id: string
          farmer_id: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          observations?: string | null
          photos?: Json
          season_id?: string | null
          updated_at?: string
          visit_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          crop_stage?: Database["public"]["Enums"]["crop_stage_enum"] | null
          expected_yield?: number | null
          farmer_group_id?: string
          farmer_id?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          observations?: string | null
          photos?: Json
          season_id?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_visits_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_entries: {
        Row: {
          created_at: string
          delivery_id: string
          grade: string
          grader_id: string
          id: string
          weight: number
        }
        Insert: {
          created_at?: string
          delivery_id: string
          grade: string
          grader_id: string
          id?: string
          weight: number
        }
        Update: {
          created_at?: string
          delivery_id?: string
          grade?: string
          grader_id?: string
          id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_entries_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      input_acknowledgements: {
        Row: {
          ack_at: string
          ack_by: string | null
          distribution_id: string
          id: string
          notes: string | null
          photo_path: string | null
          signature_path: string | null
        }
        Insert: {
          ack_at?: string
          ack_by?: string | null
          distribution_id: string
          id?: string
          notes?: string | null
          photo_path?: string | null
          signature_path?: string | null
        }
        Update: {
          ack_at?: string
          ack_by?: string | null
          distribution_id?: string
          id?: string
          notes?: string | null
          photo_path?: string | null
          signature_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "input_acknowledgements_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "input_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      input_distributions: {
        Row: {
          acknowledgement_path: string | null
          acknowledgement_received: boolean
          created_at: string
          created_by: string
          distributed_by: string
          distribution_date: string
          farmer_group_id: string
          farmer_id: string | null
          id: string
          item_id: string
          loan_id: string | null
          notes: string | null
          quantity: number
          season_id: string | null
          updated_at: string
        }
        Insert: {
          acknowledgement_path?: string | null
          acknowledgement_received?: boolean
          created_at?: string
          created_by?: string
          distributed_by: string
          distribution_date?: string
          farmer_group_id: string
          farmer_id?: string | null
          id?: string
          item_id: string
          loan_id?: string | null
          notes?: string | null
          quantity: number
          season_id?: string | null
          updated_at?: string
        }
        Update: {
          acknowledgement_path?: string | null
          acknowledgement_received?: boolean
          created_at?: string
          created_by?: string
          distributed_by?: string
          distribution_date?: string
          farmer_group_id?: string
          farmer_id?: string | null
          id?: string
          item_id?: string
          loan_id?: string | null
          notes?: string | null
          quantity?: number
          season_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "input_distributions_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_distributions_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_distributions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "input_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_distributions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "input_stock_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "input_distributions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_distributions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      input_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by: string
          id: string
          name: string
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      input_stock: {
        Row: {
          created_at: string
          created_by: string
          id: string
          item_id: string
          notes: string | null
          quantity: number
          received_date: string
          season_id: string | null
          source: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          received_date?: string
          season_id?: string | null
          source?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          received_date?: string
          season_id?: string | null
          source?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "input_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "input_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "input_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "input_stock_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "input_stock_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_ledgers: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          created_by: string
          entry_type: string
          farmer_id: string
          id: string
          loan_id: string | null
          reference_id: string | null
          reference_table: string | null
          season_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          created_by: string
          entry_type: string
          farmer_id: string
          id?: string
          loan_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          season_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string
          entry_type?: string
          farmer_id?: string
          id?: string
          loan_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_ledgers_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_ledgers_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_ledgers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          approved_by: string | null
          collateral_description: string | null
          created_at: string
          created_by: string
          disbursement_date: string | null
          due_date: string | null
          duration_months: number
          farmer_group_id: string
          id: string
          interest_rate: number
          loan_type: string
          outstanding_balance: number
          purpose: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          collateral_description?: string | null
          created_at?: string
          created_by: string
          disbursement_date?: string | null
          due_date?: string | null
          duration_months: number
          farmer_group_id: string
          id?: string
          interest_rate?: number
          loan_type: string
          outstanding_balance?: number
          purpose: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          collateral_description?: string | null
          created_at?: string
          created_by?: string
          disbursement_date?: string | null
          due_date?: string | null
          duration_months?: number
          farmer_group_id?: string
          id?: string
          interest_rate?: number
          loan_type?: string
          outstanding_balance?: number
          purpose?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_farmer_group_id_fkey"
            columns: ["farmer_group_id"]
            isOneToOne: false
            referencedRelation: "farmer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          created_at: string
          created_by: string
          delivery_id: string
          gross_amount: number
          id: string
          loan_deduction: number
          method: string
          net_paid: number
          reference_number: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_id: string
          gross_amount: number
          id?: string
          loan_deduction?: number
          method: string
          net_paid: number
          reference_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_id?: string
          gross_amount?: number
          id?: string
          loan_deduction?: number
          method?: string
          net_paid?: number
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string | null
          recorded_by: string
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_number?: string | null
          recorded_by: string
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string | null
          recorded_by?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      upload_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          failed_records: number | null
          file_name: string
          file_size: number | null
          id: string
          started_at: string | null
          status: string
          successful_records: number | null
          total_records: number | null
          updated_at: string | null
          upload_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_records?: number | null
          file_name: string
          file_size?: number | null
          id?: string
          started_at?: string | null
          status: string
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          upload_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_records?: number | null
          file_name?: string
          file_size?: number | null
          id?: string
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          upload_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      data_ownership_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          ownership_label: string | null
          record_id: string | null
          record_name: string | null
          table_name: string | null
        }
        Relationships: []
      }
      input_stock_summary: {
        Row: {
          category: string | null
          first_received_date: string | null
          item_id: string | null
          item_name: string | null
          last_received_date: string | null
          stock_records_count: number | null
          total_quantity: number | null
          total_value: number | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_distribution_cost: {
        Args: { item_id: string; quantity: number }
        Returns: number
      }
      calculate_loan_outstanding_balance: {
        Args: { loan_id: string }
        Returns: number
      }
      can_edit_record: {
        Args: { record_id: string; table_name: string; user_id?: string }
        Returns: boolean
      }
      can_user_access_data: {
        Args: { user_id?: string }
        Returns: boolean
      }
      check_stock_availability: {
        Args: { item_id: string; requested_quantity: number }
        Returns: boolean
      }
      create_cash_payment_loan: {
        Args: {
          amount: number
          created_by: string
          farmer_group_id: string
          farmer_id: string
          payment_date: string
          payment_id: string
          purpose: string
        }
        Returns: string
      }
      create_distribution_loan: {
        Args: {
          distributed_by: string
          distribution_id: string
          farmer_group_id: string
          farmer_id: string
          item_id: string
          quantity: number
        }
        Returns: string
      }
      create_loan_ledger_with_audit: {
        Args: {
          amount: number
          balance_after: number
          created_by: string
          entry_type: string
          farmer_id: string
          loan_id: string
          reference_id: string
          reference_table: string
          season_id: string
        }
        Returns: Json
      }
      create_payout_direct: {
        Args: {
          created_by: string
          delivery_id: string
          gross_amount: number
          loan_deduction: number
          method: string
          net_paid: number
          reference_number: string
        }
        Returns: string
      }
      create_payout_raw_sql: {
        Args: {
          created_by: string
          delivery_id: string
          gross_amount: number
          loan_deduction: number
          method: string
          net_paid: number
          reference_number: string
        }
        Returns: Json
      }
      create_payout_safe: {
        Args: {
          p_created_by: string
          p_delivery_id: string
          p_gross_amount: number
          p_loan_deduction: number
          p_method: string
          p_net_paid: number
          p_reference_number: string
        }
        Returns: Json
      }
      create_payout_with_audit: {
        Args: {
          created_by: string
          delivery_id: string
          gross_amount: number
          loan_deduction: number
          method: string
          net_paid: number
          reference_number: string
        }
        Returns: Json
      }
      create_policy_if_not_exists: {
        Args: {
          policy_definition: string
          policy_name: string
          table_name: string
        }
        Returns: undefined
      }
      disable_audit_trigger: {
        Args: { table_name: string }
        Returns: undefined
      }
      enable_audit_trigger: {
        Args: { table_name: string }
        Returns: undefined
      }
      get_available_stock: {
        Args: { item_uuid: string }
        Returns: number
      }
      get_data_ownership_info: {
        Args: { record_id: string; table_name: string }
        Returns: {
          created_at: string
          created_by: string
          created_by_name: string
          is_own_data: boolean
        }[]
      }
      get_item_stock_level: {
        Args: { item_id: string }
        Returns: number
      }
      get_stock_movement_history: {
        Args: { end_date?: string; item_uuid?: string; start_date?: string }
        Returns: {
          date: string
          notes: string
          quantity: number
          reference_id: string
          reference_type: string
          type: string
          unit_cost: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_user_allowed_storage_object: {
        Args: { _user_id?: string; bucket: string; object_name: string }
        Returns: boolean
      }
      is_user_assigned_to_club: {
        Args: { _club_id: string; _user_id?: string }
        Returns: boolean
      }
      loan_belongs_to_user: {
        Args: { _loan_id: string; _user_id?: string }
        Returns: boolean
      }
      reduce_stock_after_distribution: {
        Args: { item_id: string; quantity: number }
        Returns: undefined
      }
      test_input_distributions_fixed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_input_distributions_insert: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_loan_outstanding_balances_safe: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_loan_balance_with_audit: {
        Args: { created_by: string; loan_id: string; new_balance: number }
        Returns: boolean
      }
      user_can_access_record: {
        Args: { record_id: string; table_name: string; user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      crop_stage_enum:
        | "sowing"
        | "vegetative"
        | "flowering"
        | "boll_formation"
        | "maturity"
        | "harvest"
      user_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      crop_stage_enum: [
        "sowing",
        "vegetative",
        "flowering",
        "boll_formation",
        "maturity",
        "harvest",
      ],
      user_role: ["admin", "staff"],
    },
  },
} as const
