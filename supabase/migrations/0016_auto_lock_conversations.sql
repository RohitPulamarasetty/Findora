-- 0016_auto_lock_conversations.sql
-- Auto-lock all conversations for an item the moment its status flips off
-- 'active' — owner self-delete (-> 'removed'), admin removal (-> 'removed'),
-- recovery handover (-> 'completed'), and any future terminal moderation
-- state ('closed', 'resolved', 'expired'). One DB-level trigger covers
-- every mutation path so we cannot regress in routes/admin/cron flows.
--
-- The trigger is idempotent in two ways:
--   1. It only fires when the status column is updated AND the value
--      actually changed (WHEN OLD.status IS DISTINCT FROM NEW.status).
--   2. It only locks conversations that are still unlocked, and only
--      inserts the closure message for the rows that were just locked
--      (RETURNING clause from the UPDATE). Re-saving the same terminal
--      status, or running the trigger twice, is a no-op.
--
-- No hard deletes anywhere: history is preserved, only `is_locked` flips.

-- ────────────────────────────────────────────────────────────────────────
-- Function
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.lock_conversations_on_item_inactive()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_message text;
begin
  -- Pick the closure copy based on which terminal status we just entered.
  -- 'completed' is treated as the recovery/handover path; everything else
  -- (removed, closed, resolved, expired) is treated as an unavailability
  -- path. This matches the product wording for users.
  if new.status = 'completed' then
    v_message := 'This item has been marked as recovered. This conversation is now locked.';
  else
    v_message := 'This item is no longer available. This conversation has been locked.';
  end if;

  -- One round-trip: lock all unlocked conversations for the item, capture
  -- the rows we actually flipped, and insert one closure message per row.
  -- Because `RETURNING` only emits rows that the UPDATE touched, we never
  -- double-insert the closure message even if the trigger runs again.
  with locked as (
    update public.conversations
       set is_locked  = true,
           updated_at = now()
     where item_id    = new.id
       and is_locked  = false
    returning id, owner_id
  )
  insert into public.messages (conversation_id, sender_id, content, is_system)
  select
    locked.id,
    -- Closure message is authored by the item owner so it renders as a
    -- normal incoming bubble for the other participant and bumps unread
    -- via the existing handle_new_message trigger. We intentionally use
    -- NEW.user_id (the actor on the items row) rather than the
    -- conversation owner, because the conversation owner is always the
    -- item owner by construction (see 0004 unique constraint).
    new.user_id,
    v_message,
    false
  from locked;

  return new;
end;
$$;

comment on function public.lock_conversations_on_item_inactive() is
  'Locks all conversations attached to an item the instant its status moves '
  'off ''active'', and posts one closure message per newly-locked conversation. '
  'Idempotent by construction.';

-- ────────────────────────────────────────────────────────────────────────
-- Trigger
-- ────────────────────────────────────────────────────────────────────────
-- Fires only when the `status` column is part of the UPDATE statement
-- (PostgreSQL "UPDATE OF status" qualifier) AND the value actually changed
-- AND the new value is any non-active terminal state. The WHEN clause is
-- evaluated server-side before the function is invoked, so no-op updates
-- don't pay the function-call cost.
drop trigger if exists on_item_status_change_lock_convos on public.items;

create trigger on_item_status_change_lock_convos
  after update of status on public.items
  for each row
  when (
    old.status is distinct from new.status
    and new.status <> 'active'
  )
  execute function public.lock_conversations_on_item_inactive();

-- ────────────────────────────────────────────────────────────────────────
-- Backfill
-- ────────────────────────────────────────────────────────────────────────
-- Catch any historical rows whose item is already inactive but whose
-- conversations are still unlocked. Single UPDATE; no closure message is
-- inserted retroactively (we don't want to spam users for historical
-- changes that they've already moved on from).
update public.conversations c
   set is_locked  = true,
       updated_at = now()
  from public.items i
 where i.id = c.item_id
   and i.status <> 'active'
   and c.is_locked = false;
