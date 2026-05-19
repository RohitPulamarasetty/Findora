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
  admin: {
    all: ["admin"] as const,
    users: () => [...queryKeys.admin.all, "users"] as const,
    flags: () => [...queryKeys.admin.all, "flags"] as const,
    analytics: () => [...queryKeys.admin.all, "analytics"] as const,
  },
} as const;
