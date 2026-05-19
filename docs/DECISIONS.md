# DECISIONS.md — Architecture Decision Records
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

Each decision is an **Architecture Decision Record (ADR)** documenting what was decided, why, and what alternatives were considered.

---

## ADR-001: Use Next.js App Router (not Pages Router)

**Status:** Accepted
**Date:** 2026-05-17

### Context
Choose between Next.js App Router (React Server Components) and Pages Router.

### Decision
Use the **App Router** with React Server Components.

### Rationale
- RSC enables server-side rendering with zero client-side JS for static content
- Route groups (`(auth)`, `(app)`) allow different layouts without URL pollution
- Server Actions are available for progressive enhancement (though used sparingly)
- All shadcn/ui components support RSC model
- Cloudflare Pages supports Next.js App Router via `@cloudflare/next-on-pages`

### Alternatives Considered
- Pages Router: more stable, simpler mental model, but misses RSC benefits
- Remix: great for form-heavy apps, but less ecosystem support

---

## ADR-002: Use Supabase as Full Backend-as-a-Service

**Status:** Accepted
**Date:** 2026-05-17

### Context
Need auth, database, file storage, and real-time messaging. Options: build custom backend vs use BaaS.

### Decision
Use **Supabase** for all backend services (Auth, PostgreSQL, Storage, Realtime).

### Rationale
- Integrated auth, database, storage, and realtime in one platform
- PostgreSQL with RLS is a mature, production-grade foundation
- Supabase Realtime built on PostgreSQL CDC — no separate message broker
- `@supabase/ssr` provides first-class Next.js App Router support
- Generous free tier covers MVP needs; predictable scaling path
- Open source — can self-host if needed

### Alternatives Considered
- Firebase: NoSQL limits query flexibility; vendor lock-in concerns
- Custom Express/Node backend: more control but much more work to build and operate
- PlanetScale + Pusher + S3: more modular but requires coordinating multiple services

---

## ADR-003: Deploy on Cloudflare Pages (not Vercel)

**Status:** Accepted
**Date:** 2026-05-17

### Context
Need hosting for Next.js app with global CDN, WAF, and rate limiting.

### Decision
Deploy on **Cloudflare Pages**.

### Rationale
- Integrated CDN, WAF, and rate limiting at edge (no additional services needed)
- Cloudflare WAF provides enterprise-grade DDoS and bot protection
- Free tier is very generous (unlimited requests)
- `@cloudflare/next-on-pages` adapter provides good Next.js support
- Can run on Cloudflare Workers edge (low latency globally)

### Alternatives Considered
- Vercel: best-in-class Next.js support, but no built-in WAF; security requires external tools; pricing at scale is higher
- Netlify: similar to Cloudflare but less integrated security
- Self-hosted (Docker + VPS): too much ops overhead for MVP

### Trade-offs
- Cloudflare's Next.js adapter has some limitations (no Edge Runtime features that depend on Node.js APIs)
- Need `output: 'edge'` mode which has some constraints
- Supabase handles WAF at DB level anyway, so Cloudflare WAF is an additional layer

---

## ADR-004: Use TanStack Query for Server State

**Status:** Accepted
**Date:** 2026-05-17

### Context
Need a client-side data fetching and caching strategy for the React app.

### Decision
Use **TanStack Query v5** for all server/async state management.

### Rationale
- Best-in-class caching, background refresh, and optimistic updates
- Infinite scroll queries built-in (`useInfiniteQuery`)
- Devtools for debugging cache state
- Query invalidation is clean and explicit
- Works well alongside Supabase Realtime (use TQ for initial load, Realtime for updates)

### Alternatives Considered
- SWR: simpler, but less feature-rich (no infinite query, weaker mutation support)
- Redux Toolkit Query: too much boilerplate, Redux overhead not needed
- Manual fetch + useState: no caching, complex to get right

---

## ADR-005: Use Zustand for Global Client State

**Status:** Accepted
**Date:** 2026-05-17

### Context
Need minimal global state for auth user, theme, unread counts. TanStack Query handles server state.

### Decision
Use **Zustand** for global client-side state.

### Rationale
- Minimal bundle size (~1.5KB)
- Simple API with no boilerplate
- DevTools via `zustand/middleware`
- Persist middleware for theme preference
- Works naturally with React hooks

