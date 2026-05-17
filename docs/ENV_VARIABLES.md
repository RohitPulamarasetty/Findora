# ENV_VARIABLES.md — Environment Variables Reference
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## Overview

Findora uses environment variables for all secrets and environment-specific configuration. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser bundle. All others are server-side only.

**⚠️ Never commit `.env.local` to version control.**

---

## `.env.example` — Full Template

Copy this to `.env.local` and fill in your values:

```env
# =============================================================
# SUPABASE — Required
# =============================================================

# Your Supabase project URL
# Found in: Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase anonymous/public key (safe for client-side)
# Found in: Supabase Dashboard → Settings → API → Project API Keys → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (SERVER-SIDE ONLY — NEVER expose to browser)
# Found in: Supabase Dashboard → Settings → API → Project API Keys → service_role
# Used for: admin operations that bypass RLS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================
# APP CONFIGURATION — Required
# =============================================================

# Full URL of the application (no trailing slash)
# Development: http://localhost:3000
# Production: https://findora.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node environment
# Values: development | production | test
NODE_ENV=development

# =============================================================
# OPTIONAL — Development/Debugging
# =============================================================

# Enable Supabase query logging in development
# Values: true | false (default: false)
NEXT_PUBLIC_SUPABASE_DEBUG=false
```

---

## Variable Details

### `NEXT_PUBLIC_SUPABASE_URL`

| Property | Value |
|----------|-------|
| Required | ✅ Yes |
| Exposed to browser | ✅ Yes |
| Example | `https://abcdefgh.supabase.co` |
| Where to find | Supabase Dashboard → Settings → API → Project URL |
| Notes | Same for all environments (different Supabase projects per env) |

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| Property | Value |
|----------|-------|
| Required | ✅ Yes |
| Exposed to browser | ✅ Yes |
| Format | JWT string (long) |
| Where to find | Supabase Dashboard → Settings → API → `anon public` key |
| Notes | Safe to expose — RLS enforces authorization. Rotate if compromised. |

---

### `SUPABASE_SERVICE_ROLE_KEY`

| Property | Value |
|----------|-------|
| Required | ✅ Yes |
| Exposed to browser | ❌ **NEVER** |
| Format | JWT string (long) |
| Where to find | Supabase Dashboard → Settings → API → `service_role` key |
| Notes | **Bypasses all RLS.** Only use in server-side admin API routes. If compromised, rotate immediately in Supabase dashboard. |
| Cloudflare | Set as **Encrypted** environment variable |

---

### `NEXT_PUBLIC_APP_URL`

| Property | Value |
|----------|-------|
| Required | ✅ Yes |
| Exposed to browser | ✅ Yes |
| Development | `http://localhost:3000` |
| Staging | `https://staging.findora.app` |
| Production | `https://findora.app` |
| Usage | Used to construct absolute URLs (og:url, OAuth redirects) |

---

### `NODE_ENV`

| Property | Value |
|----------|-------|
| Required | Auto-set by Next.js |
| Values | `development`, `production`, `test` |
| Notes | Next.js sets this automatically based on `npm run dev` vs `npm run build`. Do not set manually. |

---

## Environment-Specific Values

### Local Development

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev anon key>
SUPABASE_SERVICE_ROLE_KEY=<dev service role key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key>
NEXT_PUBLIC_APP_URL=https://staging.findora.app
```

### Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production anon key>
SUPABASE_SERVICE_ROLE_KEY=<production service role key — encrypted>
NEXT_PUBLIC_APP_URL=https://findora.app
```

---

## Cloudflare Pages Configuration

In Cloudflare Pages → Settings → Environment Variables:

| Variable | Environment | Encrypted |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **Yes** |
| `NEXT_PUBLIC_APP_URL` | Production | No |

For staging, add the same variables under the **Staging** environment with staging values.

---

## GitHub Actions Secrets

For CI/CD pipeline, add to GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for build) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (for build) |

Note: `SUPABASE_SERVICE_ROLE_KEY` is not needed in CI — it's only used at runtime via Cloudflare environment variables.

---

## Supabase OAuth Redirect URIs

Configure in Supabase Dashboard → Authentication → URL Configuration:

```
# Site URL
https://findora.app

# Redirect URLs (whitelist)
https://findora.app/auth/callback
https://staging.findora.app/auth/callback
http://localhost:3000/auth/callback
```

Also configure in Google Cloud Console → OAuth 2.0 → Authorized redirect URIs:
```
https://your-project.supabase.co/auth/v1/callback
```

---

## Security Notes

1. **`SUPABASE_SERVICE_ROLE_KEY` is the most sensitive variable.** It bypasses all database security. If leaked, an attacker can read/write all data.
2. Rotate keys immediately if compromised via Supabase Dashboard → Settings → API → Reveal → Rotate.
3. The `.env.local` file is in `.gitignore` by default in Next.js. Verify this is present.
4. In production, variables are set via Cloudflare environment variables — never via files.
5. The `NEXT_PUBLIC_` prefix means the variable is embedded in the client JavaScript bundle at build time. Only add this prefix to variables that are safe to be public.
