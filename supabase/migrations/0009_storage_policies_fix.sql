-- 0009_storage_policies_fix.sql
-- Ensure item-images bucket exists and all required storage policies are applied.
-- Safe to re-run — uses ON CONFLICT / IF NOT EXISTS / DROP IF EXISTS.

-- Ensure bucket exists as public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Drop and recreate storage policies to ensure they are correct
drop policy if exists "Authenticated users can upload item images" on storage.objects;
drop policy if exists "Public can read item images" on storage.objects;
drop policy if exists "Owners can delete own images" on storage.objects;
drop policy if exists "Owners can update own images" on storage.objects;

-- INSERT: authenticated users can upload to their own user-id folder
create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: public read access
create policy "Public can read item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- UPDATE: owners can update their own uploads (needed for upsert flows)
create policy "Owners can update own images"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: owners and admins can remove uploads
create policy "Owners can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.role = 'admin'
      )
    )
  );
