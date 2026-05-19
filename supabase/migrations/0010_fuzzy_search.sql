-- 0010_fuzzy_search.sql
-- Typo-tolerant fuzzy search via pg_trgm + combined FTS/trigram ranking.

-- Enable trigram extension (available in all Supabase projects)
create extension if not exists pg_trgm;

-- Trigram GIN indexes for fast word_similarity queries
create index if not exists items_title_trgm_idx
  on public.items using gin(title gin_trgm_ops);

create index if not exists items_description_trgm_idx
  on public.items using gin(description gin_trgm_ops);

create index if not exists items_location_trgm_idx
  on public.items using gin(location gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- find_fuzzy_item_ids
--
-- Returns item IDs with a composite relevance rank built from two strategies:
--   1. FTS prefix matching (ts_rank_cd) — fast, handles exact/stemmed words
--   2. pg_trgm word_similarity — handles typos, partial words, substrings
--
-- Caller fetches the full item rows (with joins) using the returned IDs, then
-- sorts by rank. This keeps the join logic out of PL/pgSQL and in the
-- well-tested Supabase JS query builder.
-- ---------------------------------------------------------------------------
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
      -- word_similarity(needle, haystack) finds the best matching word-aligned
      -- substring in the haystack — ideal for short queries against long text.
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

-- Allow authenticated and anon roles to call this function
grant execute on function public.find_fuzzy_item_ids(
  text, text, text, text[], date, date, int
) to anon, authenticated;
