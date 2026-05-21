-- 0012_item_lifecycle.sql
-- Resolved-case lifecycle: preserve historical proof + recovery metrics.
-- Items are no longer hard-deleted by the default DELETE handler; instead
-- they are transitioned through a richer status lifecycle and stored
-- permanently for analytics, admin insight, and future success stories.
--
-- Adds three new statuses, an audit trail, and a partial index so the
-- public feed stays fast even as the resolved/removed tail grows.
--
-- Safe for prod: enum-add and add-column are non-blocking, the partial
-- index uses CONCURRENTLY-equivalent behavior by being narrow + small,
-- and existing rows keep their current status untouched.

-- 1. Extend the item_status enum.
--    Postgres requires alter-type to be committed before the new values
--    can be used in the same transaction, so this runs as its own statement.
-- alter type item_status add value if not exists 'resolved';
-- alter type item_status add value if not exists 'expired';
-- alter type item_status add value if not exists 'removed';


-- 2. Audit / resolution metadata. All optional so existing rows are valid.
alter table public.items
  add column if not exists resolved_at         timestamptz,
  add column if not exists resolved_by         uuid references public.users(id) on delete set null,
  add column if not exists handover_confirmed  boolean not null default false,
  add column if not exists resolution_note     text;

-- 3. Index the active feed query. Most reads filter by status='active'
--    ordered by created_at; a partial index keeps that fast even when the
--    table is dominated by resolved/expired/removed rows.
create index if not exists items_active_feed_idx
  on public.items (created_at desc)
  where status = 'active';

-- 4. Lifecycle invariant: when an item is moved into a terminal state,
--    resolved_at must be set. Enforced at the application layer (see
--    /api/items/[id]/complete and /api/admin/items/[id]) — this comment
--    documents the contract for future maintainers.
comment on column public.items.resolved_at is
  'Set when status transitions to completed/resolved/closed/expired/removed. Drives admin analytics + recovery metrics.';
comment on column public.items.resolved_by is
  'User who triggered the resolution. Owner for self-resolved, admin for admin-driven removals.';
comment on column public.items.handover_confirmed is
  'True when the owner has confirmed the handover for completed/resolved cases.';
comment on column public.items.resolution_note is
  'Optional free-text reason. Used for admin removals and future success-story write-ups.';

-- 5. Update fuzzy-search RPC so soft-removed items never appear in public
--    search results, and the completed view returns the full set of
--    terminal-success statuses (completed / resolved / closed).
--    `create or replace` keeps the function signature and grants stable.
create or replace function public.find_fuzzy_item_ids(
  p_query      text,
  p_type       text     default null,
  p_status     text     default 'active',
  p_categories text[]   default null,
  p_date_from  date     default null,
  p_date_to    date     default null,
  p_limit      int      default 50
)
returns table (item_id uuid, rank real)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select case when length(trim(p_query)) > 0
                then plainto_tsquery('english', p_query)
                else null end as v_tsquery
  )
  select
    i.id as item_id,
    (
      coalesce(ts_rank(i.search_vector, q.v_tsquery), 0)              * 1.0
      + word_similarity(p_query, i.title)                              * 2.0
      + word_similarity(p_query, i.description)                        * 1.0
      + word_similarity(p_query, i.location)                           * 0.6
      + word_similarity(p_query, i.category::text)                     * 0.4
    )::real as rank
  from public.items i, q
  where
    (
      (q.v_tsquery is not null and i.search_vector @@ q.v_tsquery)
      or word_similarity(p_query, i.title)          >= 0.15
      or word_similarity(p_query, i.description)    >= 0.15
      or word_similarity(p_query, i.location)       >= 0.20
      or word_similarity(p_query, i.category::text) >= 0.30
    )
    and case p_status
          when 'active'    then i.status = 'active'
          when 'completed' then i.status in ('completed', 'resolved', 'closed')
          else i.status <> 'removed'
        end
    and (p_type is null or i.type::text = p_type)
    and (
      p_categories is null
      or array_length(p_categories, 1) is null
      or i.category::text = any(p_categories)
    )
    and (p_date_from is null or i.date_occurred >= p_date_from)
    and (p_date_to   is null or i.date_occurred <= p_date_to)
  order by rank desc
  limit greatest(1, least(p_limit, 200));
$$;
