# ARCHITECTURE.md — System Architecture
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Architecture Overview

Findora follows a **modern full-stack serverless architecture** using Next.js App Router on the frontend/API layer, Supabase as the backend-as-a-service (BaaS), and Cloudflare Pages + CDN for global deployment.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│          Next.js App Router (React 18, RSC)             │
│          TailwindCSS + shadcn/ui components             │
└───────────────────┬──────────────────────┬──────────────┘
                    │ HTTPS                │ WebSocket
        ┌───────────▼──────────┐  ┌───────▼──────────────┐
        │   Cloudflare Pages   │  │   Supabase Realtime  │
        │   Edge Network CDN   │  │   (WebSocket server) │
        │   WAF + Rate Limit   │  └───────┬──────────────┘
        └───────────┬──────────┘          │
                    │                     │
        ┌───────────▼─────────────────────▼──────────────┐
        │              Next.js API Routes                 │
        │         (Server Actions + Route Handlers)       │
        └───────────┬─────────────────────────────────────┘
                    │ Supabase Client (service role)
        ┌───────────▼─────────────────────────────────────┐
        │                   Supabase                      │
        │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
        │  │   Auth   │  │PostgreSQL│  │   Storage    │  │
        │  │  (GoTrue)│  │  + RLS   │  │  (S3-like)   │  │
        │  └──────────┘  └──────────┘  └──────────────┘  │
        └─────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.x (App Router) | Full-stack React framework |
| React | 18.x | UI library with Concurrent features |
| TypeScript | 5.x | Type safety across entire codebase |
| TailwindCSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Accessible component library |
| next-themes | latest | Dark/light mode |
| Zustand | 4.x | Lightweight client state management |
| React Query (TanStack) | 5.x | Server state, caching, mutations |
| React Hook Form | 7.x | Form state management |
| Zod | 3.x | Runtime validation (forms + API) |

### Backend
| Technology | Purpose |
|-----------|---------|
| Next.js Route Handlers | API endpoints |
| Next.js Server Actions | Form mutations (RSC-compatible) |
| Supabase Auth | Google OAuth, JWT, session management |
| Supabase PostgreSQL | Primary database |
| Supabase RLS | Row-level authorization |
| Supabase Storage | Image file storage |
| Supabase Realtime | WebSocket-based live updates |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Cloudflare Pages | Hosting, edge deployment |
| Cloudflare CDN | Global static asset delivery |
| Cloudflare WAF | Web Application Firewall |
| Cloudflare Rate Limiting | API abuse prevention |

---

## 3. Application Layer Architecture

### 3.1 Next.js App Router Structure

Findora uses the App Router with a clear separation between:

- **Public routes** — `/login`, `/about` (no auth required)
- **Protected routes** — everything under `/(app)/` (auth required)
- **Admin routes** — everything under `/(app)/admin/` (admin role required)
- **API routes** — under `/api/` (server-side, auth-checked)

### 3.2 Rendering Strategy

| Route | Rendering | Why |
|-------|-----------|-----|
| `/login` | SSG/Static | No dynamic data |
| `/home` | SSR + Client | Initial feed, then client-side updates |
| `/items/[id]` | SSR | SEO-friendly item pages |
| `/search` | Client | Filter/search state is interactive |
| `/messages` | Client | Real-time, cannot be SSR |
| `/admin/*` | SSR | Auth checked server-side |

### 3.3 Data Fetching Pattern

```
Server Component (RSC)
  │── Fetch initial data via Supabase server client
  │── Pass as props to Client Components
  │
Client Component
  │── React Query for client-side refetching/mutations
  │── Optimistic updates for UX
  │── Supabase Realtime subscriptions for live data
```

---

## 4. Authentication Architecture

See `AUTH_FLOW.md` for detailed flow diagrams.

```
User → Google OAuth → Supabase Auth (GoTrue)
  │
  ├── JWT issued (access + refresh token)
  ├── Email domain validated (server hook)
  ├── User profile created (DB trigger)
  └── Session persisted (httpOnly cookie via @supabase/ssr)
```

**Client access pattern:**
- Browser uses `@supabase/ssr` with cookie-based session
- Server Components use server-side Supabase client with cookie session
- API routes validate session from header/cookie
- RLS enforces authorization at database level

