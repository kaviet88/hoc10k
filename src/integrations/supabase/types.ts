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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_reward: number
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_reward?: number
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_reward?: number
          requirement_value?: number
        }
        Relationships: []
      }
      check_in_history: {
        Row: {
          bonus_points: number
          check_in_date: string
          created_at: string
          id: string
          points_earned: number
          streak_day: number
          user_id: string
        }
        Insert: {
          bonus_points?: number
          check_in_date: string
          created_at?: string
          id?: string
          points_earned?: number
          streak_day?: number
          user_id: string
        }
        Update: {
          bonus_points?: number
          check_in_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          badge: string | null
          badge_color: string | null
          created_at: string
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          view_count: number | null
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          view_count?: number | null
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          view_count?: number | null
        }
        Relationships: []
      }
      lesson_mindmaps: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          nodes: Json
          program_id: string
          root_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          nodes?: Json
          program_id: string
          root_label: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          nodes?: Json
          program_id?: string
          root_label?: string
        }
        Relationships: []
      }
      lesson_quizzes: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          program_id: string
          question: string
          question_order: number
        }
        Insert: {
          correct_answer: number
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id: string
          options?: Json
          program_id: string
          question: string
          question_order?: number
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          program_id?: string
          question?: string
          question_order?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          badge: string | null
          badge_color: string | null
          comment_count: number | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          is_published: boolean | null
          original_price: number | null
          price: number | null
          program_id: string | null
          thumbnail_url: string | null
          title: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean | null
          original_price?: number | null
          price?: number | null
          program_id?: string | null
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean | null
          original_price?: number | null
          price?: number | null
          program_id?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          amount: number
          created_at: string
          expire_at: string
          id: string
          order_data: Json
          order_id: string
          order_type: string
          payment_content: string
          status: string
          transaction_id: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          expire_at?: string
          id?: string
          order_data?: Json
          order_id: string
          order_type?: string
          payment_content: string
          status?: string
          transaction_id?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          expire_at?: string
          id?: string
          order_data?: Json
          order_id?: string
          order_type?: string
          payment_content?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      practice_test_questions: {
        Row: {
          audio_url: string | null
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          listening_blanks: Json | null
          options: Json | null
          question_number: number
          question_text: string
          question_type: string
          test_id: string
        }
        Insert: {
          audio_url?: string | null
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          listening_blanks?: Json | null
          options?: Json | null
          question_number: number
          question_text: string
          question_type?: string
          test_id: string
        }
        Update: {
          audio_url?: string | null
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          listening_blanks?: Json | null
          options?: Json | null
          question_number?: number
          question_text?: string
          question_type?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_tests: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          exam_type: string | null
          grade: number | null
          id: string
          is_premium: boolean | null
          participant_count: number | null
          rating: number | null
          subject: string
          time_limit_minutes: number
          title: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          grade?: number | null
          id?: string
          is_premium?: boolean | null
          participant_count?: number | null
          rating?: number | null
          subject: string
          time_limit_minutes?: number
          title: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          grade?: number | null
          id?: string
          is_premium?: boolean | null
          participant_count?: number | null
          rating?: number | null
          subject?: string
          time_limit_minutes?: number
          title?: string
          total_questions?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_lessons: {
        Row: {
          created_at: string
          day_number: number | null
          duration_minutes: number
          id: string
          lesson_id: string
          lesson_order: number
          lesson_title: string
          program_id: string
          thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          day_number?: number | null
          duration_minutes?: number
          id?: string
          lesson_id: string
          lesson_order?: number
          lesson_title: string
          program_id: string
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number | null
          duration_minutes?: number
          id?: string
          lesson_id?: string
          lesson_order?: number
          lesson_title?: string
          program_id?: string
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          duration: string
          id: string
          payment_method: string
          price: number
          program_id: string
          program_name: string
          program_type: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          duration: string
          id?: string
          payment_method: string
          price: number
          program_id: string
          program_name: string
          program_type: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          duration?: string
          id?: string
          payment_method?: string
          price?: number
          program_id?: string
          program_name?: string
          program_type?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchased_documents: {
        Row: {
          document_id: string
          id: string
          price: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          price?: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          price?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_carts: {
        Row: {
          added_at: string
          duration: string
          id: string
          price: number
          program_id: string
          program_name: string
          program_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          duration: string
          id?: string
          price: number
          program_id: string
          program_name: string
          program_type: string
          user_id: string
        }
        Update: {
          added_at?: string
          duration?: string
          id?: string
          price?: number
          program_id?: string
          program_name?: string
          program_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          program_id: string
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          program_id: string
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          program_id?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          available_points: number
          created_at: string
          current_streak: number
          id: string
          last_check_in: string | null
          longest_streak: number
          total_points: number
          updated_at: string
          used_points: number
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_check_in?: string | null
          longest_streak?: number
          total_points?: number
          updated_at?: string
          used_points?: number
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_check_in?: string | null
          longest_streak?: number
          total_points?: number
          updated_at?: string
          used_points?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_test_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          correct_answer: string
          id: string
          is_correct: boolean
          question_number: number
          user_answer: string | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          correct_answer: string
          id?: string
          is_correct?: boolean
          question_number: number
          user_answer?: string | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          correct_answer?: string
          id?: string
          is_correct?: boolean
          question_number?: number
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "user_test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_test_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number
          id: string
          score_percent: number
          started_at: string
          status: string
          test_id: string | null
          test_title: string
          time_spent_seconds: number
          total_questions: number
          unanswered: number
          user_id: string
          wrong_answers: number
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          id?: string
          score_percent?: number
          started_at?: string
          status?: string
          test_id?: string | null
          test_title: string
          time_spent_seconds?: number
          total_questions: number
          unanswered?: number
          user_id: string
          wrong_answers?: number
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          id?: string
          score_percent?: number
          started_at?: string
          status?: string
          test_id?: string | null
          test_title?: string
          time_spent_seconds?: number
          total_questions?: number
          unanswered?: number
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_lesson_quiz_answer: {
        Args: { p_question_id: string; p_user_answer: number }
        Returns: {
          correct_answer: number
          explanation: string
          is_correct: boolean
          question_id: string
          user_answer: number
        }[]
      }
      get_document_signed_url: {
        Args: { p_document_id: string }
        Returns: string
      }
      get_exam_leaderboard: {
        Args: { exam_id: string; limit_count?: number }
        Returns: {
          avatar_url: string
          completed_at: string
          correct_answers: number
          rank: number
          score_percent: number
          time_spent_seconds: number
          total_questions: number
          user_id: string
          user_name: string
        }[]
      }
      get_lesson_quiz_questions: {
        Args: { p_lesson_id: string; p_program_id: string }
        Returns: {
          id: string
          options: Json
          question: string
          question_order: number
        }[]
      }
      get_practice_questions: {
        Args: { p_test_id: string }
        Returns: {
          audio_url: string
          id: string
          listening_blanks: Json
          options: Json
          question_number: number
          question_text: string
          question_type: string
        }[]
      }
      get_user_exam_rank: {
        Args: { exam_id: string; user_uuid: string }
        Returns: {
          rank: number
          total_participants: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_document_download: {
        Args: { doc_id: string }
        Returns: undefined
      }
      increment_document_view: { Args: { doc_id: string }; Returns: undefined }
      increment_news_view: { Args: { news_id: string }; Returns: undefined }
      submit_test_answers: {
        Args: { p_answers: Json; p_attempt_id: string }
        Returns: {
          correct_answer: string
          explanation: string
          is_correct: boolean
          question_number: number
          user_answer: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
