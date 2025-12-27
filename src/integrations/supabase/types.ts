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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advance_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          labour_id: string
          notes: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          labour_id: string
          notes?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          labour_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_payments_labour_id_fkey"
            columns: ["labour_id"]
            isOneToOne: false
            referencedRelation: "labour"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          is_present: boolean
          labour_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_present?: boolean
          labour_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_present?: boolean
          labour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_labour_id_fkey"
            columns: ["labour_id"]
            isOneToOne: false
            referencedRelation: "labour"
            referencedColumns: ["id"]
          },
        ]
      }
      brick_production: {
        Row: {
          created_at: string
          date: string
          id: string
          labour_id: string | null
          notes: string | null
          quantity: number
          team_name: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          labour_id?: string | null
          notes?: string | null
          quantity?: number
          team_name?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          labour_id?: string | null
          notes?: string | null
          quantity?: number
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brick_production_labour_id_fkey"
            columns: ["labour_id"]
            isOneToOne: false
            referencedRelation: "labour"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          payment_date: string
          sale_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          sale_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          mobile: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          mobile?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          mobile?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      labour: {
        Row: {
          created_at: string
          daily_wage: number
          id: string
          mobile: string | null
          name: string
          updated_at: string
          work_type: Database["public"]["Enums"]["work_type"]
          adhar_no: string | null
          family_members: string | null
          email: string | null
          address: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          daily_wage?: number
          id?: string
          mobile?: string | null
          name: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["work_type"]
          adhar_no?: string | null
          family_members?: string | null
          email?: string | null
          address?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          daily_wage?: number
          id?: string
          mobile?: string | null
          name?: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["work_type"]
          adhar_no?: string | null
          family_members?: string | null
          email?: string | null
          address?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount_paid: number
          created_at: string
          customer_id: string
          date: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          rate_per_brick: number
          total_amount: number
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_id: string
          date?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity: number
          rate_per_brick: number
          total_amount: number
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          rate_per_brick?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          labour_id: string
          notes: string | null
          payment_date: string
          period_end: string
          period_start: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          labour_id: string
          notes?: string | null
          payment_date?: string
          period_end: string
          period_start: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          labour_id?: string
          notes?: string | null
          payment_date?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_payments_labour_id_fkey"
            columns: ["labour_id"]
            isOneToOne: false
            referencedRelation: "labour"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_category:
      | "raw_material"
      | "transport"
      | "labour"
      | "maintenance"
      | "other"
      payment_status: "paid" | "pending" | "partial"
      work_type: "moulding" | "stacking" | "loading" | "general"
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
      expense_category: [
        "raw_material",
        "transport",
        "labour",
        "maintenance",
        "other",
      ],
      payment_status: ["paid", "pending", "partial"],
      work_type: ["moulding", "stacking", "loading", "general"],
    },
  },
} as const
