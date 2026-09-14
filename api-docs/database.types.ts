export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Generated from the live Supabase project schema.
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answer_votes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          user_id: string
          value: number
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "answer_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_answer_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_answer_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_answer_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_parent_answer_id_fkey"
            columns: ["parent_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      field_weather_cache: {
        Row: {
          coordinate_key: string
          expires_at: string | null
          fetched_at: string | null
          field_id: string
          payload: Json | null
          refresh_token: string | null
          refresh_until: string | null
        }
        Insert: {
          coordinate_key: string
          expires_at?: string | null
          fetched_at?: string | null
          field_id: string
          payload?: Json | null
          refresh_token?: string | null
          refresh_until?: string | null
        }
        Update: {
          coordinate_key?: string
          expires_at?: string | null
          fetched_at?: string | null
          field_id?: string
          payload?: Json | null
          refresh_token?: string | null
          refresh_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_weather_cache_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: true
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          boundary: unknown
          center: unknown
          created_at: string
          crops: Json
          current_crop: Json | null
          current_stage_id: number | null
          id: string
          name: string
          owner_id: string
          region: string | null
          updated_at: string
        }
        Insert: {
          boundary?: unknown
          center?: unknown
          created_at?: string
          crops?: Json
          current_crop?: Json | null
          current_stage_id?: number | null
          id?: string
          name: string
          owner_id: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          boundary?: unknown
          center?: unknown
          created_at?: string
          crops?: Json
          current_crop?: Json | null
          current_stage_id?: number | null
          id?: string
          name?: string
          owner_id?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "post_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fields_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fields_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          accepted_at: string | null
          attempts: number
          completed_at: string | null
          created_at: string
          device_id: string
          error: string | null
          external_id: string | null
          id: string
          next_attempt_at: string
          notification_id: string
          processing_started_at: string | null
          provider_response: Json | null
          receipt_checked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          device_id: string
          error?: string | null
          external_id?: string | null
          id?: string
          next_attempt_at?: string
          notification_id: string
          processing_started_at?: string | null
          provider_response?: Json | null
          receipt_checked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          device_id?: string
          error?: string | null
          external_id?: string | null
          id?: string
          next_attempt_at?: string
          notification_id?: string
          processing_started_at?: string | null
          provider_response?: Json | null
          receipt_checked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "push_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          ai_push: boolean
          answers_push: boolean
          created_at: string
          push_enabled: boolean
          reactions_push: boolean
          replies_push: boolean
          reputation_push: boolean
          updated_at: string
          user_id: string
          votes_push: boolean
          weather_push: boolean
        }
        Insert: {
          ai_push?: boolean
          answers_push?: boolean
          created_at?: string
          push_enabled?: boolean
          reactions_push?: boolean
          replies_push?: boolean
          reputation_push?: boolean
          updated_at?: string
          user_id: string
          votes_push?: boolean
          weather_push?: boolean
        }
        Update: {
          ai_push?: boolean
          answers_push?: boolean
          created_at?: string
          push_enabled?: boolean
          reactions_push?: boolean
          replies_push?: boolean
          reputation_push?: boolean
          updated_at?: string
          user_id?: string
          votes_push?: boolean
          weather_push?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          data: Json
          dedupe_key: string
          entity_id: string | null
          entity_type: string | null
          group_key: string | null
          id: string
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          data?: Json
          dedupe_key: string
          entity_id?: string | null
          entity_type?: string | null
          group_key?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          data?: Json
          dedupe_key?: string
          entity_id?: string | null
          entity_type?: string | null
          group_key?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_ai_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          feature: string
          id: string
          input: Json
          metadata: Json
          model: string | null
          post_id: string
          provider: string | null
          requested_by: string | null
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input?: Json
          metadata?: Json
          model?: string | null
          post_id: string
          provider?: string | null
          requested_by?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input?: Json
          metadata?: Json
          model?: string | null
          post_id?: string
          provider?: string | null
          requested_by?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_ai_runs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_ai_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_ai_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          ai_run_id: string | null
          author_id: string | null
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          system_actor_id: string | null
          updated_at: string
        }
        Insert: {
          ai_run_id?: string | null
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          system_actor_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_run_id?: string | null
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          system_actor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: true
            referencedRelation: "post_ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_system_actor_id_fkey"
            columns: ["system_actor_id"]
            isOneToOne: false
            referencedRelation: "system_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          post_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          post_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          post_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_reaction_type_id_fkey"
            columns: ["reaction_type_id"]
            isOneToOne: false
            referencedRelation: "reaction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_stages: {
        Row: {
          code: string
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      post_statuses: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      post_types: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: Json
          author_id: string
          body: string | null
          created_at: string
          crop_id: number | null
          field_id: string | null
          id: string
          post_type_id: number
          stage_id: number | null
          status_id: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author?: Json
          author_id: string
          body?: string | null
          created_at?: string
          crop_id?: number | null
          field_id?: string | null
          id?: string
          post_type_id: number
          stage_id?: number | null
          status_id?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author?: Json
          author_id?: string
          body?: string | null
          created_at?: string
          crop_id?: number | null
          field_id?: string | null
          id?: string
          post_type_id?: number
          stage_id?: number | null
          status_id?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_post_type_id_fkey"
            columns: ["post_type_id"]
            isOneToOne: false
            referencedRelation: "post_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "post_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "post_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          id: string
          name: string | null
          region: string | null
          reputation: number
          specialization: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          id: string
          name?: string | null
          region?: string | null
          reputation?: number
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          id?: string
          name?: string | null
          region?: string | null
          reputation?: number
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_key: string | null
          enabled: boolean
          endpoint: string
          id: string
          last_error: string | null
          last_seen_at: string
          platform: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_key?: string | null
          enabled?: boolean
          endpoint: string
          id?: string
          last_error?: string | null
          last_seen_at?: string
          platform: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_key?: string | null
          enabled?: boolean
          endpoint?: string
          id?: string
          last_error?: string | null
          last_seen_at?: string
          platform?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reaction_types: {
        Row: {
          code: string
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      reputation_events: {
        Row: {
          created_at: string
          id: string
          points: number
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_reputation_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_actors: {
        Row: {
          avatar_path: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      profile_reputation_summary: {
        Row: {
          id: string | null
          next_star_reputation: number | null
          points_to_next_star: number | null
          reputation: number | null
          stars: number | null
        }
        Insert: {
          id?: string | null
          next_star_reputation?: never
          points_to_next_star?: never
          reputation?: number | null
          stars?: never
        }
        Update: {
          id?: string | null
          next_star_reputation?: never
          points_to_next_star?: never
          reputation?: number | null
          stars?: never
        }
        Relationships: []
      }
    }
    Functions: {
      build_post_author_snapshot: {
        Args: { profile_id: string }
        Returns: Json
      }
      claim_field_weather_refresh: {
        Args: { p_coordinate_key: string; p_field_id: string }
        Returns: string
      }
      claim_notification_outbox: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          body: string
          data: Json
          device_id: string
          endpoint: string
          notification_id: string
          notification_type: string
          outbox_id: string
          priority: string
          title: string
        }[]
      }
      create_notification: {
        Args: {
          p_actor_id?: string
          p_body: string
          p_data?: Json
          p_dedupe_key: string
          p_entity_id?: string
          p_entity_type?: string
          p_group_key?: string
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      disable_push_device: {
        Args: { p_handle: string }
        Returns: undefined
      }
      finalize_post_ai_run: {
        Args: { p_metadata?: Json; p_reply: string; p_run_id: string }
        Returns: Json
      }
      get_field_weather_location: {
        Args: { p_field_id: string }
        Returns: {
          coordinate_source: string
          field_id: string
          latitude: number
          longitude: number
        }[]
      }
      list_notification_weather_fields: {
        Args: never
        Returns: {
          field_id: string
          field_name: string
          latitude: number
          longitude: number
          owner_id: string
        }[]
      }
      next_reputation_star_threshold: {
        Args: { p_reputation: number }
        Returns: number
      }
      notification_should_push: {
        Args: { p_type: string; p_user_id: string }
        Returns: boolean
      }
      process_weather_notifications: {
        Args: never
        Returns: Json
      }
      rebuild_reputation_from_activity: {
        Args: never
        Returns: undefined
      }
      recalculate_profile_reputation: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      register_push_device: {
        Args: {
          p_app_version?: string
          p_device_key?: string
          p_handle: string
          p_platform: string
        }
        Returns: string
      }
      reputation_stars: {
        Args: { p_reputation: number }
        Returns: number
      }
      verify_notification_worker_secret: {
        Args: { p_value: string }
        Returns: boolean
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

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
      )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
    )[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (
        DefaultSchema["Tables"] & DefaultSchema["Views"]
      )
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
