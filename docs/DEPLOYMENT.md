# DEPLOYMENT.md — Deployment Guide
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Deployment Architecture

```
GitHub Repository
    │
    ├── main branch ──────────────────► Cloudflare Pages (Production)
    │                                      findora.app
    │
    ├── develop branch ───────────────► Cloudflare Pages (Staging)
    │                                      staging.findora.app
    │
    └── feature/* branches ───────────► Cloudflare Pages (Preview URLs)
                                           {branch}.findora.pages.dev
```

**Supabase:** Single project for production. Separate project for staging.

---

## 2. Prerequisites

### Accounts Required

- [Cloudflare](https://cloudflare.com) — Pages hosting + DNS + WAF
- [Supabase](https://supabase.com) — Database, Auth, Storage, Realtime
- [GitHub](https://github.com) — Source control + CI/CD

### Local Tools

```bash
node --version    # >= 18.x
npm --version     # >= 9.x
git --version     # any recent

# Install Supabase CLI
npm install -g supabase

# Install Wrangler (Cloudflare CLI) — optional
npm install -g wrangler
```

---

## 3. Initial Setup

### 3.1 Clone and Install

```bash
git clone https://github.com/your-org/findora.git
cd findora
npm install
```

### 3.2 Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see `ENV_VARIABLES.md`).

### 3.3 Supabase Setup

```bash
# Login to Supabase CLI
supabase login

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Set admin user (after first login)
# Run in Supabase SQL editor:
# UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

### 3.4 Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
6. Copy Client ID and Client Secret
7. In Supabase Dashboard → Auth → Providers → Google
8. Paste Client ID and Client Secret
9. Enable Google provider

### 3.5 Configure Supabase Storage

```bash
# In Supabase Dashboard → Storage
# Create bucket: item-images
# Visibility: Public
```

OR via SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);
```

---

## 4. Local Development

```bash
# Start development server
npm run dev
# App at http://localhost:3000

# Start Supabase local stack (optional — use cloud project instead)
supabase start
# Supabase Studio at http://localhost:54323

# Generate TypeScript types from DB schema
npm run supabase:types

# Run linter
npm run lint

# Run type check
npm run typecheck
```

### Local Supabase Environment Variables

When using local Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

---

## 5. Cloudflare Pages Deployment

### 5.1 Initial Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click **"Create a project"**
3. Connect to GitHub repository
4. Configure build:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
5. Click **"Save and Deploy"**

### 5.2 Production Environment Variables

In Cloudflare Pages → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL          = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY         = eyJ... (service role key) [encrypted]
NEXT_PUBLIC_APP_URL               = https://findora.app
NODE_ENV                          = production
```

**Important:** Mark `SUPABASE_SERVICE_ROLE_KEY` as **Encrypted** so it's not visible in the dashboard.

### 5.3 Custom Domain

1. In Cloudflare Pages → Custom domains
2. Add `findora.app`
3. Cloudflare auto-configures DNS (if domain is on Cloudflare)
4. SSL/TLS configured automatically

### 5.4 Staging Environment

1. Create second Cloudflare Pages project: `findora-staging`
2. Connect same GitHub repo, branch: `develop`
3. Add environment variables pointing to **staging Supabase project**
4. Add custom domain: `staging.findora.app`

---

## 6. Next.js for Cloudflare Pages

Next.js on Cloudflare Pages requires the **`@cloudflare/next-on-pages`** adapter.

```bash
npm install -D @cloudflare/next-on-pages
```

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages
  output: 'edge',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,  // defined in next.config.js
    },
  ],
}

module.exports = nextConfig
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "supabase:types": "supabase gen types typescript --linked > src/types/database.ts",
    "build:cf": "npx @cloudflare/next-on-pages"
  }
}
```

---

## 7. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://findora.app

  # Cloudflare Pages handles actual deployment
  # triggered automatically on push to main/develop
```

---

## 8. Database Migrations in Production

```bash
# View migration status
supabase migration list

# Create new migration
supabase migration new add_feature_x

# Push migrations to production
supabase db push --linked

# Check database status
supabase db status
```

**Important:** Never run `supabase db reset` in production.

---

## 9. Monitoring & Observability

### Supabase Dashboard

- Monitor query performance in Supabase → Database → Query Performance
- View auth events in Supabase → Authentication → Logs
- Storage usage in Supabase → Storage

### Cloudflare Analytics

- Request/response metrics in Cloudflare → Analytics
- WAF events in Cloudflare → Security → Events
- Rate limiting logs in Cloudflare → Security → Rate Limiting

### Error Tracking (Recommended)

Add [Sentry](https://sentry.io) for production error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 10. Rollback Procedure

### Cloudflare Pages Rollback

1. Go to Cloudflare Pages → Deployments
2. Find the last stable deployment
3. Click the three dots → **"Rollback to this deployment"**
4. Deployment is instant

### Database Rollback

```bash
# Create rollback migration
supabase migration new rollback_v1_2

# Write reverse SQL in the new migration file
# Then push
supabase db push --linked
```

---

## 11. Production Launch Checklist

**Code**
- [ ] All tests passing
- [ ] Type check clean
- [ ] Lint clean
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets

**Database**
- [ ] All migrations applied
- [ ] RLS enabled on all tables
- [ ] Admin user set
- [ ] Indexes verified

**Auth**
- [ ] Google OAuth configured with production redirect URI
- [ ] Domain restriction tested
- [ ] Session management tested

**Infrastructure**
- [ ] Production env vars set in Cloudflare
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] WAF rules configured
- [ ] Rate limiting rules active

**Testing**
- [ ] Login flow tested in production
- [ ] Item creation + image upload tested
- [ ] Real-time messaging tested
- [ ] Admin dashboard tested
- [ ] Mobile UX tested on real device
