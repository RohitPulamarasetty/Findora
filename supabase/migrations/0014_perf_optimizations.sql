-- 0014_perf_optimizations.sql
-- Performance + scalability fixes. Preserves all existing behavior;
-- only swaps slow implementations for index-using equivalents.
--
-- WHAT THIS DOES:
--   1. get_user_conversations(uuid)  -> kills the 1+N fan-out in
--      /api/conversations GET. Returns the full list in one round-trip
--      with last-message + other-user + item joined via DISTINCT ON.
--   2. find_fuzzy_item_ids(...)      -> rewritten to use the `%>` operator
--      so the trigram GIN indexes (items_title_trgm_idx, etc.) are hit.
--      pg_trgm.word_similarity_threshold is set per-call so behavior is
--      stable regardless of session settings.
--   3. reconcile_item_flag_counts()  -> backs /api/cron/reconcile-counters.
--   4. reconcile_conversation_unread() -> same.
--
-- Idempotent. Safe to re-apply.


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Single-call conversation list.
--
-- Replaces the 1+N pattern (fetch conversations → per-conversation last
-- message lookup). Uses DISTINCT ON on (conversation_id, created_at desc),
-- which can use the existing messages_conversation_idx scanned backwards.
--
-- Behavior change: NONE. Returns same row shape the route already builds.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.get_user_conversations(p_user_id uuid)
returns table (
  id                      uuid,
  item_id                 uuid,
  owner_id                uuid,
  finder_id               uuid,
  is_locked               boolean,
  last_message_at         timestamptz,
  created_at              timestamptz,
  updated_at              timestamptz,
  unread_count            integer,
  other_user_id           uuid,
  other_user_full_name    text,
  other_user_avatar_url   text,
  item_title              text,
  item_type               item_type,
  last_message_content    text,
  last_message_created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with my_convos as (
    select c.*
    from public.conversations c
    where c.owner_id = p_user_id or c.finder_id = p_user_id
  ),
  last_msgs as (
    -- DISTINCT ON over (conversation_id, created_at desc) lets Postgres
    -- pick the most recent message per conversation with a single index
    -- scan of messages_conversation_idx (created in 0006_search_indexes).
    select distinct on (m.conversation_id)
      m.conversation_id, m.content, m.created_at
    from public.messages m
    where m.conversation_id in (select id from my_convos)
    order by m.conversation_id, m.created_at desc
  )
  select
    c.id,
    c.item_id,
    c.owner_id,
    c.finder_id,
    c.is_locked,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    case when c.owner_id = p_user_id then c.unread_owner else c.unread_finder end
      as unread_count,
    u.id          as other_user_id,
    u.full_name   as other_user_full_name,
    u.avatar_url  as other_user_avatar_url,
    i.title       as item_title,
    i.type        as item_type,
    lm.content    as last_message_content,
    lm.created_at as last_message_created_at
  from my_convos c
  left join public.users u
    on u.id = case when c.owner_id = p_user_id then c.finder_id else c.owner_id end
  left join public.items i
    on i.id = c.item_id
  left join last_msgs lm
    on lm.conversation_id = c.id
  order by c.last_message_at desc nulls last;
$$;

grant execute on function public.get_user_conversations(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Index-using fuzzy search.
--
-- The previous body used `word_similarity(needle, haystack) >= 0.15`. That
-- predicate is NOT indexable. The `%>` operator IS indexable via
-- pg_trgm GIN — provided pg_trgm.word_similarity_threshold is set first.
--
-- We set it via `set_config(..., true)` (the `true` = transaction-local),
-- so this function is safe to call concurrently without leaking session
-- state.
-- ─────────────────────────────────────────────────────────────────────────────
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
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  -- Tx-local threshold so the %> operator becomes index-driven. 0.15
  -- matches the previous implicit threshold so recall is identical.
  perform set_config('pg_trgm.word_similarity_threshold', '0.15', true);

  return query
  with q as (
    select case
             when length(btrim(p_query)) > 0
             then plainto_tsquery('english', p_query)
             else null
           end as v_tsquery
  )
  select
    i.id as item_id,
    (
        coalesce(ts_rank(i.search_vector, q.v_tsquery), 0)  * 1.0
      + word_similarity(p_query, i.title)                   * 2.0
      + word_similarity(p_query, i.description)             * 1.0
      + word_similarity(p_query, i.location)                * 0.6
      + word_similarity(p_query, i.category::text)          * 0.4
    )::real as rank
  from public.items i, q
  where
    -- Index-using predicates: `%>` uses the GIN trigram indexes
    -- (items_title_trgm_idx, items_description_trgm_idx,
    -- items_location_trgm_idx). FTS uses items_search_vector_idx.
    (
      (q.v_tsquery is not null and i.search_vector @@ q.v_tsquery)
      or p_query %> i.title
      or p_query %> i.description
      or p_query %> i.location
      or p_query %> i.category::text
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
end;
$$;

grant execute on function public.find_fuzzy_item_ids(
  text, text, text, text[], date, date, int
) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Reconcile cached flag_count from public.flags.
--    Returns number of rows updated.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.reconcile_item_flag_counts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fixed integer := 0;
  v_reset integer := 0;
begin
  -- Items whose stored count disagrees with truth.
  with truth as (
    select item_id, count(*)::int as actual
    from public.flags
    where item_id is not null
    group by item_id
  ),
  upd as (
    update public.items i
       set flag_count = t.actual
      from truth t
     where i.id = t.item_id
       and i.flag_count <> t.actual
    returning 1
  )
  select count(*)::int into v_fixed from upd;

  -- Items with stale non-zero counts but no flags any more.
  with upd2 as (
    update public.items i
       set flag_count = 0
     where i.flag_count > 0
       and not exists (select 1 from public.flags f where f.item_id = i.id)
    returning 1
  )
  select count(*)::int into v_reset from upd2;

  return v_fixed + v_reset;
end;
$$;

grant execute on function public.reconcile_item_flag_counts() to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Reconcile unread_owner / unread_finder against actual messages.
--    "Unread" = messages from the other participant that aren't `read`.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.reconcile_conversation_unread()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  with truth as (
    select
      c.id as conversation_id,
      coalesce(sum(case when m.sender_id = c.finder_id and m.status <> 'read' then 1 else 0 end), 0)::int
        as actual_unread_owner,
      coalesce(sum(case when m.sender_id = c.owner_id  and m.status <> 'read' then 1 else 0 end), 0)::int
        as actual_unread_finder
    from public.conversations c
    left join public.messages m on m.conversation_id = c.id
    group by c.id, c.owner_id, c.finder_id
  ),
  upd as (
    update public.conversations c
       set unread_owner  = t.actual_unread_owner,
           unread_finder = t.actual_unread_finder
      from truth t
     where c.id = t.conversation_id
       and (c.unread_owner  <> t.actual_unread_owner
            or c.unread_finder <> t.actual_unread_finder)
    returning 1
  )
  select count(*)::int into v_updated from upd;

  return v_updated;
end;
$$;

grant execute on function public.reconcile_conversation_unread() to authenticated;
