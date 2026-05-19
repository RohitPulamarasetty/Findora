-- 0004_conversations_table.sql
-- Conversations and messages tables

create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  owner_id     uuid not null references public.users(id) on delete cascade,
  finder_id    uuid not null references public.users(id) on delete cascade,
  is_locked    boolean not null default false,
  unread_owner integer not null default 0,
  unread_finder integer not null default 0,
  last_message_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (item_id, owner_id, finder_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid references public.users(id) on delete set null,
  content         text not null,
  is_system       boolean not null default false,
  status          public.message_status not null default 'sent',
  created_at      timestamptz not null default now()
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversation policies
create policy "Participants can view conversations"
  on public.conversations for select
  using (auth.uid() = owner_id or auth.uid() = finder_id);

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (
    auth.uid() = finder_id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.is_banned = false
    )
  );

create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = owner_id or auth.uid() = finder_id);

create policy "Admins can view all conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

-- Message policies
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.finder_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.finder_id = auth.uid())
        and c.is_locked = false
    )
  );

create policy "Admins can view all messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );
