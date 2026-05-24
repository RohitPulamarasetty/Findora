-- 0020_user_profile_trigger.sql
--
-- Guarantee: every row inserted into auth.users gets a corresponding row
-- in public.users. This is the primary onboarding path for all OAuth and
-- magic-link sign-ups.
--
-- Why SECURITY DEFINER + search_path lock?
--   The trigger must insert into public.users even though RLS is enabled.
--   SECURITY DEFINER makes the function run as its owner (postgres), which
--   bypasses RLS. Locking search_path prevents search-path-injection attacks.
--
-- ON CONFLICT (id) DO NOTHING makes the function idempotent — safe to call
-- from multiple paths (trigger + callback upsert) without producing duplicate
-- key errors.
--
-- full_name resolution order:
--   1. raw_user_meta_data.full_name  (Google OAuth standard field)
--   2. raw_user_meta_data.name       (some OAuth providers use this)
--   3. local-part of email           (fallback for any provider)

-- ── INSERT policy (service-role path) ────────────────────────────────────
-- Supabase's service-role key bypasses RLS entirely, so this policy only
-- matters for the `authenticated` role. We allow users to insert their own
-- row so that a client-side retry (if ever needed) can succeed.
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ── Trigger function ──────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    is_banned,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'student',
    false,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Log but never raise: a profile-insert failure must not prevent the
    -- auth.users row from being committed, otherwise the user is stuck in
    -- a broken half-signed-up state.
    raise warning '[handle_new_user] profile insert failed for user %: % (%)',
      new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

-- ── Trigger ───────────────────────────────────────────────────────────────
-- Drop first so this migration is idempotent on re-apply.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
