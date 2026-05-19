# TASKS.md — Implementation Task List
# Findora: Campus Lost & Found Platform

**Version:** 1.1.0

Tasks are organized by milestone and ordered by dependency. Tick off as you go.

> **Implementation philosophy:** Design system first → layout shell second → features third.
> Every feature you build inherits the foundation. Getting these right eliminates UI rewrites later.

---

## Milestone 1: Project Foundation

### M1.1 — Project Setup
- [ ] Initialize Next.js 14 with TypeScript and App Router
- [ ] Configure TailwindCSS with custom design tokens
- [ ] Install and configure shadcn/ui
- [ ] Set up ESLint + Prettier with project-specific rules
- [ ] Configure `tsconfig.json` with path aliases (`@/`)
- [ ] Create `.env.example` with all required variables
- [ ] Set up `next.config.js` with security headers
- [ ] Initialize Git repository and push to GitHub

### M1.2 — Supabase Setup
- [ ] Create Supabase project
- [ ] Link project with Supabase CLI
- [ ] Create migration: enums (`item_type`, `item_status`, `item_category`, `user_role`, `message_status`, `flag_reason`)
- [ ] Create migration: `public.users` table + RLS policies
- [ ] Create migration: `public.items` table + RLS policies
- [ ] Create migration: `public.item_images` table + RLS policies
- [ ] Create migration: `public.conversations` + `public.messages` + RLS policies
- [ ] Create migration: `public.flags` + `public.banned_emails` tables + RLS policies
- [ ] Create migration: full-text search index on `items`
- [ ] Create migration: all triggers (`handle_new_user`, `update_updated_at`, `increment_flag_count`)
- [ ] Push all migrations to Supabase
- [ ] Generate TypeScript types: `npm run supabase:types`

### M1.3 — Supabase Client Setup
- [ ] Install `@supabase/ssr` and `@supabase/supabase-js`
- [ ] Create `utils/supabase/client.ts` (browser client)
- [ ] Create `utils/supabase/server.ts` (server client)
- [ ] Create `utils/supabase/middleware.ts` (middleware client)

### M1.4 — Authentication
- [ ] Configure Google OAuth in Supabase dashboard
- [ ] Create `app/(auth)/login/page.tsx` (login page UI)
- [ ] Create `app/api/auth/callback/route.ts` (OAuth callback handler)
- [ ] Implement domain restriction check in callback
- [ ] Implement ban check in callback
- [ ] Create `middleware.ts` for route protection
- [ ] Protect all `/(app)/*` routes (redirect to `/login`)
- [ ] Protect all `/admin/*` routes (redirect to `/home` if not admin)
- [ ] Test login flow end-to-end

### M1.5 — App Providers
- [ ] Create `app/providers.tsx` with QueryClientProvider
- [ ] Create Zustand app store (`stores/app-store.ts`)
- [ ] Wrap root `layout.tsx` with providers
- [ ] Install and configure `next-themes` for dark mode
- [ ] Create `app/globals.css` with CSS variable design tokens

---

## Milestone 1.6: Design Foundation

> **Why this milestone exists here:**
> Building features on top of an undefined design system creates inconsistency that compounds across every component. Defining typography, spacing, color, tokens, and primitives before writing a single feature component means every piece of UI that follows is consistent by default — not patched later. This is the single highest-leverage milestone in the project.

### M1.6.1 — Typography System
- [ ] Select and install typefaces via `next/font`: Cal Sans (headings), Plus Jakarta Sans (body), JetBrains Mono (code/timestamps)
- [ ] Create Tailwind typography scale in `tailwind.config.ts`:
  - `text-display` → 2.25rem / 700 / Cal Sans
  - `text-title` → 1.5rem / 600 / Cal Sans
  - `text-heading` → 1.125rem / 600 / Plus Jakarta Sans
  - `text-body` → 1rem / 400 / Plus Jakarta Sans
  - `text-small` → 0.875rem / 400 / Plus Jakarta Sans
  - `text-caption` → 0.75rem / 400 / Plus Jakarta Sans
  - `text-mono` → 0.875rem / JetBrains Mono
- [ ] Apply font variables to `<html>` in `app/layout.tsx`
- [ ] Verify font rendering in both light and dark mode on mobile and desktop

