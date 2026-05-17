# DATABASE_SCHEMA.md — Database Schema
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0
**Database:** PostgreSQL (via Supabase)

---

## 1. Schema Overview

```
auth.users               ← Supabase managed
  └── public.users       ← Extended user profile
       ├── public.items
       │    └── public.item_images
       ├── public.conversations
       │    └── public.messages
       ├── public.flags
       └── public.banned_emails
```

---

## 2. Enums

```sql
-- Item report type
CREATE TYPE item_type AS ENUM ('lost', 'found');

-- Item lifecycle status
CREATE TYPE item_status AS ENUM (
  'lost',           -- Active lost item report
  'found',          -- Active found item report
  'claim_pending',  -- Owner/finder connected, verification in progress
  'verified',       -- Claim verified by both parties
  'completed',      -- Item successfully returned
  'closed'          -- Admin closed or user cancelled
);

-- Item categories
CREATE TYPE item_category AS ENUM (
  'electronics',
  'id_documents',
  'keys',
  'wallet_bag',
  'clothing',
  'jewellery',
  'sports_equipment',
  'books_stationery',
  'other'
);

-- User roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Message status
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Flag reasons
CREATE TYPE flag_reason AS ENUM ('spam', 'inappropriate', 'fake', 'other');
```

---

## 3. Tables

### 3.1 `public.users`

Extended user profile. Created automatically via trigger on `auth.users` insert.

```sql
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT,
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'user',
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  banned_by       UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_banned ON public.users(is_banned);

-- Updated_at trigger
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (name, avatar only)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "admins_select_all_users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update any user (ban, role change)
CREATE POLICY "admins_update_all_users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 3.2 `public.items`

Core table for lost and found item reports.

```sql
CREATE TABLE public.items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            item_type NOT NULL,
  status          item_status NOT NULL,
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  description     TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  category        item_category NOT NULL,
  location        TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 200),
  date_occurred   DATE NOT NULL,
  is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_count      INTEGER NOT NULL DEFAULT 0,
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT date_not_future CHECK (date_occurred <= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_type ON public.items(type);
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_items_date_occurred ON public.items(date_occurred DESC);
CREATE INDEX idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX idx_items_is_flagged ON public.items(is_flagged);

-- Full-text search index
ALTER TABLE public.items ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', location), 'C')
  ) STORED;

CREATE INDEX idx_items_search ON public.items USING GIN(search_vector);

-- Updated_at trigger
CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies:**
```sql
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view non-flagged items
CREATE POLICY "items_select_all_authenticated" ON public.items
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_flagged = FALSE);

-- Owners can view their own items (including flagged)
CREATE POLICY "items_select_own" ON public.items
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert items
CREATE POLICY "items_insert_authenticated" ON public.items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Owners can update their own items
CREATE POLICY "items_update_own" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

-- Owners can delete their own items
CREATE POLICY "items_delete_own" ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "items_admin_all" ON public.items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 3.3 `public.item_images`

Image metadata for item photos.

```sql
CREATE TABLE public.item_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,    -- path in Supabase Storage
  public_url      TEXT NOT NULL,    -- CDN URL
  file_name       TEXT NOT NULL,
  file_size       INTEGER NOT NULL, -- bytes
  mime_type       TEXT NOT NULL,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_item_images_item_id ON public.item_images(item_id);
CREATE INDEX idx_item_images_display_order ON public.item_images(item_id, display_order);
```

**RLS Policies:**
```sql
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_images_select_all" ON public.item_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "item_images_insert_own" ON public.item_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_images_delete_own" ON public.item_images
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "item_images_admin_all" ON public.item_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 3.4 `public.conversations`

Links two users (owner + finder) for a specific item.

```sql
CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  finder_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,  -- locked after COMPLETED
  locked_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one conversation per item
  CONSTRAINT unique_conversation_per_item UNIQUE (item_id),
  -- Owner and finder must be different people
  CONSTRAINT owner_finder_different CHECK (owner_id != finder_id)
);

-- Indexes
CREATE INDEX idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX idx_conversations_finder_id ON public.conversations(finder_id);

-- For "my conversations" query
CREATE INDEX idx_conversations_participants ON public.conversations(owner_id, finder_id);
```

