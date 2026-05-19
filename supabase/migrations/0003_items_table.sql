-- 0003_items_table.sql
-- Items and item_images tables

create table public.items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          public.item_type not null,
  status        public.item_status not null default 'active',
  category      public.item_category not null,
  title         text not null,
  description   text not null,
  location      text not null,
  date_occurred date not null,
  flag_count    integer not null default 0,
  search_vector tsvector,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.item_images (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  url        text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.items enable row level security;
alter table public.item_images enable row level security;

-- Items policies
create policy "Anyone can view active items"
  on public.items for select
  using (true);

create policy "Authenticated users can create items"
  on public.items for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.is_banned = false
    )
  );

create policy "Owners can update own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can update any item"
  on public.items for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

create policy "Owners can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

create policy "Admins can delete any item"
  on public.items for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );

-- Item images policies
create policy "Anyone can view item images"
  on public.item_images for select
  using (true);

create policy "Item owners can insert images"
  on public.item_images for insert
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );

create policy "Item owners can delete images"
  on public.item_images for delete
  using (
    exists (
      select 1 from public.items i
      where i.id = item_id
        and i.user_id = auth.uid()
    )
  );
