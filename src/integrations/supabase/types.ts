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
          contact_email: string | null
          contact_person: string
          contact_phone: string
          created_at: string
          created_by: string
          credit_score: number | null
          id: string
          location: string
          name: string
          notes: string | null
          registration_date: string
          status: string
          total_members: number
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_person: string
          contact_phone: string
          created_at?: string
          created_by: string
          credit_score?: number | null
          id?: string
          location: string
          name: string
          notes?: string | null
          registration_date?: string
          status?: string
          total_members?: number
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_person?: string
          contact_phone?: string
          created_at?: string
          created_by?: string
          credit_score?: number | null
          id?: string
          location?: string
          name?: string
          notes?: string | null
          registration_date?: string
          status?: string
          total_members?: number
          updated_at?: string
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
          id: string
          join_date: string
          national_id: string | null
          phone: string
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
          id?: string
          join_date?: string
          national_id?: string | null
          phone: string
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
          id?: string
          join_date?: string
          national_id?: string | null
          phone?: string
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
      profiles: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
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
      user_role: ["admin", "staff"],
    },
  },
} as const
