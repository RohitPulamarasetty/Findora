# STATE_MANAGEMENT.md — State Management
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. State Management Philosophy

Findora follows the **"right tool for the right state"** principle:

| State Type | Tool | Why |
|-----------|------|-----|
| Server/async state | TanStack Query v5 | Caching, background refresh, pagination, optimistic updates |
| Global client state | Zustand | Auth user, theme, unread counts, notifications |
| Local UI state | React `useState/useReducer` | Dropdowns, modals, form steps |
| Form state | React Hook Form + Zod | Validation, submission, field management |
| URL/search state | Next.js `searchParams` | Filters, search queries, shareable state |
| Realtime state | Supabase Realtime + local merge | Messages, live item updates |

---

## 2. Server State — TanStack Query v5

### Setup

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,  // 2 minutes
        gcTime: 1000 * 60 * 10,    // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Query Key Convention

```typescript
// lib/query-keys.ts
export const queryKeys = {
  items: {
    all: ['items'] as const,
    list: (filters: ItemFilters) => ['items', 'list', filters] as const,
    detail: (id: string) => ['items', 'detail', id] as const,
    mine: (userId: string) => ['items', 'mine', userId] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    list: (userId: string) => ['conversations', 'list', userId] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    messages: (conversationId: string) => ['conversations', 'messages', conversationId] as const,
  },
  users: {
    me: ['users', 'me'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
  },
  admin: {
    users: (filters: AdminUserFilters) => ['admin', 'users', filters] as const,
    items: (filters: AdminItemFilters) => ['admin', 'items', filters] as const,
    analytics: ['admin', 'analytics'] as const,
    flags: ['admin', 'flags'] as const,
  },
} as const
```

### Core Hooks

```typescript
// hooks/use-items.ts
export function useItems(filters: ItemFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: ({ pageParam = 1 }) => fetchItems({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < Math.ceil(lastPage.meta.total / lastPage.meta.per_page)
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 1000 * 60,  // 1 minute for feed
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => fetchItem(id),
    staleTime: 1000 * 60 * 5,  // 5 minutes for detail
  })
}

// hooks/use-create-item.ts
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      // Invalidate item lists so feed updates
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })

      // Optionally optimistically prepend to cache
      queryClient.setQueryData(
        queryKeys.items.list({}),
        (old: InfiniteData<ItemsPage> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: [
              { ...old.pages[0], data: [newItem, ...old.pages[0].data] },
              ...old.pages.slice(1),
            ],
          }
        }
      )
    },
  })
}
```

### Optimistic Updates Pattern

```typescript
// hooks/use-mark-received.ts
export function useMarkItemReceived() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => markItemReceived(itemId),

    onMutate: async (itemId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.items.detail(itemId) })

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.items.detail(itemId))

      // Optimistically update
      queryClient.setQueryData(queryKeys.items.detail(itemId), (old: Item) => ({
        ...old,
        status: 'completed',
      }))

      return { previous }
    },

    onError: (err, itemId, context) => {
      // Revert on error
      queryClient.setQueryData(queryKeys.items.detail(itemId), context?.previous)
    },

    onSettled: (data, error, itemId) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all })
    },
  })
}
```

---

## 3. Global State — Zustand

### Store Structure

```typescript
// stores/app-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppStore {
  // Auth state
  user: User | null
  setUser: (user: User | null) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Notifications
  totalUnreadMessages: number
  setTotalUnreadMessages: (count: number) => void

  // UI state
  isReportFormOpen: boolean
  setReportFormOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),

        theme: 'system',
        setTheme: (theme) => set({ theme }),

        totalUnreadMessages: 0,
        setTotalUnreadMessages: (count) => set({ totalUnreadMessages: count }),

        isReportFormOpen: false,
        setReportFormOpen: (open) => set({ isReportFormOpen: open }),
      }),
      {
        name: 'findora-app-store',
        partialize: (state) => ({ theme: state.theme }),  // only persist theme
      }
    )
  )
)
```

### Usage

```typescript
// In any component
const user = useAppStore(state => state.user)
const theme = useAppStore(state => state.theme)
const unreadCount = useAppStore(state => state.totalUnreadMessages)
```

---

## 4. Form State — React Hook Form + Zod

### Pattern

```typescript
// features/items/report-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const reportFormSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10).max(1000),
  category: z.enum([...itemCategories] as [string, ...string[]]),
  location: z.string().min(2).max(200),
  date_occurred: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    d => new Date(d) <= new Date(),
    'Date cannot be in the future'
  ),
})

type ReportFormValues = z.infer<typeof reportFormSchema>

export function ReportForm() {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { type: 'lost', title: '', description: '', location: '' },
  })

  const createItem = useCreateItem()

  const onSubmit = async (data: ReportFormValues) => {
    await createItem.mutateAsync(data)
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* form fields */}
      </form>
    </Form>
  )
}
```

---

## 5. URL State — Next.js `searchParams`

Search and filter state lives in the URL for shareability and browser history.

```typescript
// app/(app)/search/page.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function useItemFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: ItemFilters = {
    q: searchParams.get('q') || '',
    type: (searchParams.get('type') as 'lost' | 'found') || 'all',
    category: searchParams.getAll('category') as ItemCategory[],
    dateFrom: searchParams.get('from') || undefined,
    dateTo: searchParams.get('to') || undefined,
  }

  const setFilters = (newFilters: Partial<ItemFilters>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.delete(key)
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, value)
      }
    })

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const resetFilters = () => router.push(pathname)

  return { filters, setFilters, resetFilters }
}
```

---

## 6. Realtime State — Supabase + Local Merge

Messages are fetched initially via REST (TanStack Query), then updated in real-time via Supabase subscriptions. Both live in local React state to avoid query cache complexity.

```typescript
// hooks/use-messages.ts
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(true)
  const supabase = createClient()

  // Initial load (REST)
  useEffect(() => {
    fetchMessages(conversationId, { limit: 50 }).then(({ data, meta }) => {
      setMessages(data)
      setHasMore(meta.has_more)
    })
  }, [conversationId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates (optimistic + realtime)
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev =>
          prev.map(m => m.id === payload.new.id ? payload.new as Message : m)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const loadOlder = async () => {
    const oldest = messages[0]
    if (!oldest) return
    const { data, meta } = await fetchMessages(conversationId, {
      before: oldest.created_at,
      limit: 50,
    })
    setMessages(prev => [...data, ...prev])
    setHasMore(meta.has_more)
  }

  return { messages, hasMore, loadOlder }
}
```

---

## 7. State Invalidation Strategy

When key actions occur, related queries are invalidated:

| Action | Queries Invalidated |
|--------|-------------------|
| Create item | `items.all` |
| Delete item | `items.all`, `items.detail(id)` |
| Mark as received | `items.detail(id)`, `conversations.all` |
| Send message | — (realtime handles it) |
| Start conversation | `conversations.list` |
| Admin ban user | `admin.users` |
| Admin delete item | `items.all`, `admin.items` |
