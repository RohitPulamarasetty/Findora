-- ════════════════════════════════════════════════════════════════
-- Findora — Production cleanup script
-- ════════════════════════════════════════════════════════════════
-- Wipes test data from the application tables WITHOUT touching the
-- schema, auth users, RLS policies, or storage bucket configuration.
-- Run this once before launch from the Supabase SQL editor.
--
-- ⚠ This is DESTRUCTIVE. Take a manual backup first.
--
-- What it does:
--   • Truncates application content (items, conversations, messages,
--     flags, item_images, payments) and resets identity sequences.
--   • Removes ALL objects from the item-images storage bucket.
--   • Leaves auth.users + public.users intact so existing admins can
--     still log in. Comment that line if you also want to drop users.
-- ════════════════════════════════════════════════════════════════

begin;

-- 1) Application content
truncate table
  public.flags,
  public.messages,
  public.conversations,
  public.item_images,
  public.items,
  public.payments,
  public.banned_emails
restart identity cascade;

-- 2) Storage objects (does not drop the bucket itself)
delete from storage.objects
where bucket_id = 'item-images';

-- 3) (Optional) Wipe all non-admin users. Uncomment if desired.
-- delete from auth.users
-- where id in (
--   select id from public.users where role <> 'admin'
-- );

commit;

-- ════════════════════════════════════════════════════════════════
-- Verify (run separately if you want a quick sanity check):
--
--   select count(*) from public.items;          -- expect 0
--   select count(*) from public.conversations;  -- expect 0
--   select count(*) from public.messages;       -- expect 0
--   select count(*) from public.flags;          -- expect 0
--   select count(*) from public.item_images;    -- expect 0
--   select count(*) from public.payments;       -- expect 0
--   select count(*) from storage.objects where bucket_id = 'item-images';
-- ════════════════════════════════════════════════════════════════
