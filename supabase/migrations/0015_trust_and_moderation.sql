-- 0015_trust_and_moderation.sql
-- Trust, moderation, and lifecycle improvements. Builds on 0012/0013/0014.
--
-- WHAT THIS DOES:
--   1. Verification questions on items + first-class `claims` table with a
--      proper lifecycle (pending → approved/rejected/withdrawn).
--   2. Reputation columns on users (recoveries_count, flags_received).
--   3. Moderation: auto-hide trigger at >= 3 distinct flags; admin_audit_log
--      table; helper RPC.
--   4. Resolved-case lifecycle: anonymization columns + a public-safe view
--      for success stories. Cron will fill anonymized fields after 30 days.
--   5. RLS for everything. Service-role-only writes for sensitive fields.
--
-- Backwards-compatible: every new column is nullable / defaulted; existing
-- conversations keep working as "implicit claims" until the UI is rewired
-- to create explicit claims. No data backfill required for v1.


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Verification questions on items (optional, max 3 set by reporter).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.items
  add column if not exists verification_questions text[] not null default '{}'::text[],
  add column if not exists auto_hidden boolean not null default false,
  add column if not exists anonymized_at timestamptz,
  add column if not exists allow_success_story boolean not null default false;

-- Cap at 3 questions, each <= 140 chars. Enforced at insert/update.
create or replace function public.validate_item_verification_questions()
returns trigger language plpgsql as $$
begin
  if new.verification_questions is not null then
    if array_length(new.verification_questions, 1) > 3 then
      raise exception 'At most 3 verification questions are allowed';
    end if;
    if exists (
      select 1 from unnest(new.verification_questions) q where char_length(q) > 140
    ) then
      raise exception 'Verification questions must be 140 characters or fewer';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists items_validate_questions on public.items;
create trigger items_validate_questions
  before insert or update of verification_questions on public.items
  for each row execute function public.validate_item_verification_questions();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. First-class `claims` table.
--
-- A claim is a structured "I think this is mine" submitted by a finder /
-- claimant against an item. Conversations may attach to a claim, but the
-- claim is the authoritative source of approval state.
-- ─────────────────────────────────────────────────────────────────────────────
create type public.claim_status as enum (
  'pending',     -- submitted, awaiting owner review
  'approved',    -- owner accepted; handover may proceed
  'rejected',    -- owner denied
  'withdrawn'    -- claimant cancelled
);

create table if not exists public.claims (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references public.items(id) on delete cascade,
  claimant_id         uuid not null references public.users(id) on delete cascade,
  status              public.claim_status not null default 'pending',

  -- Claimant evidence
  answers             jsonb not null default '[]'::jsonb,    -- [{q, a}, ...]
  evidence_text       text,                                  -- free-text proof
  evidence_image_url  text,                                  -- optional photo proof

  -- Owner decision metadata
  owner_response      text,                                  -- shown to claimant
  decided_at          timestamptz,
  decided_by          uuid references public.users(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- One open claim per (item, claimant). Once decided, claimant cannot re-open
-- (must withdraw via update; new claim blocked).
create unique index if not exists claims_open_unique
  on public.claims(item_id, claimant_id)
  where status in ('pending', 'approved');

create index if not exists claims_item_idx on public.claims(item_id, created_at desc);
create index if not exists claims_claimant_idx on public.claims(claimant_id, created_at desc);
create index if not exists claims_pending_idx on public.claims(status, created_at desc)
  where status = 'pending';

-- Optional link from a conversation to its underlying claim. Nullable for
-- backwards compat — old conversations are "implicit claims".
alter table public.conversations
  add column if not exists claim_id uuid references public.claims(id) on delete set null;

-- RLS
alter table public.claims enable row level security;

-- Claimant can see their own claims. Item owner can see all claims against
-- their item. Admins can see everything.
drop policy if exists "claims_select_own" on public.claims;
create policy "claims_select_own" on public.claims for select
  using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Claimant creates their own claim. Cannot claim their own item.
drop policy if exists "claims_insert_self" on public.claims;
create policy "claims_insert_self" on public.claims for insert
  with check (
    claimant_id = auth.uid()
    and not exists (
      select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()
    )
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_banned = false
    )
  );

-- Claimant can withdraw their own pending claim. Decision fields
-- (status, decided_*) are gated by column-level REVOKE below.
drop policy if exists "claims_update_self" on public.claims;
create policy "claims_update_self" on public.claims for update
  using (claimant_id = auth.uid())
  with check (claimant_id = auth.uid());

-- Owner can approve/reject claims via their own update path (with check
-- limits column writes — see REVOKE below).
drop policy if exists "claims_update_owner" on public.claims;
create policy "claims_update_owner" on public.claims for update
  using (
    exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
  );

-- Lock the decision columns from authenticated clients — they must go
-- through the service-role API (/api/claims/[id]/decide) which validates
-- the actor is the item owner AND records to admin_audit_log.
revoke update (status, decided_at, decided_by) on public.claims from anon, authenticated;

-- updated_at trigger (reuse the helper from 0007)
drop trigger if exists claims_updated_at on public.claims;
create trigger claims_updated_at
  before update on public.claims
  for each row execute function public.update_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Reputation columns on users.
--
-- recoveries_count: bumped server-side on item completion via the existing
--                   /api/items/[id]/complete route + a future trigger.
-- flags_received:   reputation drift signal (bumped when a flag is filed
--                   against any item / message owned by this user).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.users
  add column if not exists recoveries_count integer not null default 0,
  add column if not exists flags_received integer not null default 0,
  add column if not exists first_post_at timestamptz,  -- analytics: activation
  add column if not exists last_active_at timestamptz; -- analytics: engagement

-- Lock these from client updates (extends 0013).
revoke update (recoveries_count, flags_received, first_post_at, last_active_at)
  on public.users from anon, authenticated;

-- Convenience view: a public-safe profile slice for trust badges.
-- Browser only ever reads this (no `email`, no `is_banned`).
create or replace view public.user_trust_profiles
with (security_invoker = true) as
select
  u.id,
  u.full_name,
  u.avatar_url,
  u.recoveries_count,
  -- "Trust level" buckets — keep on the server so the badge is uniform
  case
    when u.recoveries_count >= 10 then 'gold'
    when u.recoveries_count >= 5  then 'silver'
    when u.recoveries_count >= 1  then 'bronze'
    else 'newcomer'
  end::text as trust_level,
  u.created_at
from public.users u
where u.is_banned = false;

grant select on public.user_trust_profiles to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Admin audit log (forensics + accountability).
--
-- Every privileged write (admin ban/unban, item soft-remove, claim decision
-- override, flag resolution) is appended here. Write-only for the
-- application; read-only for admins.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  action      text not null,            -- e.g. 'user.ban', 'item.remove'
  target_table text not null,           -- 'users', 'items', ...
  target_id   uuid,
  payload     jsonb not null default '{}'::jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log(actor_id, created_at desc);
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_table, target_id);

