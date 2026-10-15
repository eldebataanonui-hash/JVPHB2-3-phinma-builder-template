-- 016 — profile pictures.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Pictures live in a Supabase Storage bucket called "avatars". Each
-- trader may only upload into, and delete from, their OWN folder
-- (named after their id). Pictures are public to anyone who has the
-- picture's link, like avatars on most sites. Deals, chat and messages
-- stay private.
--
-- The profile remembers which picture is yours in avatar_path. The
-- database only accepts a path inside your own folder, so nobody can
-- point their avatar at someone else's file or an outside website.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The bucket: images only, 2 MB max --------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage rules: your own folder only ------------------------------

drop policy if exists "traders can upload their own avatar" on storage.objects;
create policy "traders can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Needed so you can remove your old picture when you change it.
drop policy if exists "traders can see their own avatar files" on storage.objects;
create policy "traders can see their own avatar files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "traders can delete their own avatar" on storage.objects;
create policy "traders can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Deliberately NO update policy: a new picture is a new file.

-- 3. The profile remembers your picture -------------------------------

alter table profiles
  add column if not exists avatar_path text;

alter table profiles drop constraint if exists profiles_avatar_path_own_folder;
alter table profiles
  add constraint profiles_avatar_path_own_folder check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/[0-9]+\.(jpg|png|webp)$')
  );

-- Traders may now change their description and their picture, nothing
-- else (011 and 013 still apply).
grant update (bio, avatar_path) on profiles to authenticated;

-- 4. Suggested traders also return the picture ------------------------
-- The return columns change, so the old version must be dropped first.

drop function if exists public.suggested_traders();

create function public.suggested_traders()
returns table (
  id           uuid,
  display_name text,
  bio          text,
  avatar_path  text,
  created_at   timestamptz,
  completed    integer,
  abandoned    integer,
  last_active  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.bio, p.avatar_path, p.created_at,
         r.completed, r.abandoned,
         greatest(
           p.created_at,
           (select max(d.created_at) from public.deals d where d.seller_id = p.id),
           (select max(e.created_at) from public.deal_events e where e.actor_id = p.id)
         ) as last_active
  from public.profiles p
  cross join lateral public.trader_record(p.id) r
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
  order by r.completed desc, last_active desc, p.created_at desc
  limit 30;
$$;

revoke execute on function public.suggested_traders() from public, anon;
grant execute on function public.suggested_traders() to authenticated;

-- 5. Check ------------------------------------------------------------
-- You should see three rows for the avatars bucket: INSERT, SELECT and
-- DELETE, all for {authenticated}.

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like '%avatar%'
order by cmd;
