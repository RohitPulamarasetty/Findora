# AUTH_FLOW.md — Authentication & Authorization Flow
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Overview

Findora uses **Google OAuth 2.0 via Supabase Auth** with strict email domain restriction. The system is designed to allow only verified `@ds.study.iitm.ac.in` users while maintaining a seamless, password-free login experience.

---

## 2. Authentication Architecture

```
Browser                 Next.js                 Supabase Auth         Google OAuth
  │                        │                         │                     │
  │── click "Sign In" ────►│                         │                     │
  │                        │── signInWithOAuth() ───►│                     │
  │                        │                         │── redirect ────────►│
  │                        │                         │                     │
  │                        │◄── OAuth callback ──────│◄── code exchange ───│
  │                        │   /auth/callback         │                     │
  │                        │                         │                     │
  │                        │   exchange code          │                     │
  │                        │── validate session ─────►│                     │
  │                        │                         │                     │
  │                        │   domain check (hook)    │                     │
  │                        │   profile creation (trigger)                  │
  │                        │                         │                     │
  │◄── set session cookie ─│                         │                     │
  │    redirect /home       │                         │                     │
```

---

## 3. Login Flow (Step by Step)

### Step 1 — User Initiates Login

- User visits `/login`
- Clicks **"Sign in with Google"**
- Next.js calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Supabase redirects user to Google consent screen

### Step 2 — Google OAuth Consent

- User sees Google account picker
- Selects their account
- Google redirects to Supabase OAuth callback URL

### Step 3 — OAuth Callback

- Supabase handles the callback at `/auth/callback` (Next.js route)
- Exchanges authorization code for access + refresh tokens
- `auth.users` record created (if new user)

### Step 4 — Domain Validation

**Client-side (immediate UX feedback):**
```typescript
// In the callback route handler
const { data: { user } } = await supabase.auth.getUser()

if (!user?.email?.endsWith('@ds.study.iitm.ac.in')) {
  await supabase.auth.signOut()
  redirect('/login?error=domain_restricted')
}
```

**Server-side (database trigger) — ground truth:**
```sql
-- handle_new_user() trigger
IF NOT user_email LIKE '%@ds.study.iitm.ac.in' THEN
  DELETE FROM auth.users WHERE id = NEW.id;
  RETURN NULL;
END IF;
```

### Step 5 — Profile Creation

- Database trigger `on_auth_user_created` fires
- Inserts row into `public.users` with:
  - `id` from `auth.users`
  - `email`, `full_name`, `avatar_url` from Google metadata
  - `role = 'user'` (default)

### Step 6 — Session Establishment

- Supabase issues JWT (access token, 1 hour expiry)
- Refresh token stored in httpOnly cookie
- Session persisted via `@supabase/ssr` cookie handler
- User redirected to `/home`

---

## 4. Session Management

### Cookie Strategy

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Token Refresh

- Access token: 1 hour lifetime
- Refresh token: 30 days (auto-rotated)
- `@supabase/ssr` auto-refreshes on every server request
- Client-side: Supabase JS SDK handles background refresh

### Session Validation on Protected Routes

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/(app)')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
}
```

---

## 5. Authorization Model

### Role Definitions

| Role | Description | Set By |
|------|-------------|--------|
| `user` | Default authenticated user | Auto (trigger) |
| `admin` | Full platform access | Manually in DB |

### Permission Matrix

| Action | Unauthenticated | User | Admin |
|--------|----------------|------|-------|
| View login page | ✓ | ✓ | ✓ |
| View item feed | ✗ | ✓ | ✓ |
| Create item report | ✗ | ✓ | ✓ |
| Edit own report | ✗ | ✓ | ✓ |
| Delete own report | ✗ | ✓ | ✓ |
| Delete any report | ✗ | ✗ | ✓ |
| Start conversation | ✗ | ✓ | ✓ |
| View own chats | ✗ | ✓ | ✓ |
| View all chats | ✗ | ✗ | ✓ |
| Mark item received | ✗ | Own items | ✓ |
| View admin dashboard | ✗ | ✗ | ✓ |
| Ban users | ✗ | ✗ | ✓ |
| View analytics | ✗ | ✗ | ✓ |

---

## 6. Ban Enforcement

### On Login

```typescript
// In /auth/callback route handler
const { data: profile } = await supabase
  .from('users')
  .select('is_banned, ban_reason')
  .eq('id', user.id)
  .single()

if (profile?.is_banned) {
  await supabase.auth.signOut()
  redirect(`/login?error=banned&reason=${encodeURIComponent(profile.ban_reason || '')}`)
}
```

### In Middleware (ongoing protection)

- Middleware checks `is_banned` on every protected request
- Banned user is signed out and redirected to login with error

### RLS Layer

```sql
-- Example: banned users cannot insert items
CREATE POLICY "items_insert_not_banned" ON public.items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );
```

---

## 7. Error States on Login Page

| URL Param | Error Displayed |
|-----------|----------------|
| `?error=domain_restricted` | "Only @ds.study.iitm.ac.in emails are allowed." |
| `?error=banned` | "Your account has been suspended. Contact support." |
| `?error=oauth_error` | "Sign-in failed. Please try again." |

---

## 8. Sign Out Flow

```typescript
// Called from profile menu or Settings
await supabase.auth.signOut()
// Clears session cookie
// Redirects to /login
router.push('/login')
```

---

## 9. Setting Up Admin

The first admin must be set manually in the Supabase dashboard or via migration:

```sql
-- Set admin role for a specific user
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@ds.study.iitm.ac.in';
```

This should be done immediately after the initial deployment.

---

## 10. Security Considerations

- **No password storage** — OAuth only; no credential management needed
- **Domain check is double-enforced** — both application layer and DB trigger
- **httpOnly cookies** — session tokens not accessible to JavaScript
- **PKCE flow** — Supabase uses PKCE for OAuth, preventing code interception
- **Short-lived access tokens** — 1 hour, refresh handled automatically
- **Session invalidation** — Admin can force sign-out by deleting from `auth.sessions`
- **Rate limiting on auth** — Supabase enforces rate limits on auth endpoints natively
