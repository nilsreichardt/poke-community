export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type AutomationCategory = "automation" | "template" | "integration";
export type SubscriptionType = "new" | "trending";

export interface Database {
  public: {
    Tables: {
      automations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          summary: string | null;
          description: string | null;
          prompt: string;
          setup_details: string | null;
          slug: string;
          tags: string[] | null;
          category: AutomationCategory;
          user_id: string;
          vote_total: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          summary?: string | null;
          description?: string | null;
          prompt: string;
          setup_details?: string | null;
          slug: string;
          tags?: string[] | null;
          category?: AutomationCategory;
          user_id: string;
          vote_total?: number;
        };
        Update: {
          updated_at?: string;
          title?: string;
          summary?: string | null;
          description?: string | null;
          prompt?: string;
          setup_details?: string | null;
          slug?: string;
          tags?: string[] | null;
          category?: AutomationCategory;
          vote_total?: number;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          created_at: string;
          automation_id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          automation_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          value?: number;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: SubscriptionType;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          type: SubscriptionType;
          active?: boolean;
        };
        Update: {
          active?: boolean;
          type?: SubscriptionType;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          email: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      automations_with_scores: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          description: string | null;
          prompt: string;
          setup_details: string | null;
          tags: string[] | null;
          category: AutomationCategory;
          created_at: string;
          updated_at: string;
          vote_total: number;
          recent_votes: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AutomationRecord =
  Database["public"]["Tables"]["automations"]["Row"];
export type VoteRecord = Database["public"]["Tables"]["votes"]["Row"];
export type SubscriptionRecord =
  Database["public"]["Tables"]["subscriptions"]["Row"];