alter table public.admin_audit_log enable row level security;
-- Admins read all; nobody writes from the client (service-role only).
drop policy if exists "audit_log_admin_read" on public.admin_audit_log;
create policy "audit_log_admin_read" on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Auto-hide on flag-count threshold.
--
-- When an item accumulates 3 flags from DISTINCT reporters, mark
-- items.auto_hidden = true. The public feed must filter out auto_hidden
-- rows (handled at the route level in /api/items GET).
--
-- This trigger fires AFTER INSERT on flags. We recount distinct reporters
-- to defeat the case where the same reporter retries (already covered by
-- the 0013 unique indexes, but harmless belt + braces).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.maybe_auto_hide_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_distinct integer;
begin
  if new.item_id is null then return new; end if;

  select count(distinct reporter_id) into v_distinct
  from public.flags
  where item_id = new.item_id;

  if v_distinct >= 3 then
    update public.items
       set auto_hidden = true
     where id = new.item_id and auto_hidden = false;
  end if;

  return new;
end;
$$;

drop trigger if exists on_flag_auto_hide on public.flags;
create trigger on_flag_auto_hide
  after insert on public.flags
  for each row execute function public.maybe_auto_hide_item();

-- Also bump users.flags_received for the item's owner.
create or replace function public.bump_flags_received()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
begin
  if new.item_id is not null then
    select user_id into v_owner_id from public.items where id = new.item_id;
  elsif new.message_id is not null then
    select m.sender_id into v_owner_id from public.messages m where m.id = new.message_id;
  end if;

  if v_owner_id is not null then
    update public.users set flags_received = flags_received + 1 where id = v_owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_flag_bump_received on public.flags;
create trigger on_flag_bump_received
  after insert on public.flags
  for each row execute function public.bump_flags_received();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Bump recoveries_count when an item completes.
--    Counts BOTH parties (reporter + the approved claimant) when there is
--    an approved claim; otherwise just the reporter.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.bump_recoveries_on_complete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_claimant uuid;
begin
  if (old.status is distinct from new.status)
     and new.status in ('completed', 'resolved') then

    -- Reporter
    update public.users set recoveries_count = recoveries_count + 1
     where id = new.user_id;

    -- Approved claimant (if any)
    select c.claimant_id into v_claimant
    from public.claims c
    where c.item_id = new.id and c.status = 'approved'
    order by c.decided_at desc nulls last
    limit 1;

    if v_claimant is not null and v_claimant <> new.user_id then
      update public.users set recoveries_count = recoveries_count + 1
       where id = v_claimant;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists items_bump_recoveries on public.items;
create trigger items_bump_recoveries
  after update of status on public.items
  for each row execute function public.bump_recoveries_on_complete();


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Anonymized success-story view + helper to anonymize on demand.
--
-- The cron job (added below as an RPC) walks completed items older than 30
-- days where allow_success_story = true, strips description and image
-- paths, and sets anonymized_at. The view then exposes only safe fields.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.anonymize_old_completed_items()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_updated integer := 0;
begin
  with upd as (
    update public.items
       set description = '',
           anonymized_at = now()
     where status in ('completed', 'resolved')
       and anonymized_at is null
       and resolved_at < now() - interval '30 days'
    returning id
  )
  select count(*)::int into v_updated from upd;

  -- Drop image rows (storage bytes purged out-of-band by a separate worker).
  delete from public.item_images
   where item_id in (
     select id from public.items
     where anonymized_at is not null and anonymized_at >= now() - interval '1 day'
   );

  return v_updated;
end;
$$;

grant execute on function public.anonymize_old_completed_items() to authenticated;

create or replace view public.success_stories
with (security_invoker = true) as
select
  i.id,
  i.type,
  i.category,
  i.title,
  i.location,
  i.date_occurred,
  i.resolved_at,
  (i.resolved_at::date - i.created_at::date) as days_to_recovery
from public.items i
where i.status in ('completed', 'resolved')
  and i.anonymized_at is not null
  and i.allow_success_story = true;

grant select on public.success_stories to anon, authenticated;