### Alternatives Considered
- Redux: massive overkill for what we need
- Jotai: good alternative, similar simplicity; chose Zustand for its store pattern which is clearer for onboarding
- React Context: doesn't scale well with frequent updates (unnecessary re-renders)

---

## ADR-006: Domain-Restrict to `@ds.study.iitm.ac.in` Only

**Status:** Accepted
**Date:** 2026-05-17

### Context
The platform is built for IITM DS campus students only. How to enforce this?

### Decision
Enforce email domain restriction at **two layers**: application callback and database trigger.

### Rationale
- Application layer: fast feedback to user (immediate sign-out + error message)
- Database trigger: ground truth; cannot be bypassed even if application logic has a bug
- Two-layer defense prevents domain restriction from being a single point of failure
- No invitation system needed — Google OAuth with domain check is friction-free for valid users

### Alternatives Considered
- Invitation-only: too much admin overhead
- Manual approval: doesn't scale
- Single application-layer check: single point of failure if middleware is bypassed

---

## ADR-007: REST API Routes (not Server Actions for all mutations)

**Status:** Accepted
**Date:** 2026-05-17

### Context
Next.js App Router supports both REST API Routes and Server Actions for mutations. Which to use?

### Decision
Use **REST API Route Handlers** (`/api/*`) for all CRUD operations.

### Rationale
- Consistent interface — any future mobile app or external client can consume the same API
- Easier to test in isolation (plain HTTP)
- Explicit request/response handling with Zod validation
- No magic — clearer mental model for the team
- API routes work well with TanStack Query's mutation pattern

### Trade-offs
- More verbose than Server Actions
- Server Actions provide progressive enhancement (works without JS) but this isn't a priority for a chat/real-time app

### Exception
Server Actions may be used for simple, idempotent form submissions where progressive enhancement matters (e.g., profile update form).

---

## ADR-008: Cursor-Based Pagination for Messages

**Status:** Accepted
**Date:** 2026-05-17

### Context
Messages in a conversation need pagination. Which pagination strategy?

### Decision
Use **cursor-based pagination** (by `created_at` timestamp) for messages.

### Rationale
- Real-time chats have frequent inserts; offset pagination becomes inconsistent as rows shift
- Cursor pagination is stable and performant
- Natural fit for chat: "load 50 messages before timestamp X"
- Works well with infinite scroll UX pattern

### Alternatives Considered
- Offset pagination: simple but breaks with concurrent inserts
- Keyset pagination by `id`: works but timestamp cursor is more intuitive for time-ordered data

---

## ADR-009: One Conversation Per Item

**Status:** Accepted
**Date:** 2026-05-17

### Context
Should a lost item be able to have multiple simultaneous conversations (multiple claimants)?

### Decision
Allow only **one conversation per item** (`UNIQUE (item_id)` constraint on `conversations`).

### Rationale
- Simplifies the recovery workflow significantly
- Prevents abuse (multiple people claiming the same item)
- Forces the item owner/finder to commit to one connection before proceeding
- If the connection fails, they can close the conversation and start a new one

### Trade-offs
- Finder who posts a found item can only connect with one potential owner at a time
- If first connection fails, workflow requires closing old conversation first (UX consideration)

### Future Consideration
If abuse patterns emerge (finders holding conversations without following through), add a timeout mechanism to auto-close stale `CLAIM_PENDING` conversations after 48 hours.

---

## ADR-010: Use `leo-profanity` for Content Filtering

**Status:** Accepted
**Date:** 2026-05-17

### Context
Need basic profanity filtering on user-submitted text.

### Decision
Use **`leo-profanity`** npm package as a lightweight client-side and server-side filter.

### Rationale
- Simple, configurable word list
- Works in both Node.js (API routes) and browser (future)
- No external API call — runs in-process
- Can add custom words to the filter list

### Limitations
- Simple pattern matching; creative evasions may bypass it
- Not a replacement for human moderation
- Admin flag system handles what profanity filter misses

---

## ADR-011: No Default Exports for Components

**Status:** Accepted
**Date:** 2026-05-17

### Context
Convention for React component exports: default or named?

### Decision
Use **named exports** for all components and utilities. Exception: Next.js pages and layouts require default exports.

### Rationale
- Named exports enable better refactoring (renaming a component is trackable by IDEs)
- Barrel files (`index.ts`) are cleaner with named exports
- Avoids the "what's in this file?" mystery of default exports
- Consistency across the codebase
