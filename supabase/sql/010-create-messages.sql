-- 010 — messages: chat inside a Deal Room.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Chat keeps the conversation on the record: nobody can edit or delete
-- a message, so the team can read it when reviewing a concern. Links are
-- rejected, because links are how phishing works.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists messages (
  id         bigint      generated always as identity primary key,
  deal_id    uuid        not null references deals(id) on delete cascade,
  -- Always whoever sends it.
  sender_id  uuid        not null default auth.uid() references profiles(id),
  body       text        not null
             check (char_length(body) between 1 and 1000)
             -- No links: http(s)://, www., or anything like example.com
             check (body !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop)\M)'),
  created_at timestamptz not null default now()
);

-- 2. Who may touch which columns -----------------------------------
--
-- Traders may only write the deal and the message text. The sender is
-- filled in by the database. Nobody may edit or delete a message.

revoke insert, update, delete on messages from anon, authenticated;
grant insert (deal_id, body) on messages to authenticated;

-- 3. Row Level Security --------------------------------------------

alter table messages enable row level security;

-- Only the seller and the buyer of the deal may read its chat.
create policy "deal traders can read the chat"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from deals d
      where d.id = messages.deal_id
        and (select auth.uid()) in (d.seller_id, d.buyer_id)
    )
  );

-- Only the seller and the buyer may send, as themselves, once a buyer
-- has joined.
create policy "deal traders can send messages"
  on messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from deals d
      where d.id = messages.deal_id
        and d.buyer_id is not null
        and (select auth.uid()) in (d.seller_id, d.buyer_id)
    )
  );

-- Deliberately NO update or delete policy.

-- 4. Check ------------------------------------------------------------
-- You should see two rows, both for {authenticated}: SELECT and INSERT.

select policyname, cmd, roles
from pg_policies
where tablename = 'messages';
