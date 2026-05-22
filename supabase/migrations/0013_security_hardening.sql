-- 0013_security_hardening.sql
-- Critical + high-severity security fixes from the production audit.
-- Idempotent where possible. Safe to re-apply.
--
-- WHAT THIS DOES (in priority order):
--   1. Lock sensitive columns on public.users (no client-side admin elevation).
--   2. Lock sensitive columns on public.conversations + tighten policy.
--   3. Block client-inserted system messages on public.messages.
--   4. Enforce banned-email check at the auth.users -> public.users trigger.
--   5. Add partial unique indexes on public.flags to kill the race condition.
--
-- IMPORTANT: after this migration, three application routes must use the
-- service-role client to write the now-locked columns:
--   * /api/admin/users/[id]/ban     -> writes users.is_banned
--   * /api/admin/users/[id]/unban   -> writes users.is_banned
--   * /api/items/[id]/complete      -> writes conversations.is_locked +
--                                       messages.is_system
-- The corresponding code patches ship alongside this file.


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. users: lock role, is_banned, items_count from client-side updates.
--    Column-level REVOKE is checked BEFORE RLS in Postgres, so this closes
--    the escalation hole even if a future policy is loosened by mistake.
-- ─────────────────────────────────────────────────────────────────────────────
revoke update (role, is_banned, items_count) on public.users from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. conversations: only service-role can flip is_locked, swap participants,
--    or change the linked item. Participants still update their unread
--    counters (used by /api/conversations/[id] PATCH).
-- ─────────────────────────────────────────────────────────────────────────────
revoke update (is_locked, item_id, owner_id, finder_id, created_at)
  on public.conversations from anon, authenticated;

-- Tighten the participants-update policy with a matching with-check so a
-- participant cannot pivot the row out from under themselves even at the
-- columns they CAN still touch.
drop policy if exists "Participants can update conversations" on public.conversations;
create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = owner_id or auth.uid() = finder_id)
  with check (auth.uid() = owner_id or auth.uid() = finder_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. messages: clients can never insert is_system = true. System messages
--    are only legitimate when emitted by the server's service-role client
--    (e.g. /api/items/[id]/complete announcing a recovered case).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and is_system = false
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.finder_id = auth.uid())
        and c.is_locked = false
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. banned_emails: enforce at trigger time. If the email is on the ban
--    list, refuse to mirror the auth.users row into public.users — the
--    transaction rolls back and Supabase reports a signup failure.
--    The app callback ALSO checks (defense in depth), but this protects
--    against future code paths and direct DB inserts.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.banned_emails
    where lower(email) = lower(new.email)
  ) then
    raise exception 'Email is banned from Findora'
      using errcode = 'P0001', hint = 'banned_email';
  end if;

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

-- Normalize any existing banned emails to lowercase so the lookup matches.
update public.banned_emails set email = lower(email) where email <> lower(email);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. flags: kill the SELECT-then-INSERT race in /api/flags. A single
--    reporter cannot flag the same item OR message twice.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists flags_reporter_item_uniq
  on public.flags(reporter_id, item_id)
  where item_id is not null;

create unique index if not exists flags_reporter_message_uniq
  on public.flags(reporter_id, message_id)
  where message_id is not null;
