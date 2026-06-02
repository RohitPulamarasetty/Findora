-- 0021_fix_auto_hidden_in_search.sql
--
-- PROBLEM: find_fuzzy_item_ids (created in 0010) does not filter
-- auto_hidden = false when p_status = 'active'. Items flagged by ≥3
-- distinct reporters (auto_hidden = true by the 0015 trigger) were
-- still returned by fuzzy search, defeating content moderation.
--
-- FIX: add `and (p_status <> 'active' or i.auto_hidden = false)` to
-- the WHERE clause. Non-active searches (completed, all) are unaffected.
--
-- This is a CREATE OR REPLACE — safe to apply to a live project.

create or replace function public.find_fuzzy_item_ids(
  p_query      text,
  p_type       text     default null,
  p_status     text     default 'active',
  p_categories text[]   default null,
  p_date_from  date     default null,
  p_date_to    date     default null,
  p_limit      int      default 50
)
returns table (item_id uuid, rank float4)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tsquery  tsquery := null;
  v_tokens   text[];
  v_token    text;
  v_cleaned  text;
begin
  -- Build a safe tsquery: split on whitespace, strip non-alphanumeric, append :*
  -- for prefix matching so "wall" matches "wallet".
  v_tokens := regexp_split_to_array(btrim(p_query), '\s+');
  foreach v_token in array v_tokens loop
    v_cleaned := regexp_replace(v_token, '[^a-zA-Z0-9]', '', 'g');
    if char_length(v_cleaned) >= 2 then
      if v_tsquery is null then
        v_tsquery := to_tsquery('simple', v_cleaned || ':*');
      else
        v_tsquery := v_tsquery && to_tsquery('simple', v_cleaned || ':*');
      end if;
    end if;
  end loop;

  return query
  select
    i.id as item_id,
    (
      -- FTS component: high weight, handles exact words and stemming
      case
        when v_tsquery is not null and i.search_vector @@ v_tsquery
          then ts_rank_cd(i.search_vector, v_tsquery) * 3.0
        else 0.0
      end
      +
      -- Trigram component: handles typos, partial words, substrings.
      greatest(
        word_similarity(p_query, i.title)          * 2.5,
        word_similarity(p_query, i.description)    * 1.0,
        word_similarity(p_query, i.location)       * 1.5,
        word_similarity(p_query, i.category::text) * 1.2
      )
    )::float4 as rank
  from public.items i
  where
    -- At least one strategy matched to avoid noise
    (
      (v_tsquery is not null and i.search_vector @@ v_tsquery)
      or word_similarity(p_query, i.title)          >= 0.15
      or word_similarity(p_query, i.description)    >= 0.15
      or word_similarity(p_query, i.location)       >= 0.20
      or word_similarity(p_query, i.category::text) >= 0.30
    )
    -- Status filter
    and case p_status
          when 'active'    then i.status = 'active'
          when 'completed' then i.status in ('completed', 'closed')
          else true
        end
    -- Auto-hidden guard: items flagged by ≥3 distinct reporters must never
    -- appear in the active public feed. Non-active search modes (completed,
    -- all) are unaffected — admins need to find hidden items for review.
    and (p_status <> 'active' or i.auto_hidden = false)
    -- Type filter
    and (p_type is null or i.type::text = p_type)
    -- Category filter
    and (
      p_categories is null
      or array_length(p_categories, 1) is null
      or i.category::text = any(p_categories)
    )
    -- Date range filter (on date_occurred, not created_at)
    and (p_date_from is null or i.date_occurred >= p_date_from)
    and (p_date_to   is null or i.date_occurred <= p_date_to)
  order by rank desc, i.created_at desc
  limit p_limit;
end;
$$;

-- Re-grant execute permissions (CREATE OR REPLACE revokes grants on some
-- Postgres versions; explicit re-grant is idempotent and safe).
grant execute on function public.find_fuzzy_item_ids(
  text, text, text, text[], date, date, int
) to anon, authenticated;
