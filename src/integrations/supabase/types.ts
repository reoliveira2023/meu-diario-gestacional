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
      baby_letters: {
        Row: {
          content: string
          created_at: string
          id: string
          is_private: boolean | null
          letter_date: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          letter_date?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          letter_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      baby_names: {
        Row: {
          created_at: string
          gender: string
          id: string
          is_favorite: boolean | null
          meaning: string | null
          name: string
          notes: string | null
          origin: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gender: string
          id?: string
          is_favorite?: boolean | null
          meaning?: string | null
          name: string
          notes?: string | null
          origin?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gender?: string
          id?: string
          is_favorite?: boolean | null
          meaning?: string | null
          name?: string
          notes?: string | null
          origin?: string | null
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invited_at: string | null
          is_invited: boolean | null
          joined_at: string | null
          name: string
          phone: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          is_invited?: boolean | null
          joined_at?: string | null
          name: string
          phone?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          is_invited?: boolean | null
          joined_at?: string | null
          name?: string
          phone?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_date: string | null
          attachments: string[] | null
          created_at: string
          doctor_name: string | null
          id: string
          location: string | null
          notes: string | null
          results: string | null
          title: string
          type: string
          user_id: string
          week_number: number | null
        }
        Insert: {
          appointment_date?: string | null
          attachments?: string[] | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          results?: string | null
          title: string
          type: string
          user_id: string
          week_number?: number | null
        }
        Update: {
          appointment_date?: string | null
          attachments?: string[] | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          results?: string | null
          title?: string
          type?: string
          user_id?: string
          week_number?: number | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          mood: string
          notes: string | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          mood: string
          notes?: string | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string
          notes?: string | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          due_date: string | null
          full_name: string | null
          id: string
          last_period_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          due_date?: string | null
          full_name?: string | null
          id?: string
          last_period_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          due_date?: string | null
          full_name?: string | null
          id?: string
          last_period_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string
          created_at: string
          custom_item: boolean | null
          id: string
          is_completed: boolean | null
          is_essential: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_item?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_essential?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_item?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_essential?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_records: {
        Row: {
          belly_circumference: number | null
          created_at: string
          id: string
          notes: string | null
          record_date: string
          user_id: string
          week_number: number
          weight: number | null
        }
        Insert: {
          belly_circumference?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          record_date?: string
          user_id: string
          week_number: number
          weight?: number | null
        }
        Update: {
          belly_circumference?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          record_date?: string
          user_id?: string
          week_number?: number
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
