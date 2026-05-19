export type ItemType = "lost" | "found";

export type ItemStatus = "active" | "claim_pending" | "verified" | "completed" | "closed";

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
