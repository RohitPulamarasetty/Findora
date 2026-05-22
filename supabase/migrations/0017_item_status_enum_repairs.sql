-- 0017_item_status_enum_repairs.sql
--
-- Phase 1 / B1 + B2 — reproducibility repair for the item_status enum.
--
-- Migration 0012_item_lifecycle.sql intended to extend item_status with three
-- new terminal values ('resolved', 'expired', 'removed'), but those ALTER TYPE
-- statements were left commented out (see 0012 lines 17-19). Later migrations
-- (0014, 0015, 0016) and runtime code reference these values, so a *fresh*
-- `supabase db push` against a clean database fails when those functions are
-- defined. Production today survives because the values were added manually
-- before 0012 was edited; this migration restores reproducibility from the
-- migration files alone.
--
-- ── Safety ───────────────────────────────────────────────────────────────────
--   * ALTER TYPE ... ADD VALUE IF NOT EXISTS is a no-op when the value
--     already exists (e.g. on the existing production DB) — so this migration
--     is safe to apply against:
--       - a fresh DB (adds the values)
--       - a partially-migrated DB (no-op if already present)
--       - the current production DB (no-op)
--   * Each ALTER TYPE is its own top-level statement so the new values are
--     committed before any later migration tries to use them. The backfill
--     UPDATE below only uses *pre-existing* enum values ('active',
--     'claim_pending'), so it is safe to run in the same migration.
--   * No existing trigger/function/RLS-policy logic is changed; the column
--     type is widened in place.
--
-- ── B2 backfill rationale ───────────────────────────────────────────────────
-- 'claim_pending' was the pre-0015 way to represent "item has an open claim".
-- After 0015 introduced the claims table as the source of truth, the
-- item.status column no longer needs to encode claim state — the claim rows
-- carry it. Any legacy item still sitting in 'claim_pending' is invisible to
-- the active feed (which filters status='active') and to the new claims flow.
-- Moving them back to 'active' lets the claims table drive their lifecycle
-- normally; if a real open claim exists, the claims_open_unique partial
-- index keeps it pinned. No data is lost.
--
-- The enum value 'claim_pending' itself is intentionally NOT removed:
-- PostgreSQL cannot drop an enum value without rewriting the type, and the
-- value's continued presence is harmless once no rows reference it.

-- ────────────────────────────────────────────────────────────────────────────
-- B1 — Extend the item_status enum (idempotent)
-- ────────────────────────────────────────────────────────────────────────────
alter type public.item_status add value if not exists 'resolved';
alter type public.item_status add value if not exists 'expired';
alter type public.item_status add value if not exists 'removed';

-- ────────────────────────────────────────────────────────────────────────────
-- B2 — Normalize legacy claim_pending rows to active.
--
-- Uses only enum values that existed in 0001, so there's no dependency on the
-- ALTER TYPE statements above having committed first.
-- ────────────────────────────────────────────────────────────────────────────
update public.items
   set status = 'active'
 where status = 'claim_pending';
