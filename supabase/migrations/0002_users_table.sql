-- 0002_users_table.sql
-- Public users profile table (mirrors auth.users)

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null,
  avatar_url   text,
  role         public.user_role not null default 'student',
  is_banned    boolean not null default false,
  items_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
create policy "Users can view any profile"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any user (for banning)
create policy "Admins can update any user"
  on public.users for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );
