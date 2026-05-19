-- 0006_search_indexes.sql
-- Full-text search index on items

-- GIN index for fast FTS
create index items_search_vector_idx on public.items using gin(search_vector);

-- Composite index for feed queries (type + status + created_at)
create index items_feed_idx on public.items (type, status, created_at desc);

-- Index for user's own items
create index items_user_id_idx on public.items (user_id, created_at desc);

-- Index for conversation lookups
create index conversations_owner_idx on public.conversations (owner_id, last_message_at desc nulls last);
create index conversations_finder_idx on public.conversations (finder_id, last_message_at desc nulls last);

-- Index for message ordering within a conversation
create index messages_conversation_idx on public.messages (conversation_id, created_at asc);

-- Index for flag lookups
create index flags_item_id_idx on public.flags (item_id);
create index flags_unresolved_idx on public.flags (is_resolved, created_at desc);
