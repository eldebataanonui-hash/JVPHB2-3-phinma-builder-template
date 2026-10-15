-- 013 — profile descriptions and direct messages.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. Traders can write a short description on their profile. They can
--    change ONLY that column of their own row (011 still stops them
--    changing the join date or anything else).
-- 2. Direct messages let traders talk before starting a trade. Same
--    protections as Deal Room chat: only the two people can read a
--    conversation, nobody can edit or delete a message, links are
--    rejected. Payments and codes belong in a Deal Room, not here.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Profile description -------------------------------------------

alter table profiles
  add column if not exists bio text not null default '';

alter table profiles drop constraint if exists profiles_bio_check;
alter table profiles
  add constraint profiles_bio_check check (
    char_length(bio) <= 500
    and regexp_replace(bio, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
        !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)'
  );

-- Only the bio column may be updated, and only on your own row.
grant update (bio) on profiles to authenticated;

drop policy if exists "traders can update their own bio" on profiles;
create policy "traders can update their own bio"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. Direct messages ------------------------------------------------

create table if not exists direct_messages (
  id           bigint      generated always as identity primary key,
  -- Always whoever sends it.
  sender_id    uuid        not null default auth.uid() references profiles(id),
  recipient_id uuid        not null references profiles(id),
  body         text        not null,
  created_at   timestamptz not null default now(),
  constraint direct_messages_not_to_self check (recipient_id <> sender_id),
  constraint direct_messages_body_length check (char_length(body) between 1 and 1000),
  constraint direct_messages_body_no_links check (
    regexp_replace(body, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
    !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)'
  )
);

create index if not exists direct_messages_sender_idx on direct_messages (sender_id);
create index if not exists direct_messages_recipient_idx on direct_messages (recipient_id);

-- Traders may only read messages and write the recipient and text. The
-- sender is filled in by the database. Nobody may edit or delete.
revoke all on direct_messages from anon, authenticated;
grant select on direct_messages to authenticated;
grant insert (recipient_id, body) on direct_messages to authenticated;

alter table direct_messages enable row level security;

-- Only the sender and the recipient may read a message.
drop policy if exists "traders can read their own conversations" on direct_messages;
create policy "traders can read their own conversations"
  on direct_messages for select
  to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));

-- You may only send as yourself.
drop policy if exists "traders can send direct messages" on direct_messages;
create policy "traders can send direct messages"
  on direct_messages for insert
  to authenticated
  with check ((select auth.uid()) = sender_id);

-- Deliberately NO update or delete policy.

-- 3. Check ------------------------------------------------------------
-- You should see five rows, all for {authenticated}:
--   direct_messages INSERT, direct_messages SELECT,
--   profiles INSERT, profiles SELECT, profiles UPDATE

select tablename, policyname, cmd, roles
from pg_policies
where tablename in ('profiles', 'direct_messages')
order by tablename, cmd;
