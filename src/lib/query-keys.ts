// TanStack Query key factory — single source of truth for all cache keys
export const queryKeys = {
  items: {
    all: ["items"] as const,
    lists: () => [...queryKeys.items.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.items.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.items.all, "detail", id] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    lists: () => [...queryKeys.conversations.all, "list"] as const,
    detail: (id: string) => [...queryKeys.conversations.all, "detail", id] as const,
    messages: (conversationId: string) =>
      [...queryKeys.conversations.detail(conversationId), "messages"] as const,
  },
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  claims: {
    all: ["claims"] as const,
    /** Pending+decided claims against a single item — used by ClaimReviewSection. */
    forItem: (itemId: string) => [...queryKeys.claims.all, "for-item", itemId] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: () => [...queryKeys.admin.all, "users"] as const,
    flags: () => [...queryKeys.admin.all, "flags"] as const,
    analytics: () => [...queryKeys.admin.all, "analytics"] as const,
  },
  profile: {
    all: ["profile"] as const,
    /** Flat ItemWithUser[] for a user's own profile items list. */
    items: (userId: string) => [...queryKeys.profile.all, "items", userId] as const,
    /** Full profile row from the `users` table. */
    user: (userId: string) => [...queryKeys.profile.all, "user", userId] as const,
  },
} as const;
