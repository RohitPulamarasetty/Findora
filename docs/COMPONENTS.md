# COMPONENTS.md — Component System
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Component Architecture

Findora uses a **feature-based component architecture** layered on top of shadcn/ui primitives.

```
components/
  ui/           ← shadcn/ui primitives (Button, Dialog, etc.)
  shared/       ← Reusable app-level components
  features/     ← Feature-specific components
    auth/
    items/
    messages/
    admin/
    profile/
```

---

## 2. Shared Components

### `<UserAvatar />`

Displays user avatar with fallback to initials.

```typescript
interface UserAvatarProps {
  user: { full_name: string; avatar_url?: string | null }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
}
```

**Sizes:** `sm` = 24px, `md` = 36px, `lg` = 48px, `xl` = 64px

---

### `<StatusBadge />`

Chip/badge for item lifecycle status.

```typescript
interface StatusBadgeProps {
  status: ItemStatus  // 'lost' | 'found' | 'claim_pending' | 'verified' | 'completed' | 'closed'
  size?: 'sm' | 'md'
}
```

**Color mapping:**
| Status | Color |
|--------|-------|
| `lost` | Red |
| `found` | Green |
| `claim_pending` | Amber |
| `verified` | Blue |
| `completed` | Emerald |
| `closed` | Gray |

---

### `<CategoryBadge />`

Icon + label badge for item categories.

```typescript
interface CategoryBadgeProps {
  category: ItemCategory
  showLabel?: boolean
  size?: 'sm' | 'md'
}
```

---

### `<EmptyState />`

Standardized empty state with illustration, heading, and CTA.

```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    href?: string
  }
}
```

---

### `<LoadingSkeleton />`

Skeleton loaders for various content shapes.

```typescript
// Usage:
<ItemCardSkeleton />
<MessageBubbleSkeleton />
<ConversationRowSkeleton />
<ProfileCardSkeleton />
```

---

### `<ConfirmDialog />`

Reusable confirmation dialog built on shadcn/ui `<Dialog>`.

```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}
```

---

### `<PageHeader />`

Standardized page header with back button, title, and action slot.

```typescript
interface PageHeaderProps {
  title: string
  back?: boolean | string
  action?: React.ReactNode
}
```

---

### `<InfiniteScrollList />`

Generic infinite scroll wrapper using Intersection Observer.

```typescript
interface InfiniteScrollListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  emptyState: React.ReactNode
}
```

---

## 3. Feature Components — Items

### `<ItemCard />`

Primary card for item display in feed.

```typescript
interface ItemCardProps {
  item: ItemWithUser
  variant?: 'grid' | 'list'
  showOwner?: boolean
}
```

**Grid variant:** Image-first card with title, category badge, location, time ago
**List variant:** Compact horizontal layout for dense browsing

---

### `<ItemGrid />`

Responsive grid of `<ItemCard />` components.

```typescript
interface ItemGridProps {
  items: ItemWithUser[]
  isLoading?: boolean
  columns?: 1 | 2 | 3
}
```

---

### `<ReportForm />`

Multi-step form for creating lost or found item reports.

**Steps:**
1. Basic info (title, type, category)
2. Details (description, location, date)
3. Images (optional upload)
4. Review + submit

```typescript
interface ReportFormProps {
  type?: 'lost' | 'found'
  onSuccess?: (item: Item) => void
}
```

---

### `<ImageUploader />`

Drag-and-drop image uploader with preview.

```typescript
interface ImageUploaderProps {
  maxFiles?: number    // default 5
  maxSizeMB?: number   // default 5
  value: File[]
  onChange: (files: File[]) => void
}
```

**Features:**
- Drag-and-drop zone
- Click to browse
- Image preview thumbnails with remove button
- Progress indicator during upload
- Validation feedback (size, type errors)

---

### `<ImageGallery />`

Swipeable image gallery for item detail pages.

```typescript
interface ImageGalleryProps {
  images: ItemImage[]
  alt: string
}
```

**Features:**
- Swipeable on mobile (touch gestures)
- Arrow navigation on desktop
- Dot indicators
- Full-screen view on tap/click
- Lazy loading with blur placeholder

---

### `<ItemDetail />`

Full item detail view component.

```typescript
interface ItemDetailProps {
  item: ItemWithUser & { images: ItemImage[] }
  currentUser: User | null
  conversation?: Conversation | null
}
```

**Action button logic:**
- Owner views found item → "Connect with Finder"
- Finder's found item viewed by owner → "Connect with Owner"  
- Owner of claim-pending item → "Mark as Received"
- Item author → "Edit" / "Close Report"
- Admin → "Remove Report" (shown in admin context)

---

### `<SearchBar />`

Full-text search input with debounce.

```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number // default 300
}
```

---

### `<FilterPanel />`

Collapsible filter panel for item discovery.

