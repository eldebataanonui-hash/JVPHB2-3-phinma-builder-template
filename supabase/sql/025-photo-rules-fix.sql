-- 025 — fix the photo rules found in the third code review.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. Buyers couldn't see listing photos in the preview, and "Selling
--    now" never showed photos. The photo rule (022) asked "does this
--    deal still need a buyer?" by looking up the deal, but a trader who
--    isn't in the deal isn't allowed to look it up (deals are private),
--    so the answer was always "no". A helper function now answers that
--    question with the database's own permissions, and returns only
--    yes/no.
-- 2. The "at most 4 photos" and "at most 5 avatars" limits counted files
--    from inside the storage rules themselves, a pattern Postgres can
--    refuse. A helper function now does the counting.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Helper: may the caller see this deal's photos? ---------------------
-- Seller and buyer always; any logged-in trader while the deal is still
-- waiting for a buyer (the preview and "Selling now").

create or replace function public.can_view_deal_photos(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.deals d
    where d.id::text = p_folder
      and (select auth.uid()) is not null
      and (
        (select auth.uid()) in (d.seller_id, d.buyer_id)
        or (d.buyer_id is null and d.step = 'waiting_for_buyer')
      )
  );
$$;

revoke execute on function public.can_view_deal_photos(text) from public, anon;
grant execute on function public.can_view_deal_photos(text) to authenticated;

-- 2. Helper: how many files are in a folder? ----------------------------

create or replace function public.storage_folder_count(p_bucket text, p_folder text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from storage.objects o
  where o.bucket_id = p_bucket
    and (storage.foldername(o.name))[1] = p_folder;
$$;

revoke execute on function public.storage_folder_count(text, text) from public, anon;
grant execute on function public.storage_folder_count(text, text) to authenticated;

-- 3. Deal photos: rules rebuilt on the helpers ---------------------------

drop policy if exists "deal traders and previewers can see deal photos" on storage.objects;
create policy "deal traders and previewers can see deal photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'deal-photos'
    and public.can_view_deal_photos((storage.foldername(name))[1])
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
    and public.storage_folder_count('deal-photos', (storage.foldername(name))[1]) < 4
  );

-- 4. Avatars: same counting helper ----------------------------------------

drop policy if exists "traders can upload their own avatar" on storage.objects;
create policy "traders can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.storage_folder_count('avatars', (select auth.uid())::text) < 5
  );

-- 5. Check ------------------------------------------------------------
-- First row: can_bypass_rls should be true (the helpers need to see all
-- files to count them). Then the three deal-photo rules and the avatar
-- upload rule.

select 'helper owner can count every file' as what, rolbypassrls::text as result
from pg_roles where rolname = current_user
union all
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and (policyname like '%deal photos%' or policyname = 'traders can upload their own avatar');