### M1.6.2 — Color Palette & Design Tokens
- [ ] Define all CSS custom properties in `app/globals.css` under `:root` and `.dark`:
  - **Brand:** `--brand`, `--brand-hover`, `--brand-muted`
  - **Surface:** `--bg-base`, `--bg-elevated`, `--bg-overlay`, `--bg-muted`
  - **Text:** `--text-primary`, `--text-secondary`, `--text-disabled`, `--text-inverse`
  - **Border:** `--border-default`, `--border-subtle`, `--border-strong`
  - **Status:** `--status-lost`, `--status-found`, `--status-pending`, `--status-completed`
  - **Feedback:** `--success`, `--warning`, `--error`, `--info`
- [ ] Map all tokens to Tailwind in `tailwind.config.ts` (e.g. `bg-base`, `text-primary`, `border-subtle`)
- [ ] Verify dark mode overrides activate correctly with `next-themes` class strategy
- [ ] Establish rule: no hardcoded hex/rgb values anywhere outside `globals.css`

### M1.6.3 — Spacing & Layout System
- [ ] Document and enforce the **8pt spacing grid**: base unit = 4px, use even multiples
- [ ] Define standard container widths in Tailwind config
- [ ] Define standard content padding: `px-4` mobile → `px-6` tablet → `px-8` desktop
- [ ] Define page vertical rhythm: `pt-4` from top on mobile, `pt-6` on desktop
- [ ] Define bottom nav page clearance utility: `pb-20 md:pb-0` on all scrollable page wrappers

### M1.6.4 — Animation & Motion Principles
- [ ] Add custom Tailwind animation utilities in `tailwind.config.ts`:
  - `animate-fade-in` → `opacity 150ms ease`
  - `animate-slide-up` → `transform 200ms ease` (translateY 8px → 0)
  - `animate-skeleton-pulse` → shimmer keyframe for skeleton components
- [ ] Define transition defaults in `globals.css` (`transition-colors`, `transition-opacity`)
- [ ] Establish rule: no transitions longer than 250ms on interactive elements
- [ ] Establish rule: page-level transitions use fade-in only — no full-page slide animations

### M1.6.5 — Card & Surface Variants
- [ ] Create `components/ui/card.tsx` extending shadcn Card with Findora variants:
  - `default` — standard surface with border
  - `elevated` — shadow-based elevation (modals, dropdowns)
  - `ghost` — borderless, muted background (inline blocks)
  - `interactive` — hover state + cursor pointer (ItemCard, ConversationRow)
- [ ] All card variants must use design tokens — no hardcoded colors
- [ ] Verify all variants render correctly in both light and dark mode

### M1.6.6 — Button Variants
- [ ] Audit shadcn `Button` — extend with project-specific variants if needed:
  - `primary` → brand fill
  - `secondary` → muted fill, brand text
  - `ghost` → transparent, brand text on hover
  - `destructive` → error-semantic fill (delete / ban actions)
  - `outline` → border-only, secondary actions
- [ ] Define standard sizes: `sm` (32px), `md` (40px), `lg` (48px — mobile CTAs)
- [ ] Enforce minimum **44px touch target** on all interactive elements via `min-h-[44px]`
- [ ] Confirm loading state: spinner + disabled styling on async mutations

### M1.6.7 — Loading Skeleton Patterns
- [ ] Create `components/shared/skeletons/skeleton-base.tsx` — base shimmer primitive
- [ ] Create `components/shared/skeletons/item-card-skeleton.tsx`
- [ ] Create `components/shared/skeletons/item-detail-skeleton.tsx`
- [ ] Create `components/shared/skeletons/conversation-row-skeleton.tsx`
- [ ] Create `components/shared/skeletons/message-skeleton.tsx`
- [ ] Create `components/shared/skeletons/profile-skeleton.tsx`
- [ ] Establish rule: every data-fetching component must have a matching skeleton — no raw spinners for page-level loading

### M1.6.8 — Empty State Patterns
- [ ] Create `components/shared/empty-state.tsx` with props: `icon`, `title`, `description`, `action?`
- [ ] Define standard empty states (to be wired in during feature milestones):
  - Feed → "Nothing lost here yet"
  - Search → "No items match your search"
  - Messages → "No messages yet"
  - Completed cases → "No recovered items yet"
- [ ] Establish rule: every list or feed must render `<EmptyState />` when data is empty — never a blank screen