```typescript
interface FilterPanelProps {
  filters: ItemFilters
  onChange: (filters: ItemFilters) => void
  onReset: () => void
}

interface ItemFilters {
  type?: 'lost' | 'found' | 'all'
  category?: ItemCategory[]
  dateFrom?: string
  dateTo?: string
  location?: string
  status?: 'active' | 'completed' | 'all'
}
```

---

## 4. Feature Components — Messaging

### `<ConversationList />`

List of all user conversations with last message preview.

```typescript
interface ConversationListProps {
  conversations: ConversationWithPreview[]
  activeId?: string
  onSelect: (id: string) => void
}
```

---

### `<ConversationRow />`

Single conversation row in the list.

```typescript
interface ConversationRowProps {
  conversation: ConversationWithPreview
  isActive: boolean
  onClick: () => void
}
```

**Shows:** Other user avatar, name, item title, last message preview, timestamp, unread count badge

---

### `<MessageList />`

Scrollable list of messages in a conversation.

```typescript
interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLocked: boolean
  hasMore: boolean
  onLoadMore: () => void
}
```

**Features:**
- Groups consecutive messages from same sender
- Shows date separators
- System messages styled differently
- Auto-scrolls to bottom on new message

---

### `<MessageBubble />`

Individual message display.

```typescript
interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  isSystem: boolean
}
```

**Own messages:** Right-aligned, primary color, read receipt
**Other messages:** Left-aligned, neutral color, sender avatar

---

### `<ChatInput />`

Message composition input.

```typescript
interface ChatInputProps {
  onSend: (content: string) => void
  isLocked: boolean
  isSending: boolean
  onTyping: (isTyping: boolean) => void
}
```

**Features:**
- Auto-resize textarea (max 4 rows)
- Send on Enter (Shift+Enter for newline)
- Character count (2000 max)
- Disabled + locked notice when conversation is locked
- Loading state while sending

---

### `<TypingIndicator />`

Animated typing indicator.

```typescript
interface TypingIndicatorProps {
  typingUser: string | null
}
```

Shows: "Priya is typing..." with animated dots when `typingUser` is not null.

---

## 5. Feature Components — Admin

### `<AdminStatsCard />`

Metric card for admin dashboard.

```typescript
interface AdminStatsCardProps {
  title: string
  value: string | number
  change?: { value: number; period: string }
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}
```

---

### `<AdminUserRow />`

User row in admin user management table.

```typescript
interface AdminUserRowProps {
  user: UserWithStats
  onBan: (id: string) => void
  onUnban: (id: string) => void
}
```

---

### `<AdminItemRow />`

Item row in admin report management table.

```typescript
interface AdminItemRowProps {
  item: ItemWithUser
  onDelete: (id: string) => void
  onFlag: (id: string) => void
}
```

---

## 6. Navigation Components

### `<BottomNav />`

Mobile bottom navigation bar.

```typescript
const BOTTOM_NAV_ITEMS = [
  { label: 'Home',     href: '/home',    icon: HomeIcon },
  { label: 'Search',   href: '/search',  icon: SearchIcon },
  { label: 'Report',   href: '/report',  icon: PlusCircleIcon },
  { label: 'Messages', href: '/messages',icon: MessageCircleIcon },
  { label: 'Profile',  href: '/profile', icon: UserCircleIcon },
]
```

**Behavior:**
- Fixed to bottom of screen on mobile
- Active indicator on current route
- Unread badge on Messages tab
- Large center "+" for Report action

---

### `<SidebarNav />`

Desktop sidebar navigation.

```typescript
// Same items as BottomNav + secondary items
const SECONDARY_NAV = [
  { label: 'Completed Cases', href: '/cases/completed' },
  { label: 'Settings',        href: '/settings' },
  { label: 'Help',            href: '/help' },
  { label: 'Admin',           href: '/admin', adminOnly: true },
]
```

---

### `<HamburgerSheet />`

Mobile sheet menu (secondary navigation).

Slides up from bottom or right. Contains secondary navigation items.

---

## 7. Layout Components

### `<AppLayout />`

Root layout for authenticated pages.

- Mobile: BottomNav + HamburgerSheet
- Desktop: SidebarNav + main content area
- Injects theme, session, query client providers

---

### `<AuthLayout />`

Layout for unauthenticated pages (`/login`, `/about`).

Centered content, no navigation.

---

## 8. Component Guidelines

- All components use **TypeScript with explicit prop interfaces**
- Use `React.forwardRef` for components that need ref forwarding
- Every component has a `className` prop for style overrides
- Loading states via `isLoading` prop or skeleton variants
- Error states via `error` prop or ErrorBoundary
- All interactive components keyboard-accessible
- Animated with Tailwind transitions or Framer Motion
- Components export named exports (no default exports except pages)
