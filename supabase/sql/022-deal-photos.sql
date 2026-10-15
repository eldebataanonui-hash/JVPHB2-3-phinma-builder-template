-- 022 — listing photos: up to 4 photos of the account on a deal.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Photos live in a PRIVATE Storage bucket called "deal-photos", in a
-- folder named after the deal: <deal id>/<number>.jpg. No table needed:
-- the files in the folder are the photos.
--
-- Who can do what:
--   * see:    the deal's seller and buyer, or any logged-in trader while
--             the deal is still waiting for a buyer (the preview)
--   * add:    only the deal's seller, at most 4 photos per deal
--   * delete: only the deal's seller
-- The website shows photos through temporary links that expire.
--
-- Photos are a showcase, not proof: the live ownership code is what
-- proves the seller controls the account.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The bucket: private, images only, 2 MB max ------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-photos', 'deal-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage rules ------------------------------------------------------

drop policy if exists "deal traders and previewers can see deal photos" on storage.objects;
create policy "deal traders and previewers can see deal photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'deal-photos'
    and exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[1]
        and (
          (select auth.uid()) in (d.seller_id, d.buyer_id)
          or d.buyer_id is null
        )
    )
  );

drop policy if exists "sellers can add deal photos" on storage.objects;
create policy "sellers can add deal photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'deal-photos'
    and exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[1]
        and d.seller_id = (select auth.uid())
    )
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'deal-photos'
        and (storage.foldername(o.name))[1] = (storage.foldername(name))[1]
    ) < 4
  );

drop policy if exists "sellers can delete deal photos" on storage.objects;
create policy "sellers can delete deal photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'deal-photos'
    and exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[1]
        and d.seller_id = (select auth.uid())
    )
  );

-- Deliberately NO update policy: a new photo is a new file.

-- 3. Check ------------------------------------------------------------
-- You should see three rows: SELECT, INSERT and DELETE, all for
-- {authenticated}.

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like '%deal photos%'
order by cmd;
