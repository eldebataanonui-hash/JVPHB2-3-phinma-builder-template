-- 006 — deals: one row per Deal Room, plus the preview and join
-- functions.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists deals (
  id             uuid        primary key default gen_random_uuid(),
  -- The seller is always whoever creates the deal.
  seller_id      uuid        not null default auth.uid() references profiles(id),
  -- Empty until a buyer joins.
  buyer_id       uuid        references profiles(id),
  title          text        not null check (char_length(title) between 1 and 80),
  description    text        not null default '' check (char_length(description) <= 1000),
  price          integer     not null check (price between 1 and 10000000),
  -- The live ownership code, made by the database, e.g. AQ-7F3K9B.
  ownership_code text        not null default ('AQ-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  -- Where the trade is up to. Ticket 05 moves deals through these.
  step           text        not null default 'waiting_for_buyer' check (step in (
                   'waiting_for_buyer',
                   'awaiting_code',
                   'code_placed',
                   'awaiting_first_payment',
                   'first_payment_sent',
                   'awaiting_lock_in',
                   'lock_in_done',
                   'awaiting_second_payment',
                   'second_payment_sent',
                   'completed'
                 )),
  created_at     timestamptz not null default now(),
  completed_at   timestamptz,
  constraint buyer_is_not_seller check (buyer_id is null or buyer_id <> seller_id)
);

-- 2. Who may touch which columns -----------------------------------
--
-- Traders may only ever type the title, description and price. Every
-- other column (seller, buyer, code, step...) is filled in by the
-- database, so nobody can create a deal with a code they chose, or one
-- that starts at "completed".

revoke insert, update, delete on deals from anon, authenticated;
grant insert (title, description, price) on deals to authenticated;

-- 3. Row Level Security --------------------------------------------

alter table deals enable row level security;

-- Only the seller and the buyer of a deal may read it.
create policy "traders can read their own deals"
  on deals for select
  to authenticated
  using ((select auth.uid()) in (seller_id, buyer_id));

-- A logged-in trader may create a deal, only as its seller.
create policy "traders can create deals as seller"
  on deals for insert
  to authenticated
  with check ((select auth.uid()) = seller_id);

-- Deliberately NO update or delete policy. Changes happen only through
-- the functions below, which check the rules themselves.

-- 4. Deal preview ---------------------------------------------------
--
-- Lets a logged-in trader who has the link see what's on offer before
-- joining. Shows only safe fields: never the ownership code.

create or replace function public.deal_preview(p_deal_id uuid)
returns table (
  id          uuid,
  title       text,
  description text,
  price       integer,
  seller_id   uuid,
  seller_name text,
  has_buyer   boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.title, d.description, d.price, d.seller_id,
         p.display_name, d.buyer_id is not null
  from public.deals d
  join public.profiles p on p.id = d.seller_id
  where d.id = p_deal_id
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.deal_preview(uuid) from public, anon;
grant execute on function public.deal_preview(uuid) to authenticated;

-- 5. Join deal ------------------------------------------------------
--
-- Makes the caller the buyer, only if the deal is still waiting for a
-- buyer and the caller isn't the seller.

create or replace function public.join_deal(p_deal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.deals
     set buyer_id = (select auth.uid()),
         step     = 'awaiting_code'
   where id = p_deal_id
     and (select auth.uid()) is not null
     and buyer_id is null
     and step = 'waiting_for_buyer'
     and seller_id <> (select auth.uid());

  if not found then
    raise exception 'This deal can''t be joined. It may already have a buyer, or it''s your own deal.';
  end if;
end;
$$;

revoke execute on function public.join_deal(uuid) from public, anon;
grant execute on function public.join_deal(uuid) to authenticated;

-- 6. Check ------------------------------------------------------------
-- You should see two rows, both for {authenticated}: SELECT and INSERT.

select policyname, cmd, roles
from pg_policies
where tablename = 'deals';
