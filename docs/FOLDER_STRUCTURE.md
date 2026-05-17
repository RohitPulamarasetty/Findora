# FOLDER_STRUCTURE.md — Project Folder Structure
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## Complete Directory Tree

```
findora/
├── .env.local                    # Local environment variables (git-ignored)
├── .env.example                  # Template for required env vars
├── .eslintrc.json                # ESLint configuration
├── .gitignore
├── .prettierrc                   # Prettier configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
├── middleware.ts                 # Next.js middleware (auth + route protection)
│
├── public/                       # Static assets
│   ├── icons/                    # App icons (PWA)
│   ├── images/
│   │   └── logo.svg
│   └── manifest.json             # PWA manifest
│
├── supabase/                     # Supabase configuration
│   ├── config.toml               # Supabase local config
│   └── migrations/               # SQL migration files
│       ├── 0001_initial_schema.sql
│       ├── 0002_users_table.sql
│       ├── 0003_items_table.sql
│       ├── 0004_conversations_table.sql
│       ├── 0005_flags_table.sql
│       ├── 0006_search_indexes.sql
│       └── 0007_triggers.sql
│
├── docs/                         # Project documentation
│   ├── PRD.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   └── ... (all docs)
│
└── src/
    ├── app/                      # Next.js App Router
    │   ├── layout.tsx            # Root layout (providers, fonts)
    │   ├── globals.css           # Global styles + CSS variables
    │   ├── not-found.tsx         # 404 page
    │   ├── error.tsx             # Error boundary page
    │   │
    │   ├── (auth)/               # Unauthenticated route group
    │   │   ├── layout.tsx        # Auth layout (centered, no nav)
    │   │   └── login/
    │   │       └── page.tsx      # Login page
    │   │
    │   ├── (app)/                # Authenticated route group
    │   │   ├── layout.tsx        # App layout (nav, sidebar, providers)
    │   │   │
    │   │   ├── home/
    │   │   │   └── page.tsx      # Home feed
    │   │   │
    │   │   ├── search/
    │   │   │   └── page.tsx      # Search + filter page
    │   │   │
    │   │   ├── report/
    │   │   │   └── page.tsx      # Create report form
    │   │   │
    │   │   ├── items/
    │   │   │   ├── [id]/
    │   │   │   │   ├── page.tsx  # Item detail page
    │   │   │   │   └── edit/
    │   │   │   │       └── page.tsx  # Edit item page
    │   │   │
    │   │   ├── messages/
    │   │   │   ├── page.tsx      # Conversation list
    │   │   │   └── [id]/
    │   │   │       └── page.tsx  # Single conversation/chat
    │   │   │
    │   │   ├── profile/
    │   │   │   └── page.tsx      # My profile + my reports
    │   │   │
    │   │   ├── cases/
    │   │   │   └── completed/
    │   │   │       └── page.tsx  # Completed cases archive
    │   │   │
    │   │   ├── settings/
    │   │   │   └── page.tsx      # User settings
    │   │   │
    │   │   └── admin/            # Admin-only route group
    │   │       ├── layout.tsx    # Admin layout (admin-specific sidebar)
    │   │       ├── page.tsx      # Admin dashboard / overview
    │   │       ├── users/
    │   │       │   └── page.tsx  # User management
    │   │       ├── items/
    │   │       │   └── page.tsx  # Item/report management
    │   │       ├── conversations/
    │   │       │   └── page.tsx  # Conversation viewer
    │   │       ├── flags/
    │   │       │   └── page.tsx  # Flagged content
    │   │       ├── banned-emails/
    │   │       │   └── page.tsx  # Email ban list
    │   │       └── analytics/
    │   │           └── page.tsx  # Platform analytics
    │   │
    │   └── api/                  # API Route Handlers
    │       ├── auth/
    │       │   └── callback/
    │       │       └── route.ts  # Supabase OAuth callback
    │       ├── items/
    │       │   ├── route.ts      # GET /items, POST /items
    │       │   └── [id]/
    │       │       ├── route.ts  # GET, PATCH, DELETE /items/:id
    │       │       ├── complete/
    │       │       │   └── route.ts   # POST /items/:id/complete
    │       │       └── images/
    │       │           ├── route.ts   # POST /items/:id/images
    │       │           └── [imageId]/
    │       │               └── route.ts  # DELETE /items/:id/images/:imageId
    │       ├── conversations/
    │       │   ├── route.ts      # GET, POST /conversations
    │       │   └── [id]/
    │       │       ├── route.ts  # GET /conversations/:id
    │       │       └── messages/
    │       │           ├── route.ts  # GET, POST /conversations/:id/messages
    │       │           └── [messageId]/
    │       │               └── read/
    │       │                   └── route.ts  # PATCH .../read
    │       ├── flags/
    │       │   └── route.ts      # POST /flags
    │       └── admin/
    │           ├── users/
    │           │   ├── route.ts  # GET /admin/users
    │           │   └── [id]/
    │           │       ├── ban/
    │           │       │   └── route.ts    # PATCH /admin/users/:id/ban
    │           │       └── unban/
    │           │           └── route.ts    # PATCH /admin/users/:id/unban
    │           ├── items/
    │           │   └── [id]/
    │           │       └── route.ts  # DELETE /admin/items/:id
    │           ├── flags/
    │           │   ├── route.ts  # GET /admin/flags
    │           │   └── [id]/
    │           │       └── resolve/
    │           │           └── route.ts   # PATCH .../resolve
    │           ├── banned-emails/
    │           │   └── route.ts  # GET, POST /admin/banned-emails
    │           └── analytics/
    │               └── route.ts  # GET /admin/analytics
    │
    ├── components/
    │   ├── ui/                   # shadcn/ui primitives (auto-generated)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── select.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── toast.tsx
    │   │   ├── badge.tsx
    │   │   ├── form.tsx
    │   │   ├── textarea.tsx
    │   │   ├── avatar.tsx
    │   │   ├── tabs.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   └── ...
    │   │
    │   ├── shared/               # Reusable app-level components
    │   │   ├── user-avatar.tsx
    │   │   ├── status-badge.tsx
    │   │   ├── category-badge.tsx
    │   │   ├── empty-state.tsx
    │   │   ├── page-header.tsx
    │   │   ├── confirm-dialog.tsx
    │   │   ├── infinite-scroll-list.tsx
    │   │   └── loading-skeletons/
    │   │       ├── item-card-skeleton.tsx
    │   │       ├── message-skeleton.tsx
    │   │       └── conversation-row-skeleton.tsx
    │   │
    │   ├── features/
    │   │   ├── auth/
    │   │   │   ├── google-sign-in-button.tsx
    │   │   │   └── auth-guard.tsx
    │   │   │
    │   │   ├── items/
    │   │   │   ├── item-card.tsx
    │   │   │   ├── item-grid.tsx
    │   │   │   ├── item-detail.tsx
    │   │   │   ├── report-form.tsx
    │   │   │   ├── report-form-steps/
    │   │   │   │   ├── basic-info-step.tsx
    │   │   │   │   ├── details-step.tsx
    │   │   │   │   └── images-step.tsx
    │   │   │   ├── image-uploader.tsx
    │   │   │   ├── image-gallery.tsx
    │   │   │   ├── search-bar.tsx
    │   │   │   ├── filter-panel.tsx
    │   │   │   └── category-picker.tsx
    │   │   │
    │   │   ├── messages/
    │   │   │   ├── conversation-list.tsx
    │   │   │   ├── conversation-row.tsx
    │   │   │   ├── message-list.tsx
    │   │   │   ├── message-bubble.tsx
    │   │   │   ├── chat-input.tsx
    │   │   │   └── typing-indicator.tsx
    │   │   │
    │   │   └── admin/
    │   │       ├── admin-stats-card.tsx
    │   │       ├── admin-user-row.tsx
    │   │       ├── admin-item-row.tsx
    │   │       └── analytics-chart.tsx
    │   │
    │   └── layout/
    │       ├── bottom-nav.tsx
    │       ├── sidebar-nav.tsx
    │       ├── hamburger-sheet.tsx
    │       ├── app-layout.tsx
    │       └── auth-layout.tsx
    │
    ├── hooks/                    # Custom React hooks
    │   ├── use-items.ts
    │   ├── use-item.ts
    │   ├── use-create-item.ts
    │   ├── use-conversations.ts
    │   ├── use-messages.ts
    │   ├── use-send-message.ts
    │   ├── use-item-filters.ts
    │   ├── use-current-user.ts
    │   ├── use-realtime-conversations.ts
    │   └── use-debounce.ts
    │
    ├── lib/                      # Utilities and helpers
    │   ├── query-keys.ts         # TanStack Query key constants
    │   ├── validations.ts        # Zod schemas
    │   ├── utils.ts              # General utilities (cn, formatters)
    │   ├── profanity.ts          # Profanity filter wrapper
    │   ├── file-validation.ts    # Image upload validation
    │   └── constants.ts          # App-wide constants
    │
    ├── utils/
    │   └── supabase/
    │       ├── client.ts         # Browser Supabase client
    │       ├── server.ts         # Server Supabase client (cookie-based)
    │       └── middleware.ts     # Middleware Supabase client
    │
    ├── stores/                   # Zustand stores
    │   └── app-store.ts
    │
    └── types/                    # TypeScript type definitions
        ├── database.ts           # Auto-generated Supabase types
        ├── items.ts              # Item-related types
        ├── conversations.ts      # Conversation/message types
        ├── users.ts              # User types
        └── api.ts                # API request/response types
```

---

## Key Design Decisions

### Why `(auth)` and `(app)` Route Groups?

Route groups allow different layouts for authenticated vs. unauthenticated pages without affecting the URL structure. `/login` uses `AuthLayout`, `/home` uses `AppLayout`.

### Why `components/features/` vs `components/shared/`?

- `shared/` — Components with no business logic, reusable anywhere (avatar, badge, empty state)
- `features/` — Components tied to a specific domain (items, messages, admin)
- `ui/` — Raw shadcn/ui primitives, never modified directly

### Why `utils/supabase/` with three files?

Supabase requires different client initialization strategies depending on context:
- `client.ts` — Browser (uses cookies via `@supabase/ssr`)
- `server.ts` — Server Components and Route Handlers (reads cookies from Next.js `cookies()`)
- `middleware.ts` — Edge middleware (reads/writes cookies via `NextRequest/NextResponse`)

### API Routes vs Server Actions

- **Route Handlers** (`/api/*`) — Used for all CRUD operations; consistent REST interface for potential future mobile app
- **Server Actions** — Avoided to keep API patterns consistent and testable; only used for simple form mutations where progressive enhancement matters