**RLS Policies:**
```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Only participants can view conversations
CREATE POLICY "conversations_select_participants" ON public.conversations
  FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() = finder_id
  );

-- Authenticated users can create conversations
CREATE POLICY "conversations_insert_authenticated" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.uid() = owner_id OR auth.uid() = finder_id)
  );

-- Only participants can update (e.g., locking)
CREATE POLICY "conversations_update_participants" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = owner_id OR auth.uid() = finder_id
  );

-- Admins can view all
CREATE POLICY "conversations_admin_all" ON public.conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 3.5 `public.messages`

Individual messages within a conversation.

```sql
CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  status          message_status NOT NULL DEFAULT 'sent',
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,  -- system messages (status changes)
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
```

**RLS Policies:**
```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants can read messages in their conversations
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.owner_id = auth.uid() OR c.finder_id = auth.uid())
    )
  );

-- Participants can send messages (only if conversation not locked)
CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.owner_id = auth.uid() OR c.finder_id = auth.uid())
      AND c.is_locked = FALSE
    )
  );

-- Admins can view all messages
CREATE POLICY "messages_admin_select" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 3.6 `public.flags`

User-submitted abuse/spam reports.

```sql
CREATE TABLE public.flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES public.items(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  reason          flag_reason NOT NULL,
  details         TEXT,
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by     UUID REFERENCES public.users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Must flag either an item or a message, not both
  CONSTRAINT flag_target_check CHECK (
    (item_id IS NOT NULL AND message_id IS NULL) OR
    (item_id IS NULL AND message_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_flags_item_id ON public.flags(item_id);
CREATE INDEX idx_flags_message_id ON public.flags(message_id);
CREATE INDEX idx_flags_is_resolved ON public.flags(is_resolved);
```

---

### 3.7 `public.banned_emails`

Email addresses permanently blocked from registering.

```sql
CREATE TABLE public.banned_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  reason          TEXT,
  banned_by       UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banned_emails_email ON public.banned_emails(email);
```

---

## 4. Database Functions & Triggers

### 4.1 `update_updated_at_column()`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 `handle_new_user()` — Auto-create profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  is_email_banned BOOLEAN;
BEGIN
  user_email := NEW.email;

  -- Check if email is banned
  SELECT EXISTS(
    SELECT 1 FROM public.banned_emails WHERE email = user_email
  ) INTO is_email_banned;

  IF is_email_banned THEN
    -- Delete auth user to prevent login
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- Validate email domain
  IF NOT user_email LIKE '%@ds.study.iitm.ac.in' THEN
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- Create user profile
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    user_email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.3 `increment_flag_count()` — Update item flag count

```sql
CREATE OR REPLACE FUNCTION increment_item_flag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_id IS NOT NULL THEN
    UPDATE public.items
    SET flag_count = flag_count + 1,
        is_flagged = CASE WHEN flag_count + 1 >= 3 THEN TRUE ELSE is_flagged END
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_flag_created
  AFTER INSERT ON public.flags
  FOR EACH ROW EXECUTE FUNCTION increment_item_flag_count();
```

---

## 5. Migrations Strategy

All schema changes managed via Supabase migrations:

```
supabase/
  migrations/
    0001_initial_schema.sql       -- Enums, functions
    0002_users_table.sql          -- Users table + RLS
    0003_items_table.sql          -- Items + images + RLS
    0004_conversations_table.sql  -- Conversations + messages + RLS
    0005_flags_table.sql          -- Flags + banned_emails
    0006_search_indexes.sql       -- FTS indexes
    0007_triggers.sql             -- All triggers
    0008_seed_admin.sql           -- Seed initial admin user
```

Run migrations:
```bash
supabase db push         # push to linked project
supabase db reset        # reset local dev DB
supabase migration new   # create new migration file
```

---

## 6. Performance Considerations

- All foreign keys indexed
- FTS index on `items.search_vector` for search performance
- `conversations` query uses composite index `(owner_id, finder_id)`
- `messages` paginated with cursor-based pagination (by `created_at`)
- `items` browsing uses `created_at DESC` index with keyset pagination
- Avoid `COUNT(*)` on large tables; use approximate counts via `pg_stat_user_tables`
