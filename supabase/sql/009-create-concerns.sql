-- 009 — concerns: reports sent to the AQTech GHub team.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- The team reviews concerns in the dashboard (Table Editor -> concerns)
-- and changes status to 'resolved' there. The deal's record in
-- deal_events shows who did what, and when.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists concerns (
  id          bigint      generated always as identity primary key,
  deal_id     uuid        not null references deals(id) on delete cascade,
  -- Always whoever files it.
  reporter_id uuid        not null default auth.uid() references profiles(id),
  message     text        not null check (char_length(message) between 10 and 2000),
  status      text        not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now()
);

-- 2. Who may touch which columns -----------------------------------
--
-- Traders may only write the deal and the message. The reporter and
-- the status are filled in by the database.

revoke insert, update, delete on concerns from anon, authenticated;
grant insert (deal_id, message) on concerns to authenticated;

-- 3. Row Level Security --------------------------------------------

alter table concerns enable row level security;

-- You may read only the concerns you filed.
create policy "traders can read their own concerns"
  on concerns for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

-- Only the seller or buyer of a deal may file a concern about it, as
-- themselves.
create policy "deal traders can file concerns"
  on concerns for insert
  to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and exists (
      select 1 from deals d
      where d.id = concerns.deal_id
        and (select auth.uid()) in (d.seller_id, d.buyer_id)
    )
  );

-- Deliberately NO update or delete policy: only the team, in the
-- dashboard, changes a concern's status.

-- 4. Check ------------------------------------------------------------
-- You should see two rows, both for {authenticated}: SELECT and INSERT.

select policyname, cmd, roles
from pg_policies
where tablename = 'concerns';
