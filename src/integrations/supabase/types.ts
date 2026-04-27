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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          companion_profile_id: string
          created_at: string
          duration_hours: number
          guest_id: string
          id: string
          notes: string | null
          platform_fee: number
          service: string
          service_fee: number
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          companion_profile_id: string
          created_at?: string
          duration_hours?: number
          guest_id: string
          id?: string
          notes?: string | null
          platform_fee?: number
          service: string
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          companion_profile_id?: string
          created_at?: string
          duration_hours?: number
          guest_id?: string
          id?: string
          notes?: string | null
          platform_fee?: number
          service?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_companion_profile_id_fkey"
            columns: ["companion_profile_id"]
            isOneToOne: false
            referencedRelation: "companion_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_images: {
        Row: {
          companion_profile_id: string
          created_at: string
          id: string
          image_url: string
          position: number
        }
        Insert: {
          companion_profile_id: string
          created_at?: string
          id?: string
          image_url: string
          position?: number
        }
        Update: {
          companion_profile_id?: string
          created_at?: string
          id?: string
          image_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "companion_images_companion_profile_id_fkey"
            columns: ["companion_profile_id"]
            isOneToOne: false
            referencedRelation: "companion_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_profiles: {
        Row: {
          availability: Json | null
          created_at: string
          custom_packages: Json | null
          gender: string | null
          hourly_rate: number | null
          id: string
          overnight_rate: number | null
          services: string[] | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          availability?: Json | null
          created_at?: string
          custom_packages?: Json | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          overnight_rate?: number | null
          services?: string[] | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          availability?: Json | null
          created_at?: string
          custom_packages?: Json | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          overnight_rate?: number | null
          services?: string[] | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "companion_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      image_moderation: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          id: string
          image_type: string
          image_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["image_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["image_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["image_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          grant_admin: boolean
          id: string
          invited_by: string
          platform_role: Database["public"]["Enums"]["platform_role"]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          grant_admin?: boolean
          id?: string
          invited_by: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          grant_admin?: boolean
          id?: string
          invited_by?: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          phone: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          phone: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          tips_enabled: boolean
        }
        Insert: {
          id?: number
          tips_enabled?: boolean
        }
        Update: {
          id?: number
          tips_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean
          avatar_url: string | null
          bio: string | null
          body_type: string | null
          country: string | null
          created_at: string
          currency: string | null
          date_of_birth: string | null
          display_name: string | null
          ethnicity: string | null
          flagged_for_review: boolean
          id: string
          location: string | null
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          photo_verified: boolean
          profile_completed: boolean
          profile_visible: boolean
          role: Database["public"]["Enums"]["platform_role"]
          selfie_verified: boolean
          show_online_status: boolean
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          age_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          ethnicity?: string | null
          flagged_for_review?: boolean
          id?: string
          location?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          photo_verified?: boolean
          profile_completed?: boolean
          profile_visible?: boolean
          role?: Database["public"]["Enums"]["platform_role"]
          selfie_verified?: boolean
          show_online_status?: boolean
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          age_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          body_type?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          ethnicity?: string | null
          flagged_for_review?: boolean
          id?: string
          location?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          photo_verified?: boolean
          profile_completed?: boolean
          profile_visible?: boolean
          role?: Database["public"]["Enums"]["platform_role"]
          selfie_verified?: boolean
          show_online_status?: boolean
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: []
      }
      saved_companions: {
        Row: {
          companion_profile_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          companion_profile_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          companion_profile_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          companion_profile_id: string
          created_at: string
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          companion_profile_id: string
          created_at?: string
          id?: string
          interaction_type?: string
          user_id: string
        }
        Update: {
          companion_profile_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_companion_profile_id_fkey"
            columns: ["companion_profile_id"]
            isOneToOne: false
            referencedRelation: "companion_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          id: string
          is_online: boolean
          is_typing: boolean
          last_seen: string | null
          typing_in_conversation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_online?: boolean
          is_typing?: boolean
          last_seen?: string | null
          typing_in_conversation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_online?: boolean
          is_typing?: boolean
          last_seen?: string | null
          typing_in_conversation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_typing_in_conversation_fkey"
            columns: ["typing_in_conversation"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      image_status: "pending_review" | "approved" | "rejected"
      platform_role: "guest" | "companion"
      report_reason: "harassment" | "spam" | "inappropriate" | "scam" | "other"
      report_status: "pending" | "reviewed" | "resolved"
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
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      image_status: ["pending_review", "approved", "rejected"],
      platform_role: ["guest", "companion"],
      report_reason: ["harassment", "spam", "inappropriate", "scam", "other"],
      report_status: ["pending", "reviewed", "resolved"],
    },
  },
} as const
