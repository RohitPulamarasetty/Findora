-- 0018_trigger_order_explicit.sql
--
-- Phase 1 / B5 — make trigger ordering on items.status explicit.
--
-- Two AFTER UPDATE OF status triggers currently exist on public.items:
--
--   1. items_bump_recoveries           (0015) — increments users.recoveries_count
--                                                 when an item completes/resolves.
--   2. on_item_status_change_lock_convos (0016) — locks all conversations and
--                                                  posts a closure message when
--                                                  status leaves 'active'.
--
-- PostgreSQL fires same-timing triggers in alphabetical name order, so today
-- the de facto order is (1) then (2) — which is what we want: count the
-- recovery *before* the conversation flips to a terminal locked state. The
-- ordering, however, is implicit; renaming either trigger in a future
-- migration would silently flip the order and change observable behavior
-- (e.g. closure messages firing before the counter increments, which could
-- matter if a future trigger reads recoveries_count).
--
-- This migration rebinds both triggers under a deterministic numeric prefix
-- so the intended order is encoded in the trigger names themselves:
--
--   t10_items_bump_recoveries           — runs first
--   t20_lock_convos_on_item_inactive    — runs second
--
-- ── Safety ───────────────────────────────────────────────────────────────────
--   * DROP TRIGGER IF EXISTS is a no-op when the trigger isn't present, so
--     applying this against a fresh DB, a partially-migrated DB, or the
--     existing production DB is safe.
--   * The trigger *functions* (bump_recoveries_on_complete and
--     lock_conversations_on_item_inactive) are not touched — we only rebind
--     them under new trigger names. Behavior is preserved exactly.
--   * Both new triggers use the same WHEN/FOR EACH ROW semantics as before.

-- ────────────────────────────────────────────────────────────────────────────
-- Drop the implicitly-ordered originals.
-- ────────────────────────────────────────────────────────────────────────────
drop trigger if exists items_bump_recoveries on public.items;
drop trigger if exists on_item_status_change_lock_convos on public.items;

-- ────────────────────────────────────────────────────────────────────────────
-- Recreate with explicit, ordered names.
--
-- Order contract (do not change without reviewing both functions):
--   t10 → recovery counter (reads claims, increments users.recoveries_count)
--   t20 → conversation lock + closure message (writes conversations + messages)
-- ────────────────────────────────────────────────────────────────────────────
create trigger t10_items_bump_recoveries
  after update of status on public.items
  for each row
  execute function public.bump_recoveries_on_complete();

create trigger t20_lock_convos_on_item_inactive
  after update of status on public.items
  for each row
  when (
    old.status is distinct from new.status
    and new.status <> 'active'
  )
  execute function public.lock_conversations_on_item_inactive();

comment on trigger t10_items_bump_recoveries on public.items is
  'Order contract: must fire BEFORE t20_lock_convos_on_item_inactive. '
  'Numeric prefix (t10/t20) encodes the intended firing order, which '
  'PostgreSQL resolves alphabetically among same-timing triggers.';

comment on trigger t20_lock_convos_on_item_inactive on public.items is
  'Order contract: must fire AFTER t10_items_bump_recoveries. See sibling '
  'trigger comment for the rationale.';
