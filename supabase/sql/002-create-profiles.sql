-- 002 — profiles: one row per trader.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run

-- 1. The table ------------------------------------------------------

create table if not exists profiles (
  -- Same ID as the trader's login, so a profile always belongs to
  -- exactly one account. Deleting the login deletes the profile.
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text        not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

-- 2. Row Level Security --------------------------------------------

alter table profiles enable row level security;

-- Any logged-in trader may read profiles, so traders can see who they
-- are dealing with. Logged-out visitors see nothing.
create policy "logged-in traders can read profiles"
  on profiles for select
  to authenticated
  using (true);

-- You may only create your own profile row.
create policy "traders can create their own profile"
  on profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- You may only update your own profile row, and can't hand it to
-- someone else.
create policy "traders can update their own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Deliberately NO delete policy: nobody can delete a profile through
-- the website.
