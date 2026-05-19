-- 0008_storage_buckets.sql
-- Supabase Storage bucket for item images

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- RLS: authenticated users can upload to their own folder
create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: public read access
create policy "Public can read item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- RLS: owners and admins can delete
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
