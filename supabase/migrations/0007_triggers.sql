-- 0007_triggers.sql
-- Database triggers

-- 1. Auto-create public.users profile on new auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Auto-update updated_at column
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger items_updated_at
  before update on public.items
  for each row execute function public.update_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

-- 3. Auto-update items.search_vector on insert/update
create or replace function public.update_item_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector = to_tsvector('english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.location, '') || ' ' ||
    coalesce(new.category::text, '')
  );
  return new;
end;
$$;

create trigger items_search_vector_update
  before insert or update of title, description, location, category
  on public.items
  for each row execute function public.update_item_search_vector();

-- 4. Increment flag_count on items when flagged
create or replace function public.increment_flag_count()
returns trigger
language plpgsql
as $$
begin
  if new.item_id is not null then
    update public.items
    set flag_count = flag_count + 1
    where id = new.item_id;
  end if;
  return new;
end;
$$;

create trigger on_flag_created
  after insert on public.flags
  for each row execute function public.increment_flag_count();

-- 5. Update conversation last_message_at and unread counts on new message
create or replace function public.handle_new_message()
returns trigger
language plpgsql
as $$
declare
  v_owner_id  uuid;
  v_finder_id uuid;
begin
  select owner_id, finder_id into v_owner_id, v_finder_id
  from public.conversations
  where id = new.conversation_id;

  -- Update last_message_at and increment unread for the other participant
  if new.sender_id = v_owner_id then
    update public.conversations
    set last_message_at = now(),
        unread_finder   = unread_finder + 1
    where id = new.conversation_id;
  elsif new.sender_id = v_finder_id then
    update public.conversations
    set last_message_at = now(),
        unread_owner    = unread_owner + 1
    where id = new.conversation_id;
  else
    -- System message — update timestamp only
    update public.conversations
    set last_message_at = now()
    where id = new.conversation_id;
  end if;

  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();