### M1.6.9 — Reusable UI Primitives
- [ ] Create `components/shared/user-avatar.tsx` (image + fallback initials, sizes: sm/md/lg)
- [ ] Create `components/shared/status-badge.tsx` (semantic color tokens per item status)
- [ ] Create `components/shared/category-badge.tsx` (maps `item_category` enum → label + icon)
- [ ] Create `components/shared/page-header.tsx` (title + optional back button + optional action slot)
- [ ] Create `components/shared/confirm-dialog.tsx` (shadcn Dialog with confirm/cancel + destructive variant)
- [ ] Create `components/shared/infinite-scroll-list.tsx` (IntersectionObserver trigger for TanStack infinite queries)
- [ ] Create `components/shared/toast-provider.tsx` (Sonner wired into root layout)

---

## Milestone 1.7: Navigation & Layout

> **Why navigation comes before features:**
> Navigation defines the app shell — the persistent chrome that every screen lives inside. Building features before the shell means retrofitting every page into a layout it wasn't designed for, causing inconsistent padding, broken mobile scrolling, and misaligned tap targets. Finalizing the shell first means feature pages drop in and work.

### M1.7.1 — App Shell & Layout Wrappers
- [ ] Create `components/layout/app-layout.tsx` — responsive wrapper:
  - Mobile: full-width, `pb-20` bottom nav clearance
  - Desktop: `ml-[240px]` sidebar offset, `max-w-[1280px]` content cap
- [ ] Create `components/layout/auth-layout.tsx` — centered single-column for `/login`
- [ ] Wire `app/(app)/layout.tsx` → `<AppLayout />`
- [ ] Wire `app/(auth)/layout.tsx` → `<AuthLayout />`
- [ ] Verify shell renders correctly at 375px (iPhone SE), 768px (iPad), 1440px (desktop)

### M1.7.2 — Navigation Components
- [ ] Create `components/layout/bottom-nav.tsx` (mobile, fixed bottom):
  - Items: Home, Search, Report (+), Messages, Profile
  - Active state: brand color icon + label
  - Unread badge on Messages icon (wired to Zustand `unreadMessages`)
  - Height: 64px, `backdrop-blur-md` + semi-transparent background
- [ ] Create `components/layout/sidebar-nav.tsx` (desktop, fixed left):
  - Width: 240px, full viewport height
  - Same nav items as bottom nav in vertical list
  - Findora wordmark at top
  - Unread badge on Messages item
- [ ] Create `components/layout/hamburger-sheet.tsx` — slide-in sheet for Settings, Help, Sign Out
- [ ] Wire active route detection using `usePathname()` in both nav components
- [ ] Verify unread badge updates reactively via Zustand store subscription

### M1.7.3 — Responsive Strategy Verification
- [ ] Confirm `bottom-nav` is `md:hidden`
- [ ] Confirm `sidebar-nav` is `hidden md:flex`
- [ ] QA full layout at 375px, 768px, 1440px before any feature work begins
- [ ] Verify scroll behavior: page content scrolls independently, nav stays fixed
- [ ] Verify Report (+) FAB-style button is visually prominent on mobile

---

## Milestone 2: Item System