---

## 5. Database Architecture

See `DATABASE_SCHEMA.md` for full schema.

**Core tables:**
```
auth.users (Supabase managed)
  └── public.users (profile, role, ban status)
       ├── public.items (lost/found reports)
       │    └── public.item_images (image metadata)
       ├── public.conversations (owner ↔ finder)
       │    └── public.messages
       ├── public.flags (abuse reports)
       └── public.banned_emails
```

**RLS Summary:**
- All reads/writes authenticated unless explicitly public
- Users can only modify their own records
- Admin role bypasses most restrictions
- Conversations accessible only to participants

---

## 6. Real-Time Architecture

See `REALTIME_CHAT_ARCHITECTURE.md` for detailed design.

```
Client A (Sender)                    Client B (Receiver)
     │                                       │
     │── INSERT message to Supabase ──────►  │
     │                                       │
     │            Supabase Realtime          │
     │         (Postgres CDC / WAL)          │
     │                                       │
     │◄── broadcast to channel ─────────────►│
     │   `conversation:{id}`                 │
     │                                       │
     │   Client B receives in <500ms         │
```

Channel naming: `conversation:{conversation_id}`
Authorization: RLS on `messages` table (participants only)

---

## 7. Storage Architecture

```
Supabase Storage
  └── Bucket: item-images (public)
       └── {user_id}/
            └── {item_id}/
                 └── {uuid}.webp
```

**Access pattern:**
- Upload: Authenticated users only, via signed upload URL
- Read: Public CDN URLs (images are public once uploaded)
- Delete: Owner or admin only
- Validation: MIME type + file size enforced in API route before upload

---

## 8. Security Architecture

See `SECURITY.md` for full details.

**Layers:**
1. **Cloudflare WAF** — DDoS, bot, injection protection at edge
2. **Cloudflare Rate Limiting** — Per-IP and per-user request limits
3. **Next.js Middleware** — Route protection, session validation
4. **Supabase RLS** — Row-level authorization on every table
5. **API Input Validation** — Zod schemas on all inputs
6. **File Validation** — MIME type, size, count limits
7. **Email Domain Restriction** — Auth hook + RLS

---

## 9. Admin Architecture

```
/admin/* routes
  │
  ├── Middleware: check session + role = 'admin'
  ├── Server-side Supabase client (service role)
  └── Admin API routes (no RLS bypass needed, use service role)
```

Admin uses a **service role client** on the server to bypass RLS where necessary (e.g., viewing all conversations, managing users). This client is **never** exposed to the browser.

---

## 10. State Management Architecture

See `STATE_MANAGEMENT.md` for full design.

| State Type | Tool |
|-----------|------|
| Server/async state | TanStack Query v5 |
| UI/local state | React useState/useReducer |
| Global client state | Zustand (auth, theme, notifications) |
| Form state | React Hook Form + Zod |
| URL state | Next.js searchParams |
| Real-time state | Supabase Realtime + local merge |

---

## 11. Deployment Architecture

See `DEPLOYMENT.md` for full pipeline.

```
Developer → Git Push → GitHub Actions CI
                            │
                            ├── Type check (tsc)
                            ├── Lint (ESLint)
                            ├── Tests (Vitest)
                            └── Build (next build)
                                      │
                                      └── Cloudflare Pages Deploy
                                               │
                                               └── Edge Network (global)
                                                        │
                                                        └── Supabase (managed)
```

**Environment separation:**
- `main` branch → production (`findora.app`)
- `develop` branch → staging (`staging.findora.app`)
- Feature branches → preview deployments (Cloudflare Pages PR previews)

---

## 12. Key Architectural Decisions

See `DECISIONS.md` for full ADR log.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js App Router | RSC + edge deployment + file-based routing |
| BaaS | Supabase | Integrated auth, DB, storage, realtime |
| Styling | Tailwind + shadcn/ui | Speed + consistency + accessible primitives |
| State | Zustand + TanStack Query | Minimal footprint, powerful async state |
| Deployment | Cloudflare Pages | Edge performance + WAF + free tier |
| Auth | Supabase Google OAuth | Zero credential management, domain restriction |
| Real-time | Supabase Realtime | Native integration, no additional service |
