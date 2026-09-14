// backend-2: anouytyfpgpynnfwggzt
// Schema: public
// PostgREST: 14.5
// Сформировано по актуальной схеме после добавления фоновых AI-разборов.
//
// HTTP-контракты Edge Functions описываются отдельно.
// CHECK-ограничения PostgreSQL не превращаются автоматически в TS union.
// Наличие Insert/Update-типа не означает, что операция разрешена клиенту.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type FK<
  Name extends string,
  Column extends string,
  Relation extends string,
  One extends boolean = false,
> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: One;
  referencedRelation: Relation;
  referencedColumns: ["id"];
};

type ProfileFK<
  Name extends string,
  Column extends string,
  One extends boolean = false,
> = [
  FK<Name, Column, "profile_reputation_summary", One>,
  FK<Name, Column, "profiles", One>,
];

type TableDefinition<
  Row,
  RequiredInsert extends keyof Row,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: Pick<Row, RequiredInsert> &
    Partial<Omit<Row, RequiredInsert>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      answer_votes: TableDefinition<
        {
          answer_id: string;
          created_at: string;
          id: string;
          user_id: string;
          value: number;
        },
        "answer_id" | "user_id" | "value",
        [
          FK<"answer_votes_answer_id_fkey", "answer_id", "answers">,
          ...ProfileFK<"answer_votes_user_id_fkey", "user_id">,
        ]
      >;

      answers: TableDefinition<
        {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          parent_answer_id: string | null;
          post_id: string;
          updated_at: string;
        },
        "author_id" | "body" | "post_id",
        [
          ...ProfileFK<"answers_author_id_fkey", "author_id">,
          FK<"answers_parent_answer_id_fkey", "parent_answer_id", "answers">,
          FK<"answers_post_id_fkey", "post_id", "posts">,
        ]
      >;

      crops: TableDefinition<
        {
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          slug: string;
        },
        "name" | "slug"
      >;

      field_weather_cache: TableDefinition<
        {
          coordinate_key: string;
          expires_at: string | null;
          fetched_at: string | null;
          field_id: string;
          payload: Json | null;
          refresh_token: string | null;
          refresh_until: string | null;
        },
        "coordinate_key" | "field_id",
        [
          FK<
            "field_weather_cache_field_id_fkey",
            "field_id",
            "fields",
            true
          >,
        ]
      >;

      fields: TableDefinition<
        {
          boundary: unknown;
          center: unknown;
          created_at: string;
          crops: Json;
          current_crop: Json | null;
          current_stage_id: number | null;
          id: string;
          name: string;
          owner_id: string;
          region: string | null;
          updated_at: string;
        },
        "name" | "owner_id",
        [
          FK<
            "fields_current_stage_id_fkey",
            "current_stage_id",
            "post_stages"
          >,
          ...ProfileFK<"fields_owner_id_fkey", "owner_id">,
        ]
      >;

      notification_outbox: TableDefinition<
        {
          accepted_at: string | null;
          attempts: number;
          completed_at: string | null;
          created_at: string;
          device_id: string;
          error: string | null;
          external_id: string | null;
          id: string;
          next_attempt_at: string;
          notification_id: string;
          processing_started_at: string | null;
          provider_response: Json | null;
          receipt_checked_at: string | null;
          status: string;
          updated_at: string;
        },
        "device_id" | "notification_id",
        [
          FK<
            "notification_outbox_device_id_fkey",
            "device_id",
            "push_devices"
          >,
          FK<
            "notification_outbox_notification_id_fkey",
            "notification_id",
            "notifications"
          >,
        ]
      >;

      notification_preferences: TableDefinition<
        {
          ai_push: boolean;
          answers_push: boolean;
          created_at: string;
          push_enabled: boolean;
          reactions_push: boolean;
          replies_push: boolean;
          reputation_push: boolean;
          updated_at: string;
          user_id: string;
          votes_push: boolean;
          weather_push: boolean;
        },
        "user_id",
        [
          ...ProfileFK<
            "notification_preferences_user_id_fkey",
            "user_id",
            true
          >,
        ]
      >;

      notifications: TableDefinition<
        {
          actor_id: string | null;
          body: string;
          created_at: string;
          data: Json;
          dedupe_key: string;
          entity_id: string | null;
          entity_type: string | null;
          group_key: string | null;
          id: string;
          priority: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        },
        "dedupe_key" | "title" | "type" | "user_id",
        [
          ...ProfileFK<"notifications_actor_id_fkey", "actor_id">,
          ...ProfileFK<"notifications_user_id_fkey", "user_id">,
        ]
      >;

      post_ai_runs: TableDefinition<
        {
          completed_at: string | null;
          created_at: string;
          error: string | null;
          feature: string;
          id: string;
          input: Json;
          metadata: Json;
          model: string | null;
          post_id: string;
          provider: string | null;
          requested_by: string | null;
          result: Json | null;
          started_at: string | null;
          status: string;
          updated_at: string;
        },
        "post_id",
        [
          FK<"post_ai_runs_post_id_fkey", "post_id", "posts">,
          ...ProfileFK<"post_ai_runs_requested_by_fkey", "requested_by">,
        ]
      >;

      post_comments: TableDefinition<
        {
          ai_run_id: string | null;
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          parent_comment_id: string | null;
          post_id: string;
          system_actor_id: string | null;
          updated_at: string;
        },
        "body" | "post_id",
        [
          FK<
            "post_comments_ai_run_id_fkey",
            "ai_run_id",
            "post_ai_runs",
            true
          >,
          ...ProfileFK<"post_comments_author_id_fkey", "author_id">,
          FK<
            "post_comments_parent_comment_id_fkey",
            "parent_comment_id",
            "post_comments"
          >,
          FK<"post_comments_post_id_fkey", "post_id", "posts">,
          FK<
            "post_comments_system_actor_id_fkey",
            "system_actor_id",
            "system_actors"
          >,
        ]
      >;

      post_media: TableDefinition<
        {
          created_at: string;
          id: string;
          media_type: string;
          post_id: string;
          sort_order: number;
          storage_path: string;
        },
        "media_type" | "post_id" | "storage_path",
        [FK<"post_media_post_id_fkey", "post_id", "posts">]
      >;

      post_reactions: TableDefinition<
        {
          created_at: string;
          id: string;
          post_id: string;
          reaction_type_id: number;
          user_id: string;
        },
        "post_id" | "reaction_type_id" | "user_id",
        [
          FK<"post_reactions_post_id_fkey", "post_id", "posts">,
          FK<
            "post_reactions_reaction_type_id_fkey",
            "reaction_type_id",
            "reaction_types"
          >,
          ...ProfileFK<"post_reactions_user_id_fkey", "user_id">,
        ]
      >;

      post_stages: TableDefinition<
        {
          code: string;
          id: number;
          name: string;
          sort_order: number;
        },
        "code" | "name"
      >;

      post_statuses: TableDefinition<
        {
          code: string;
          id: number;
          name: string;
        },
        "code" | "name"
      >;

      post_summary_cache: TableDefinition<
        {
          expires_at: string | null;
          fingerprint: string;
          generated_at: string | null;
          lease_token: string | null;
          lease_until: string | null;
          post_id: string;
          result: Json | null;
          user_id: string;
        },
        "fingerprint" | "post_id" | "user_id",
        [
          FK<"post_summary_cache_post_id_fkey", "post_id", "posts">,
          ...ProfileFK<"post_summary_cache_user_id_fkey", "user_id">,
        ]
      >;

      post_summary_jobs: TableDefinition<
        {
          attempts: number;
          completed_at: string | null;
          created_at: string;
          error_code: string | null;
          fingerprint: string;
          id: string;
          input: Json;
          lease_token: string | null;
          lease_until: string | null;
          post_id: string;
          result: Json | null;
          snapshot_at: string;
          started_at: string | null;
          status: string;
          user_id: string;
        },
        "fingerprint" | "input" | "post_id" | "user_id",
        [
          FK<"post_summary_jobs_post_id_fkey", "post_id", "posts">,
          ...ProfileFK<"post_summary_jobs_user_id_fkey", "user_id">,
        ]
      >;

      post_types: TableDefinition<
        {
          code: string;
          id: number;
          name: string;
        },
        "code" | "name"
      >;

      posts: TableDefinition<
        {
          author: Json;
          author_id: string;
          body: string | null;
          created_at: string;
          crop_id: number | null;
          field_id: string | null;
          id: string;
          post_type_id: number;
          stage_id: number | null;
          status_id: number | null;
          title: string | null;
          updated_at: string;
        },
        "author_id" | "post_type_id",
        [
          ...ProfileFK<"posts_author_id_fkey", "author_id">,
          FK<"posts_crop_id_fkey", "crop_id", "crops">,
          FK<"posts_field_id_fkey", "field_id", "fields">,
          FK<"posts_post_type_id_fkey", "post_type_id", "post_types">,
          FK<"posts_stage_id_fkey", "stage_id", "post_stages">,
          FK<"posts_status_id_fkey", "status_id", "post_statuses">,
        ]
      >;

      profiles: TableDefinition<
        {
          avatar_path: string | null;
          created_at: string;
          id: string;
          name: string | null;
          region: string | null;
          reputation: number;
          specialization: string | null;
          updated_at: string;
        },
        "id"
      >;

      push_devices: TableDefinition<
        {
          app_version: string | null;
          created_at: string;
          device_key: string | null;
          enabled: boolean;
          endpoint: string;
          id: string;
          last_error: string | null;
          last_seen_at: string;
          platform: string;
          provider: string;
          updated_at: string;
          user_id: string;
        },
        "endpoint" | "platform" | "user_id",
        [...ProfileFK<"push_devices_user_id_fkey", "user_id">]
      >;

      reaction_types: TableDefinition<
        {
          code: string;
          id: number;
          is_active: boolean;
          name: string;
        },
        "code" | "name"
      >;

      reputation_events: TableDefinition<
        {
          created_at: string;
          id: string;
          points: number;
          source_id: string;
          source_type: string;
          user_id: string;
        },
        "points" | "source_id" | "source_type" | "user_id",
        [...ProfileFK<"reputation_events_user_id_fkey", "user_id">]
      >;

      system_actors: TableDefinition<
        {
          avatar_path: string | null;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        },
        "code" | "name"
      >;
    };

    Views: {
      profile_reputation_summary: {
        Row: {
          id: string | null;
          next_star_reputation: number | null;
          points_to_next_star: number | null;
          reputation: number | null;
          stars: number | null;
        };
        Insert: {
          id?: string | null;
          next_star_reputation?: never;
          points_to_next_star?: never;
          reputation?: number | null;
          stars?: never;
        };
        Update: {
          id?: string | null;
          next_star_reputation?: never;
          points_to_next_star?: never;
          reputation?: number | null;
          stars?: never;
        };
        Relationships: [];
      };
    };

    Functions: {
      build_post_author_snapshot: {
        Args: { profile_id: string };
        Returns: Json;
      };

      claim_field_weather_refresh: {
        Args: {
          p_coordinate_key: string;
          p_field_id: string;
        };
        Returns: string;
      };

      claim_notification_outbox: {
        Args: { p_limit?: number };
        Returns: {
          attempts: number;
          body: string;
          data: Json;
          device_id: string;
          endpoint: string;
          notification_id: string;
          notification_type: string;
          outbox_id: string;
          priority: string;
          title: string;
        }[];
      };

      claim_post_summary: {
        Args: {
          p_fingerprint: string;
          p_post_id: string;
          p_token: string;
          p_user_id: string;
        };
        Returns: Json;
      };

      claim_post_summary_jobs: {
        Args: never;
        Returns: Database["public"]["Tables"]["post_summary_jobs"]["Row"][];
        SetofOptions: {
          from: "*";
          to: "post_summary_jobs";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };

      create_notification: {
        Args: {
          p_actor_id?: string;
          p_body: string;
          p_data?: Json;
          p_dedupe_key: string;
          p_entity_id?: string;
          p_entity_type?: string;
          p_group_key?: string;
          p_priority?: string;
          p_title: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: string;
      };

      disable_push_device: {
        Args: { p_handle: string };
        Returns: undefined;
      };

      enqueue_post_summary: {
        Args: {
          p_fingerprint: string;
          p_input: Json;
          p_post_id: string;
          p_snapshot_at: string;
          p_user_id: string;
        };
        Returns: Json;
      };

      finalize_post_ai_run: {
        Args: {
          p_metadata?: Json;
          p_reply: string;
          p_run_id: string;
        };
        Returns: Json;
      };

      finish_post_summary_job: {
        Args: {
          p_error?: string;
          p_job_id: string;
          p_result?: Json;
          p_token: string;
        };
        Returns: boolean;
      };

      get_field_weather_location: {
        Args: { p_field_id: string };
        Returns: {
          coordinate_source: string;
          field_id: string;
          latitude: number;
          longitude: number;
        }[];
      };

      get_post_summary_context: {
        Args: { p_post_id: string };
        Returns: Json;
      };

      list_notification_weather_fields: {
        Args: never;
        Returns: {
          field_id: string;
          field_name: string;
          latitude: number;
          longitude: number;
          owner_id: string;
        }[];
      };

      next_reputation_star_threshold: {
        Args: { p_reputation: number };
        Returns: number;
      };

      notification_should_push: {
        Args: {
          p_type: string;
          p_user_id: string;
        };
        Returns: boolean;
      };

      process_weather_notifications: {
        Args: never;
        Returns: Json;
      };

      rebuild_reputation_from_activity: {
        Args: never;
        Returns: undefined;
      };

      recalculate_profile_reputation: {
        Args: { p_user_id: string };
        Returns: undefined;
      };

      register_push_device: {
        Args: {
          p_app_version?: string;
          p_device_key?: string;
          p_handle: string;
          p_platform: string;
        };
        Returns: string;
      };

      reputation_stars: {
        Args: { p_reputation: number };
        Returns: number;
      };

      verify_notification_worker_secret: {
        Args: { p_value: string };
        Returns: boolean;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  NameOrOptions extends
      | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  Name extends (
    NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
      ? keyof (
        DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[NameOrOptions["schema"]]["Views"]
        )
      : never
    ) = never,
> = NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (
    DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[NameOrOptions["schema"]]["Views"]
    )[Name] extends { Row: infer R }
    ? R
    : never
  : NameOrOptions extends keyof (
      DefaultSchema["Tables"] & DefaultSchema["Views"]
      )
    ? (
      DefaultSchema["Tables"] & DefaultSchema["Views"]
      )[NameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;

export type TablesInsert<
  NameOrOptions extends
      | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  Name extends (
    NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
      ? keyof DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"]
      : never
    ) = never,
> = NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"][Name] extends {
      Insert: infer I;
    }
    ? I
    : never
  : NameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][NameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never;

export type TablesUpdate<
  NameOrOptions extends
      | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  Name extends (
    NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
      ? keyof DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"]
      : never
    ) = never,
> = NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[NameOrOptions["schema"]]["Tables"][Name] extends {
      Update: infer U;
    }
    ? U
    : never
  : NameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][NameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never;

export type Enums<
  NameOrOptions extends
      | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  Name extends (
    NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
      ? keyof DatabaseWithoutInternals[NameOrOptions["schema"]]["Enums"]
      : never
    ) = never,
> = NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[NameOrOptions["schema"]]["Enums"][Name]
  : NameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][NameOrOptions]
    : never;

export type CompositeTypes<
  NameOrOptions extends
      | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  Name extends (
    NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
      ? keyof DatabaseWithoutInternals[NameOrOptions["schema"]]["CompositeTypes"]
      : never
    ) = never,
> = NameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[NameOrOptions["schema"]]["CompositeTypes"][Name]
  : NameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][NameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;