-- 004 — create profiles for confirmed traders who don't have one yet.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Needed once, for accounts confirmed before 003's trigger existed.
-- Safe to run again: it skips anyone who already has a profile.

insert into public.profiles (id, display_name)
select
  u.id,
  left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Trader'), 40)
from auth.users u
where u.email_confirmed_at is not null
on conflict (id) do nothing;

-- Check the trigger from 003 exists. You should see two rows:
-- on_auth_user_created and on_auth_user_confirmed.
select tgname
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname in ('on_auth_user_created', 'on_auth_user_confirmed');
