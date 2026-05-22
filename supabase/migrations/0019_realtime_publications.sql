-- 0019_realtime_publications.sql
--
-- Ensures that the four tables the client-side realtime hooks subscribe to
-- are present in the `supabase_realtime` logical-replication publication.
--
-- ── Why this is needed ────────────────────────────────────────────────────
-- Supabase Realtime's postgres_changes feature is backed by a logical-
-- replication publication named `supabase_realtime`. Tables must be
-- explicitly added to that publication; if they are absent the WebSocket
-- channel connects and reports SUBSCRIBED but no row-change events are
-- ever delivered — a silent failure.
--
-- In Supabase Cloud projects created after mid-2023, all public-schema
-- tables are pre-loaded into the publication via the dashboard. Older
-- projects and any fresh `supabase db push` clone need this migration.
-- The DO block below is idempotent: it checks pg_publication_tables before
-- issuing ALTER PUBLICATION so it is safe to run against a project that
-- already has the tables registered.
--
-- ── Tables ────────────────────────────────────────────────────────────────
-- items         — item detail page + feed live-removal (useRealtimeItem,
--                 useRealtimeItems)
-- conversations — conversation lock propagation (useRealtimeConversation,
--                 useRealtimeConversations)
-- messages      — live message delivery (useMessages)
-- claims        — claim-review section live updates (useRealtimeClaims)
--
-- ── REPLICA IDENTITY ─────────────────────────────────────────────────────
-- Default REPLICA IDENTITY (primary key) is sufficient for all four tables:
--  * UPDATE events include the full new row in payload.new regardless.
--  * DELETE events include the primary key in payload.old, which is all we
--    need for targeted cache eviction.
-- We do NOT switch to REPLICA IDENTITY FULL because it doubles the WAL
-- volume for every UPDATE on those tables; the tradeoff is not worth it.

do $$
declare
  t text;
begin
  foreach t in array array['items','conversations','messages','claims']
  loop
    if not exists (
      select 1
        from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
