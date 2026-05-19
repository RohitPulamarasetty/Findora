# SECURITY.md — Security Architecture
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Security Model Overview

Findora's security is implemented in **layered defense**, with controls at every level:

```
Layer 1: Cloudflare Edge (WAF, DDoS, Rate Limiting)
     ↓
Layer 2: Next.js Middleware (Route auth, session validation)
     ↓
Layer 3: API Route Validation (Zod schemas, auth checks)
     ↓
Layer 4: Supabase RLS (Database-level authorization)
     ↓
Layer 5: Application Logic (Business rule enforcement)
```

---

## 2. Cloudflare Edge Security

### 2.1 WAF Rules

Configure in Cloudflare dashboard → Security → WAF:

| Rule | Action |
|------|--------|
| OWASP Core Ruleset | Block |
| SQL injection patterns | Block |
| XSS patterns | Block |
| Known bad bots | Block |
| Tor exit nodes | Challenge (CAPTCHA) |

### 2.2 Rate Limiting Rules

```
# Global API rate limit
Path: /api/*
Limit: 100 requests / 1 minute / IP
Action: Block (429)

# Auth endpoint protection
Path: /auth/*
Limit: 10 requests / 5 minutes / IP
Action: Block (429)

# Item creation protection
Path: /api/items (POST)
Limit: 3 requests / 1 hour / IP
Action: Block (429)

# Message sending protection
Path: /api/conversations/*/messages (POST)
Limit: 30 requests / 1 minute / IP
Action: Block (429)
```

### 2.3 Additional Cloudflare Settings

- **SSL/TLS**: Full (strict) mode
- **HSTS**: Enabled with 1-year max-age
- **Bot Fight Mode**: Enabled
- **Security Level**: Medium
- **Browser Integrity Check**: Enabled
- **Hotlink Protection**: Enabled (protect image CDN URLs)

---

## 3. Authentication Security

### 3.1 OAuth Security

- PKCE (Proof Key for Code Exchange) — prevents authorization code interception
- State parameter validation — prevents CSRF on OAuth callback
- No password storage — OAuth only, no credential attack surface
- Google OAuth only — reduces attack surface vs. password auth

### 3.2 Session Security

- Sessions stored in **httpOnly, Secure, SameSite=Lax** cookies
- Not accessible to JavaScript (XSS protection)
- Access token: 1-hour expiry
- Refresh token: 30-day expiry with rotation
- Session invalidation: admin can force sign-out via Supabase dashboard

### 3.3 Domain Restriction (Two-Layer)

**Layer 1 — Application:**
```typescript
if (!user.email.endsWith('@ds.study.iitm.ac.in')) {
  await supabase.auth.signOut()
  redirect('/login?error=domain_restricted')
}
```

**Layer 2 — Database Trigger (cannot be bypassed):**
```sql
IF NOT user_email LIKE '%@ds.study.iitm.ac.in' THEN
  DELETE FROM auth.users WHERE id = NEW.id;
  RETURN NULL;
END IF;
```

---

## 4. Row Level Security (RLS)

All tables have RLS enabled. No table allows anonymous access.

### Core RLS Principles

1. **Default deny** — No access without explicit policy
2. **Own data** — Users can only read/modify their own records by default
3. **Participant access** — Conversations/messages accessible only to participants
4. **Admin override** — Admin role can access all data via explicit policies
5. **Ban check** — Banned users are blocked from write operations

### RLS Verification

```sql
-- Test that RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should show rowsecurity = true
```

### Service Role Usage

The Supabase `service_role` key bypasses RLS. Rules for its use:
- **Never exposed to the browser** — only used server-side in admin API routes
- Used only in: admin dashboard operations, DB triggers, server actions
- All client-side code uses `anon` key only

---

## 5. Input Validation

### API Route Validation (Zod)

```typescript
// Example: item creation schema
const createItemSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum([...itemCategories]),
  location: z.string().min(2).max(200),
  date_occurred: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    date => new Date(date) <= new Date(),
    'Date cannot be in the future'
  ),
})

// Applied in every API route handler:
const parsed = createItemSchema.safeParse(req.body)
if (!parsed.success) {
  return Response.json({ error: { code: 'VALIDATION_ERROR', details: parsed.error } }, { status: 422 })
}
```

### Profanity Filtering

```typescript
import { filter } from 'leo-profanity'

// Applied on: item titles, descriptions, message content
const isSafe = (text: string): boolean => !filter.check(text)

// In API route:
if (!isSafe(body.title) || !isSafe(body.description)) {
  return Response.json({ error: { code: 'CONTENT_VIOLATION' } }, { status: 422 })
}
```

---

## 6. File Upload Security

### Validation Pipeline

```typescript
// In /api/items/:id/images route handler

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILES = 5

// 1. Check file count
if (files.length > MAX_FILES) {
  return error('MAX_5_IMAGES')
}

for (const file of files) {
  // 2. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return error('FILE_TOO_LARGE')
  }

  // 3. Check MIME type (from Content-Type header)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return error('INVALID_FILE_TYPE')
  }

  // 4. Verify magic bytes (actual file content, not just extension)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (!isValidImageMagicBytes(bytes)) {
    return error('INVALID_FILE_CONTENT')
  }
}
```

### Magic Byte Validation

```typescript
function isValidImageMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true
  return false
}
```

### Storage Bucket Policies

```sql
-- Supabase Storage: item-images bucket
-- Allow authenticated uploads only
CREATE POLICY "allow_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- Allow public reads
CREATE POLICY "allow_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Allow owner or admin to delete
CREATE POLICY "allow_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 7. Duplicate Submission Prevention

```typescript
// Rate limit via Cloudflare (3 items/hour/IP)
// + Application-level user rate limit

// Check recent submissions
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const { count } = await supabase
  .from('items')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', oneHourAgo)

if (count && count >= 3) {
  return error('RATE_LIMITED', 'Maximum 3 reports per hour')
}
```

---

## 8. Messaging Security

- RLS prevents any user from reading messages they're not party to
- Conversation creation validates that initiator is a legitimate party
- Lock enforcement: RLS blocks INSERT on locked conversations
- Message content validated (length, profanity) before DB insert
- Rate limit: 30 messages per minute per user

---

## 9. Admin Security

- Admin role set **manually in database only** — no UI to self-promote
- Admin API routes use Supabase `service_role` key (server-side only)
- All admin actions logged to `admin_audit_log` table (future enhancement)
- Admin login uses same OAuth + domain restriction as regular users
- No separate admin credentials — reduces attack surface

---

## 10. Security Headers

Configured in `next.config.js`:

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
    ].join('; ')
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

## 11. Environment Variable Security

- All secrets in `.env.local` (never committed)
- Production secrets in Cloudflare Pages environment variables
- Only `NEXT_PUBLIC_*` vars exposed to client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never in client bundle
- Regular rotation of Supabase JWT secret recommended

---

## 12. Security Checklist (Pre-Launch)

- [ ] RLS enabled and tested on all tables
- [ ] Admin role set correctly in production DB
- [ ] Cloudflare WAF rules configured
- [ ] Rate limiting rules active
- [ ] Security headers deployed
- [ ] File upload validation tested with malicious files
- [ ] Domain restriction tested with non-IITM email
- [ ] Ban enforcement tested
- [ ] Session expiry tested
- [ ] All environment variables in production (no `.env.local` references)
- [ ] Supabase service role key is NOT in client bundle
- [ ] CSP headers tested against browser console
- [ ] HTTPS enforced (no HTTP redirect)
- [ ] HSTS preload submitted