### M2.1 — Item CRUD API Routes
- [ ] Create `app/api/items/route.ts` (GET list, POST create)
- [ ] Create `app/api/items/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Create `app/api/items/[id]/complete/route.ts` (POST mark received)
- [ ] Implement Zod validation on all routes
- [ ] Implement profanity filter on text fields
- [ ] Implement rate limiting check (3 items/hour)

### M2.2 — Image Upload
- [ ] Create Supabase Storage bucket `item-images` (public)
- [ ] Set Storage bucket RLS policies
- [ ] Create `app/api/items/[id]/images/route.ts` (POST upload)
- [ ] Create `app/api/items/[id]/images/[imageId]/route.ts` (DELETE)
- [ ] Implement file type + size + magic byte validation
- [ ] Create `components/features/items/image-uploader.tsx`
- [ ] Create `components/features/items/image-gallery.tsx`

### M2.3 — Item Query Hooks
- [ ] Define `lib/query-keys.ts`
- [ ] Create `hooks/use-items.ts` (infinite query)
- [ ] Create `hooks/use-item.ts` (single item)
- [ ] Create `hooks/use-create-item.ts` (mutation + optimistic)
- [ ] Create `hooks/use-update-item.ts`
- [ ] Create `hooks/use-delete-item.ts`
- [ ] Create `hooks/use-mark-received.ts` (optimistic update)

### M2.4 — Report Form
- [ ] Create `components/features/items/category-picker.tsx`
- [ ] Create `components/features/items/report-form-steps/basic-info-step.tsx`
- [ ] Create `components/features/items/report-form-steps/details-step.tsx`
- [ ] Create `components/features/items/report-form-steps/images-step.tsx`
- [ ] Create `components/features/items/report-form.tsx` (multi-step wrapper)
- [ ] Create `app/(app)/report/page.tsx`

### M2.5 — Item Feed
- [ ] Create `components/features/items/item-card.tsx` (grid + list variants using `interactive` card)
- [ ] Create `components/features/items/item-grid.tsx`
- [ ] Create `app/(app)/home/page.tsx` (initial SSR + client-side infinite scroll)
- [ ] Wire `<InfiniteScrollList />` + `<ItemCardSkeleton />` + `<EmptyState />`

### M2.6 — Item Detail
- [ ] Create `components/features/items/item-detail.tsx`
- [ ] Implement action button logic (context-aware per user role + item status)
- [ ] Create `app/(app)/items/[id]/page.tsx`
- [ ] Create `app/(app)/items/[id]/edit/page.tsx`

---

## Milestone 3: Search & Discovery

### M3.1 — Search System
- [ ] Create `hooks/use-debounce.ts`
- [ ] Create `hooks/use-item-filters.ts` (URL state via `useSearchParams`)
- [ ] Create `components/features/items/search-bar.tsx` (debounced, 300ms)
- [ ] Create `components/features/items/filter-panel.tsx` (type, category, date range)
- [ ] Create `app/(app)/search/page.tsx`
- [ ] Implement FTS query in `GET /api/items` using `search_vector`
- [ ] Wire `<ItemCardSkeleton />` during search loading, `<EmptyState />` on no results

---

## Milestone 4: Real-Time Messaging

### M4.1 — Conversations API
- [ ] Create `app/api/conversations/route.ts` (GET list, POST create)
- [ ] Create `app/api/conversations/[id]/route.ts` (GET detail)
- [ ] Create `app/api/conversations/[id]/messages/route.ts` (GET cursor-paginated, POST)
- [ ] Create `app/api/conversations/[id]/messages/[messageId]/read/route.ts` (PATCH)
- [ ] Validate conversation participants in API routes
- [ ] Validate conversation is not locked before inserting message

### M4.2 — Conversation Query Hooks
- [ ] Create `hooks/use-conversations.ts`
- [ ] Create `hooks/use-messages.ts` (local state + realtime merge)
- [ ] Create `hooks/use-send-message.ts` (optimistic)
- [ ] Create `hooks/use-realtime-conversations.ts` (unread count → Zustand)

### M4.3 — Messaging UI
- [ ] Create `components/features/messages/conversation-list.tsx`
- [ ] Create `components/features/messages/conversation-row.tsx`
- [ ] Create `components/features/messages/message-bubble.tsx` (sent/received variants)
- [ ] Create `components/features/messages/message-list.tsx`
- [ ] Create `components/features/messages/chat-input.tsx` (auto-grow textarea + send button)
- [ ] Create `components/features/messages/typing-indicator.tsx`
- [ ] Create `app/(app)/messages/page.tsx` (conversation list)
- [ ] Create `app/(app)/messages/[id]/page.tsx` (chat view)
- [ ] Implement typing indicator broadcast via Supabase Realtime presence
- [ ] Implement read receipts on conversation open
- [ ] Implement reconnection fallback (polling when WebSocket drops)

---

## Milestone 5: Recovery Workflow & Profile

### M5.1 — Recovery Flow
- [ ] Wire "Connect with Finder" / "Connect with Owner" CTA buttons in `item-detail.tsx`
- [ ] Wire "Mark as Received" button → `use-mark-received.ts`
- [ ] Show `<ConfirmDialog />` before marking received
- [ ] Lock conversation after COMPLETED status
- [ ] Insert system message on case completion
- [ ] Create `app/(app)/cases/completed/page.tsx`

### M5.2 — User Profile
- [ ] Create `hooks/use-current-user.ts`
- [ ] Create `app/(app)/profile/page.tsx`
- [ ] Show own reports (active + completed) with status badges
- [ ] Allow editing display name
- [ ] Show basic stats (reports created, recovered)

### M5.3 — Abuse / Flag System
- [ ] Create `app/api/flags/route.ts` (POST)
- [ ] Add "Report" button to `item-detail.tsx` and `message-bubble.tsx`
- [ ] Create flag reason selection dialog

---

## Milestone 6: Admin Dashboard

### M6.1 — Admin Layout & Overview
- [ ] Create `app/(app)/admin/layout.tsx` (admin-specific nav override)
- [ ] Create `components/features/admin/admin-stats-card.tsx`
- [ ] Create `app/(app)/admin/page.tsx` (overview + stats cards)
- [ ] Implement `GET /api/admin/analytics`

### M6.2 — Admin User Management
- [ ] Create `app/(app)/admin/users/page.tsx`
- [ ] Create `components/features/admin/admin-user-row.tsx`
- [ ] Implement `GET /api/admin/users` (paginated)
- [ ] Implement `PATCH /api/admin/users/:id/ban`
- [ ] Implement `PATCH /api/admin/users/:id/unban`

### M6.3 — Admin Item Management
- [ ] Create `app/(app)/admin/items/page.tsx`
- [ ] Create `components/features/admin/admin-item-row.tsx`
- [ ] Implement `DELETE /api/admin/items/:id`

### M6.4 — Admin Moderation
- [ ] Create `app/(app)/admin/flags/page.tsx` (flagged content queue)
- [ ] Implement `GET /api/admin/flags`
- [ ] Implement `PATCH /api/admin/flags/:id/resolve`
- [ ] Create `app/(app)/admin/banned-emails/page.tsx`
- [ ] Implement `GET /api/admin/banned-emails`
- [ ] Implement `POST /api/admin/banned-emails`
- [ ] Create `app/(app)/admin/conversations/page.tsx`

### M6.5 — Analytics Chart
- [ ] Install `recharts`
- [ ] Create `components/features/admin/analytics-chart.tsx`
- [ ] Wire daily items reported/found chart into admin overview

---

## Milestone 7: Polish & Settings

### M7.1 — Settings Page
- [ ] Create `app/(app)/settings/page.tsx`
- [ ] Dark / light / system theme toggle (persisted in Zustand, synced with `next-themes`)
- [ ] Account info display (name, email, joined date)

### M7.2 — UI Polish & QA
- [ ] Add `animate-fade-in` to all page-level route components
- [ ] Full skeleton audit — every loading state uses `<Skeleton />`, no raw spinners
- [ ] Full empty state audit — every list has an `<EmptyState />`
- [ ] Add toast notifications for all mutations (success + error) via Sonner
- [ ] Dark mode QA pass on every screen
- [ ] Mobile layout QA on real device at 375px and 390px
- [ ] Desktop layout QA at 1280px and 1440px
- [ ] Keyboard navigation QA (Tab order, focus rings, dialog traps)
- [ ] Touch target audit — all interactive elements ≥ 44px

---

## Milestone 8: Security & Deployment

### M8.1 — Security Hardening
- [ ] Verify RLS on all tables (SQL checks per SECURITY.md)
- [ ] Verify admin role is set correctly in production DB
- [ ] Confirm all security headers in `next.config.js`
- [ ] Set up Cloudflare WAF rules
- [ ] Set up Cloudflare rate limiting rules
- [ ] Test domain restriction with a non-IITM email
- [ ] Test ban enforcement (login block + middleware block)
- [ ] Test file upload with invalid file types and oversized files

### M8.2 — CI/CD
- [ ] Create `.github/workflows/ci.yml` (typecheck + lint + build)
- [ ] Configure GitHub Secrets for all environment variables
- [ ] Verify CI passes on push to `develop`

### M8.3 — Deployment
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure production environment variables in Cloudflare dashboard
- [ ] Deploy to production
- [ ] Configure custom domain and SSL
- [ ] Test full user flow in production environment
- [ ] Set admin user in production DB (`UPDATE users SET role = 'admin' WHERE email = '...'`)

---

## Post-Launch (Backlog)

- [ ] Push notifications (Web Push API)
- [ ] PWA manifest + service worker
- [ ] AI-powered item matching suggestions (pgvector)
- [ ] QR code generation for found items
- [ ] Multi-campus support
- [ ] Sentry error tracking integration
- [ ] Performance monitoring (Cloudflare Analytics)
