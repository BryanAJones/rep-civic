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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      candidate_positions: {
        Row: {
          candidate_id: string
          id: string
          position_text: string
          sort_order: number
        }
        Insert: {
          candidate_id: string
          id?: string
          position_text: string
          sort_order?: number
        }
        Update: {
          candidate_id?: string
          id?: string
          position_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_positions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          answered_question_count: number | null
          campaign_url: string | null
          created_at: string
          district_code: string
          filing_date: string | null
          filing_id: string | null
          id: string
          initials: string
          name: string
          office_title: string
          opponent_count: number | null
          party: string
          question_count: number | null
          response_rate: number | null
          status: string
          updated_at: string
          video_count: number | null
        }
        Insert: {
          answered_question_count?: number | null
          campaign_url?: string | null
          created_at?: string
          district_code: string
          filing_date?: string | null
          filing_id?: string | null
          id?: string
          initials: string
          name: string
          office_title: string
          opponent_count?: number | null
          party: string
          question_count?: number | null
          response_rate?: number | null
          status?: string
          updated_at?: string
          video_count?: number | null
        }
        Update: {
          answered_question_count?: number | null
          campaign_url?: string | null
          created_at?: string
          district_code?: string
          filing_date?: string | null
          filing_id?: string | null
          id?: string
          initials?: string
          name?: string
          office_title?: string
          opponent_count?: number | null
          party?: string
          question_count?: number | null
          response_rate?: number | null
          status?: string
          updated_at?: string
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
        ]
      }
      chain_nodes: {
        Row: {
          candidate_id: string
          chain_id: string
          depth: number
          parent_video_id: string | null
          video_id: string
        }
        Insert: {
          candidate_id: string
          chain_id: string
          depth: number
          parent_video_id?: string | null
          video_id: string
        }
        Update: {
          candidate_id?: string
          chain_id?: string
          depth?: number
          parent_video_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_nodes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_nodes_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "debate_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_nodes_parent_video_id_fkey"
            columns: ["parent_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_nodes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_participants: {
        Row: {
          candidate_id: string
          chain_id: string
          responses_allowed: number
          responses_used: number
        }
        Insert: {
          candidate_id: string
          chain_id: string
          responses_allowed?: number
          responses_used?: number
        }
        Update: {
          candidate_id?: string
          chain_id?: string
          responses_allowed?: number
          responses_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "chain_participants_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_participants_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "debate_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_chains: {
        Row: {
          district_code: string
          id: string
          opened_at: string
          topic_label: string
          total_questions: number
        }
        Insert: {
          district_code: string
          id?: string
          opened_at?: string
          topic_label: string
          total_questions?: number
        }
        Update: {
          district_code?: string
          id?: string
          opened_at?: string
          topic_label?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "debate_chains_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
        ]
      }
      districts: {
        Row: {
          code: string
          display_label: string
          district_name: string
          level: string
          office_title: string
        }
        Insert: {
          code: string
          display_label: string
          district_name: string
          level: string
          office_title: string
        }
        Update: {
          code?: string
          display_label?: string
          district_name?: string
          level?: string
          office_title?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          page: string | null
          text: string
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: string
          page?: string | null
          text: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          page?: string | null
          text?: string
        }
        Relationships: []
      }
      question_votes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_video_id: string | null
          author_handle: string
          candidate_id: string
          created_at: string
          id: string
          plus_one_count: number
          state: string
          text: string
          topic_id: string | null
          video_id: string | null
        }
        Insert: {
          answer_video_id?: string | null
          author_handle: string
          candidate_id: string
          created_at?: string
          id?: string
          plus_one_count?: number
          state?: string
          text: string
          topic_id?: string | null
          video_id?: string | null
        }
        Update: {
          answer_video_id?: string | null
          author_handle?: string
          candidate_id?: string
          created_at?: string
          id?: string
          plus_one_count?: number
          state?: string
          text?: string
          topic_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_questions_topic"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          candidate_id: string
          id: string
          source_badge: string
          title: string
        }
        Insert: {
          candidate_id: string
          id?: string
          source_badge: string
          title: string
        }
        Update: {
          candidate_id?: string
          id?: string
          source_badge?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          answers_question_id: string | null
          candidate_id: string
          caption: string | null
          chain_depth: number | null
          chain_id: string | null
          id: string
          post_type: string
          published_at: string
          question_count: number
          reaction_count: number
          thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          answers_question_id?: string | null
          candidate_id: string
          caption?: string | null
          chain_depth?: number | null
          chain_id?: string | null
          id?: string
          post_type: string
          published_at?: string
          question_count?: number
          reaction_count?: number
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          answers_question_id?: string | null
          candidate_id?: string
          caption?: string | null
          chain_depth?: number | null
          chain_id?: string | null
          id?: string
          post_type?: string
          published_at?: string
          question_count?: number
          reaction_count?: number
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_videos_chain"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "debate_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
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
