export type ItemType = "lost" | "found";

// Lifecycle (see supabase/migrations/0012_item_lifecycle.sql):
//   active         — visible in the public feed
//   claim_pending  — finder/owner negotiation in progress
//   verified       — admin or owner verified the handover
//   completed      — owner confirmed recovery (terminal, success)
//   resolved       — alias for completed, kept for forward-compat with admin tooling
//   closed         — manually closed without recovery
//   expired        — auto-aged out (future: maintenance job)
//   removed        — soft-deleted (owner DELETE or admin action) — kept for analytics
export type ItemStatus =
  | "active"
  | "claim_pending"
  | "verified"
  | "completed"
  | "resolved"
  | "closed"
  | "expired"
  | "removed";

/** Statuses that should NOT appear in the public feed. */
export const NON_ACTIVE_ITEM_STATUSES: readonly ItemStatus[] = [
  "completed",
  "resolved",
  "closed",
  "expired",
  "removed",
] as const;

export type ItemCategory =
  | "electronics"
  | "clothing"
  | "accessories"
  | "books"
  | "keys"
  | "bag"
  | "stationery"
  | "sports"
  | "wallet"
  | "id_card"
  | "other";

export interface Item {
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
  // Lifecycle audit fields (nullable until resolved/removed).
  resolved_at: string | null;
  resolved_by: string | null;
  handover_confirmed: boolean;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  storage_path: string;
  url: string;
  created_at: string;
}

export interface ItemWithUser extends Item {
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  images: ItemImage[];
}

export interface ItemFilters {
  type?: "lost" | "found" | "all";
  category?: ItemCategory[];
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  status?: "active" | "completed" | "all";
  search?: string;
}
