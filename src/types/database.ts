// Hand-maintained until `npx supabase gen types typescript --project-id <id>` is run.
// Keep in sync with supabase/migrations/.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ItemType = "lost" | "found";
export type ItemStatus = "active" | "claim_pending" | "verified" | "completed" | "closed";
export type ItemCategory =
  | "electronics"
  | "clothing"
  | "accessories"
  | "books"
  | "stationery"
  | "keys"
  | "wallet"
  | "id_card"
  | "bag"
  | "sports"
  | "other";
export type UserRole = "student" | "admin";
export type MessageStatus = "sent" | "delivered" | "read";
export type FlagReason = "spam" | "inappropriate" | "fake" | "duplicate" | "other";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          is_banned: boolean;
          items_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          items_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          items_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          type: ItemType;
          status: ItemStatus;
          category: string;
          title: string;
          description: string;
          location: string;
          date_occurred: string;
          flag_count: number;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: ItemType;
          status?: ItemStatus;
          category: string;
          title: string;
          description: string;
          location: string;
          date_occurred: string;
          flag_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: ItemType;
          status?: ItemStatus;
          category?: string;
          title?: string;
          description?: string;
          location?: string;
          date_occurred?: string;
          flag_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      item_images: {
        Row: {
          id: string;
          item_id: string;
          storage_path: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          storage_path: string;
          url: string;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey";
            columns: ["item_id"];
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          item_id: string;
          owner_id: string;
          finder_id: string;
          is_locked: boolean;
          unread_owner: number;
          unread_finder: number;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          owner_id: string;
          finder_id: string;
          is_locked?: boolean;
          unread_owner?: number;
          unread_finder?: number;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          is_locked?: boolean;
          unread_owner?: number;
          unread_finder?: number;
          last_message_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          is_system: boolean;
          status: MessageStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          is_system?: boolean;
          status?: MessageStatus;
          created_at?: string;
        };
        Update: {
          status?: MessageStatus;
        };
        Relationships: [];
      };
      flags: {
        Row: {
          id: string;
          reporter_id: string;
          item_id: string | null;
          message_id: string | null;
          reason: FlagReason;
          notes: string | null;
          is_resolved: boolean;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          item_id?: string | null;
          message_id?: string | null;
          reason: FlagReason;
          notes?: string | null;
          is_resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      banned_emails: {
        Row: {
          id: string;
          email: string;
          reason: string | null;
          banned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          reason?: string | null;
          banned_by?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      find_fuzzy_item_ids: {
        Args: {
          p_query: string;
          p_type?: string | null;
          p_status?: string;
          p_categories?: string[] | null;
          p_date_from?: string | null;
          p_date_to?: string | null;
          p_limit?: number;
        };
        Returns: Array<{ item_id: string; rank: number }>;
      };
    };
    Enums: {
      item_type: ItemType;
      item_status: ItemStatus;
      item_category: ItemCategory;
      user_role: UserRole;
      message_status: MessageStatus;
      flag_reason: FlagReason;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
