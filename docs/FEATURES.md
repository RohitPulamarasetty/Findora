# FEATURES.md — Feature Specifications
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## Feature Index

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| F-01 | Authentication & Authorization | MVP | P0 |
| F-02 | User Profiles | MVP | P0 |
| F-03 | Lost Item Reporting | MVP | P0 |
| F-04 | Found Item Reporting | MVP | P0 |
| F-05 | Image Upload & Management | MVP | P0 |
| F-06 | Item Browse & Discovery | MVP | P0 |
| F-07 | Search & Filters | MVP | P1 |
| F-08 | Item Detail Page | MVP | P0 |
| F-09 | Real-Time Messaging | MVP | P0 |
| F-10 | Recovery Workflow | MVP | P0 |
| F-11 | Case Archive | MVP | P1 |
| F-12 | Admin Dashboard | MVP | P0 |
| F-13 | Admin User Management | MVP | P0 |
| F-14 | Admin Analytics | MVP | P1 |
| F-15 | Abuse/Spam Reporting | MVP | P1 |
| F-16 | Dark/Light Mode | MVP | P2 |
| F-17 | Notifications (in-app) | Stretch | P2 |
| F-18 | PWA Support | Stretch | P3 |

---

## F-01: Authentication & Authorization

### Description
Google OAuth via Supabase Auth with domain restriction to `@ds.study.iitm.ac.in`.

### User Flow
1. User visits `/login`
2. Clicks "Sign in with Google"
3. Redirected to Google OAuth consent screen
4. Returns to app with token
5. Supabase auth hook validates email domain
6. If invalid domain → sign out + display error
7. If valid → create user profile (if new) → redirect to `/home`

### UI Components
- `LoginPage` — centered card with logo, Google sign-in button, domain restriction notice
- `AuthGuard` — HOC/wrapper for protected routes
- `SessionProvider` — context wrapping entire app

### Edge Cases
- Non-IITM email → graceful error message on login page
- Banned user → blocked on session check with reason shown
- Session expiry → silent refresh via Supabase SDK, fallback to re-login

### Technical Notes
- Supabase `auth.users` triggers a `handle_new_user()` function to populate `public.users`
- Domain check happens both client-side (UX) and server-side (RLS + trigger)
- Session stored in Supabase cookie (httpOnly, Secure, SameSite=Lax)

---

## F-02: User Profiles

### Description
Auto-created user profile on first login with editable display name and avatar.

### Fields
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | FK to `auth.users.id` |
| `email` | text | From Google OAuth |
| `full_name` | text | From Google OAuth, editable |
| `avatar_url` | text | From Google, can be updated |
| `role` | enum | `user` or `admin` |
| `is_banned` | boolean | Set by admin |
| `ban_reason` | text | Optional |
| `created_at` | timestamp | Auto |

### UI Components
- `ProfilePage` — view/edit own profile
- `UserAvatar` — reusable avatar with fallback initials
- `ProfileCard` — condensed card used in reports/chats

---

## F-03: Lost Item Reporting

### Description
Form-based flow to report a lost item with rich metadata and image uploads.

### Fields
| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Max 100 chars |
| Description | Yes | Max 1000 chars |
| Category | Yes | Enum (see below) |
| Location | Yes | Text + optional campus map pin |
| Date Lost | Yes | Date picker, max = today |
| Images | No | Up to 5, max 5MB each |

### Categories
`Electronics`, `ID/Documents`, `Keys`, `Wallet/Bag`, `Clothing`, `Jewellery`, `Sports Equipment`, `Books/Stationery`, `Other`

### Status Flow
`LOST` → `CLAIM_PENDING` → `VERIFIED` → `COMPLETED`

### UI Components
- `ReportLostForm` — multi-step or single-page form
- `ImageUploader` — drag-and-drop with preview and remove
- `CategoryPicker` — icon-based grid selector
- `LocationInput` — text field with autocomplete suggestions

### Validations
- Title: 5–100 characters
- Description: 10–1000 characters
- Date: cannot be in the future
- Images: JPEG/PNG/WebP only, max 5MB, max 5 files
- Rate limit: max 3 reports per hour per user

---

## F-04: Found Item Reporting

### Description
Same form structure as lost item, but for reporting found items.

### Status Flow
`FOUND` → `CLAIM_PENDING` → `VERIFIED` → `COMPLETED`

### Additional Flow
- After submitting, user sees "Thank you for reporting!" confirmation
- Item visible on browse page immediately
- Owner can discover the item and initiate contact

---

## F-05: Image Upload & Management

### Description
Multi-image upload with Supabase Storage, CDN delivery, and strict validation.

### Specifications
- Storage bucket: `item-images` (public read, auth write)
- Max file size: 5MB per image
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max 5 images per report
- Thumbnails generated on client before upload (resize to max 1920px)
- Storage path: `{user_id}/{item_id}/{filename}`
- Images served via Supabase Storage CDN URL

### UI Components
- `ImageUploader` — drag-drop zone with progress bars
- `ImageGallery` — swipeable gallery on item detail
- `ImageThumbnail` — lazy-loaded thumbnail with skeleton

---

## F-06: Item Browse & Discovery

### Description
Paginated, filterable feed of all active lost and found items.

### Views
- **Feed View** — card grid (default)
- **List View** — compact list for dense browsing
- Tabs: `Lost Items` | `Found Items` | `All`

