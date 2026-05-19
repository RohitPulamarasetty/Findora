-- 0005_flags_table.sql
-- Flags and banned_emails tables

create table public.flags (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  item_id     uuid references public.items(id) on delete cascade,
  message_id  uuid references public.messages(id) on delete cascade,
  reason      public.flag_reason not null,
  notes       text,
  is_resolved boolean not null default false,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  check (item_id is not null or message_id is not null)
);

create table public.banned_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  reason     text,
  banned_by  uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.flags enable row level security;
alter table public.banned_emails enable row level security;

-- Flags policies
create policy "Authenticated users can create flags"
  on public.flags for insert
  with check (auth.uid() = reporter_id);

create policy "Reporters can view own flags"
  on public.flags for select
  using (auth.uid() = reporter_id);

create policy "Admins can view all flags"
  on public.flags for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

create policy "Admins can update flags"
  on public.flags for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

-- Banned emails policies
create policy "Admins can manage banned emails"
  on public.banned_emails for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );
