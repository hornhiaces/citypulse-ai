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
      ai_query_logs: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          latency_ms: number | null
          mode: string | null
          query: string
          response: string | null
          sources: Json | null
          tokens_used: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          mode?: string | null
          query: string
          response?: string | null
          sources?: Json | null
          tokens_used?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          mode?: string | null
          query?: string
          response?: string | null
          sources?: Json | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string
          description: string
          districts: number[] | null
          id: string
          priority: string
          signals: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          description: string
          districts?: number[] | null
          id?: string
          priority: string
          signals?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          description?: string
          districts?: number[] | null
          id?: string
          priority?: string
          signals?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_licenses: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          category: string | null
          created_at: string
          district: number | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          latitude: number | null
          license_number: string | null
          longitude: number | null
          status: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          category?: string | null
          created_at?: string
          district?: number | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          status?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          category?: string | null
          created_at?: string
          district?: number | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          status?: string | null
        }
        Relationships: []
      }
      calls_911_monthly: {
        Row: {
          avg_response_minutes: number | null
          call_count: number
          call_type: string | null
          change_pct: number | null
          created_at: string
          district: number | null
          id: string
          month: string
          priority_1_count: number | null
          priority_2_count: number | null
          priority_3_count: number | null
          year: number
        }
        Insert: {
          avg_response_minutes?: number | null
          call_count?: number
          call_type?: string | null
          change_pct?: number | null
          created_at?: string
          district?: number | null
          id?: string
          month: string
          priority_1_count?: number | null
          priority_2_count?: number | null
          priority_3_count?: number | null
          year: number
        }
        Update: {
          avg_response_minutes?: number | null
          call_count?: number
          call_type?: string | null
          change_pct?: number | null
          created_at?: string
          district?: number | null
          id?: string
          month?: string
          priority_1_count?: number | null
          priority_2_count?: number | null
          priority_3_count?: number | null
          year?: number
        }
        Relationships: []
      }
      dataset_catalog: {
        Row: {
          completion_rate: number | null
          created_at: string
          description: string | null
          error_details: string | null
          id: string
          ingestion_source: string | null
          last_ingested_at: string | null
          missing_rows: number | null
          name: string
          record_count: number | null
          source_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string
          description?: string | null
          error_details?: string | null
          id?: string
          ingestion_source?: string | null
          last_ingested_at?: string | null
          missing_rows?: number | null
          name: string
          record_count?: number | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          completion_rate?: number | null
          created_at?: string
          description?: string | null
          error_details?: string | null
          id?: string
          ingestion_source?: string | null
          last_ingested_at?: string | null
          missing_rows?: number | null
          name?: string
          record_count?: number | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      district_scores: {
        Row: {
          area: string | null
          citizen_confidence: string | null
          computed_at: string
          district: number
          district_name: string
          economic_activity: string | null
          emergency_demand: string | null
          id: string
          infrastructure_stress: string | null
          overall_risk_score: number | null
          population: number | null
          public_safety_pressure: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          citizen_confidence?: string | null
          computed_at?: string
          district: number
          district_name: string
          economic_activity?: string | null
          emergency_demand?: string | null
          id?: string
          infrastructure_stress?: string | null
          overall_risk_score?: number | null
          population?: number | null
          public_safety_pressure?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          citizen_confidence?: string | null
          computed_at?: string
          district?: number
          district_name?: string
          economic_activity?: string | null
          emergency_demand?: string | null
          id?: string
          infrastructure_stress?: string | null
          overall_risk_score?: number | null
          population?: number | null
          public_safety_pressure?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      district_signals: {
        Row: {
          computed_at: string
          district: number
          id: string
          metadata: Json | null
          period: string | null
          signal_level: string | null
          signal_type: string
          signal_value: number
        }
        Insert: {
          computed_at?: string
          district: number
          id?: string
          metadata?: Json | null
          period?: string | null
          signal_level?: string | null
          signal_type: string
          signal_value: number
        }
        Update: {
          computed_at?: string
          district?: number
          id?: string
          metadata?: Json | null
          period?: string | null
          signal_level?: string | null
          signal_type?: string
          signal_value?: number
        }
        Relationships: []
      }
      ingestion_audit_log: {
        Row: {
          chunk_size: number | null
          completed_at: string | null
          completion_rate: number | null
          created_at: string | null
          dataset_name: string
          duration_seconds: number | null
          errors: string | null
          failed_chunks: number | null
          file_size_mb: number | null
          filename: string
          id: string
          ingestion_method: string | null
          inserted_rows: number
          missing_rows: number | null
          notes: string | null
          started_at: string
          status: string
          total_chunks: number | null
          total_rows: number
          updated_at: string | null
          user_ip_hash: string | null
        }
        Insert: {
          chunk_size?: number | null
          completed_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          dataset_name: string
          duration_seconds?: number | null
          errors?: string | null
          failed_chunks?: number | null
          file_size_mb?: number | null
          filename: string
          id?: string
          ingestion_method?: string | null
          inserted_rows: number
          missing_rows?: number | null
          notes?: string | null
          started_at?: string
          status?: string
          total_chunks?: number | null
          total_rows: number
          updated_at?: string | null
          user_ip_hash?: string | null
        }
        Update: {
          chunk_size?: number | null
          completed_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          dataset_name?: string
          duration_seconds?: number | null
          errors?: string | null
          failed_chunks?: number | null
          file_size_mb?: number | null
          filename?: string
          id?: string
          ingestion_method?: string | null
          inserted_rows?: number
          missing_rows?: number | null
          notes?: string | null
          started_at?: string
          status?: string
          total_chunks?: number | null
          total_rows?: number
          updated_at?: string | null
          user_ip_hash?: string | null
        }
        Relationships: []
      }
      service_requests_311: {
        Row: {
          address: string | null
          case_id: string | null
          category: string
          created_at: string
          created_date: string
          description: string | null
          district: number | null
          id: string
          latitude: number | null
          longitude: number | null
          priority: string | null
          resolution_days: number | null
          resolved_date: string | null
          source: string | null
          status: string | null
          subcategory: string | null
        }
        Insert: {
          address?: string | null
          case_id?: string | null
          category: string
          created_at?: string
          created_date?: string
          description?: string | null
          district?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: string | null
          resolution_days?: number | null
          resolved_date?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
        }
        Update: {
          address?: string | null
          case_id?: string | null
          category?: string
          created_at?: string
          created_date?: string
          description?: string | null
          district?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: string | null
          resolution_days?: number | null
          resolved_date?: string | null
          source?: string | null
          status?: string | null
          subcategory?: string | null
        }
        Relationships: []
      }
      vector_documents: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_table: string | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_table?: string | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_table?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_data_quality: {
        Row: {
          dataset: string | null
          location_coverage_pct: number | null
          records_with_key: number | null
          records_with_location: number | null
          total_records: number | null
          unique_keys: number | null
        }
        Relationships: []
      }
      vw_ingestion_summary: {
        Row: {
          avg_completion_rate: number | null
          dataset_name: string | null
          failed_ingestions: number | null
          most_recent_ingest: string | null
          partial_ingestions: number | null
          successful_ingestions: number | null
          total_attempts: number | null
          total_missing_rows: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      match_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
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