### Item Card Contents
- Primary image (or placeholder icon)
- Title
- Category badge
- Location
- Date
- Status chip
- Time ago

### Pagination
- 20 items per page
- Infinite scroll on mobile
- Page navigation on desktop

---

## F-07: Search & Filters

### Description
Real-time search with advanced filters to narrow item discovery.

### Search
- Full-text search on `title` and `description` (PostgreSQL `tsvector`)
- Debounced input (300ms)
- Highlighted match results

### Filters
| Filter | Type |
|--------|------|
| Category | Multi-select |
| Date Range | Date picker (from/to) |
| Location | Text search |
| Status | Select (active / completed) |
| Report Type | Lost / Found |

### URL State
- All filters reflected in URL params for shareability
- Example: `/search?q=airpods&category=Electronics&from=2026-05-01`

---

## F-08: Item Detail Page

### Description
Full-detail page for a single item report with all metadata and action buttons.

### Layout
- Image gallery (swipeable on mobile)
- Title, category, status badge
- Description
- Location + date
- Reporter info (avatar + name)
- Action buttons (context-dependent)

### Action Buttons Logic
| User Role | Item Type | Action |
|-----------|-----------|--------|
| Owner of lost item | Views a found item | "Connect with Finder" |
| Finder of found item | Views a lost item match | "Connect with Owner" |
| Owner of a claim-pending item | Own item | "Mark as Received" |
| Admin | Any item | "Remove Report" |
| Item author | Own report | "Edit" / "Close Report" |

---

## F-09: Real-Time Messaging

### Description
Secure in-app 1:1 messaging between item owner and finder, powered by Supabase Realtime.

### Conversation Creation
1. User A (owner) clicks "Connect with Finder" on a found item
2. System creates a `conversations` record linking: item_id, owner_id, finder_id
3. Both users see the conversation in their "Messages" tab
4. Messages can now be sent

### Message Features
- Real-time delivery via Supabase Realtime broadcast
- Read receipts (read/unread state per message)
- Typing indicators
- Message timestamps
- Infinite scroll (load older messages)
- System messages for status changes (e.g., "Case marked as completed")

### Authorization
- Only `owner_id` and `finder_id` of a conversation can read/send messages
- Enforced via RLS on `messages` table
- Admin bypass via `role = 'admin'` RLS policy

### UI Components
- `MessagesPage` — list of all user conversations
- `ConversationView` — full chat UI with message list + input
- `MessageBubble` — individual message with status indicator
- `TypingIndicator` — animated dots
- `ChatInput` — textarea with send button, disabled when locked

---

## F-10: Recovery Workflow

### Description
Structured flow to close a lost/found case after successful handover.

### Steps
1. Owner opens conversation or item detail page
2. Clicks "I Received My Item"
3. Confirmation dialog appears
4. On confirm:
   - Item status → `COMPLETED`
   - Conversation → `locked = true`
   - Both users notified (in-app banner)
   - Item moved to "Completed Cases" archive
5. Chat becomes read-only

### Status Machine
```
LOST ──────────────────────────► CLAIM_PENDING ──► VERIFIED ──► COMPLETED
FOUND ─────────────────────────► CLAIM_PENDING ──► VERIFIED ──► COMPLETED
                                                               ──► CLOSED (admin)
```

---

## F-11: Case Archive

### Description
Archive view for completed cases. Read-only. Accessible from menu.

### Contents
- All items with status `COMPLETED` or `CLOSED`
- Same detail page layout, but with "Completed" badge
- Chat viewable but input disabled

---

## F-12: Admin Dashboard

### Description
Secure admin-only area for platform management.

### Sections
- **Overview** — stats cards (total reports, active cases, users, recovery rate)
- **Reports** — all items with bulk actions
- **Users** — all users with ban/suspend actions
- **Conversations** — all chats viewable
- **Banned Emails** — manage email blocklist
- **Flagged Content** — items/messages flagged by users

### Access Control
- Route: `/admin/*`
- Middleware checks `user.role === 'admin'`
- If not admin → redirect to `/home`

---

## F-13: Admin User Management

### Description
Full user lifecycle management by admin.

### Actions
| Action | Description |
|--------|-------------|
| View user | Profile, reports, chats |
| Suspend user | Temporary block (with duration) |
| Ban user | Permanent block + reason |
| Ban email | Block an email from ever registering |
| Unban | Restore access |

---

## F-14: Admin Analytics

### Description
Dashboard with key platform metrics.

### Metrics
- Reports created per day (chart)
- Recovery rate (% completed / total)
- Active users (last 7/30 days)
- Top categories
- Average time to recovery

---

## F-15: Abuse/Spam Reporting

### Description
User-facing flag mechanism for inappropriate content.

### Flow
1. User clicks "Report" on any item or message
2. Selects reason: Spam / Inappropriate / Fake / Other
3. Report logged in `reports` table
4. Admin sees flagged items in dashboard
5. Admin resolves: dismiss or remove content

---

## F-16: Dark/Light Mode

### Description
System-preference-aware theme with manual toggle.

### Implementation
- CSS variables via Tailwind's `dark:` variant
- `next-themes` library for theme management
- Theme stored in `localStorage`
- Toggle in profile menu and settings

---
