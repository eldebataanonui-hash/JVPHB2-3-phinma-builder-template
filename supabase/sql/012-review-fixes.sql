-- 012 — fixes from the code review.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. Chat now allows email addresses. The Lock-In step needs the buyer
--    to send their email to the seller, but "name@gmail.com" was being
--    rejected as a link. Email addresses are ignored by the link check;
--    real links are still rejected. More link endings are also covered.
-- 2. The deal preview only shows a deal's details while it is still
--    waiting for a buyer. Once someone joins, other traders only see
--    "This deal already has a buyer".
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Chat: replace the message checks ------------------------------
--
-- The checks in 010 had no names, so remove every check on messages
-- and add them back with clear names.

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.messages'::regclass and contype = 'c'
  loop
    execute format('alter table public.messages drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table messages
  add constraint messages_body_length
    check (char_length(body) between 1 and 1000),
  -- Remove email addresses first, then look for anything link-like:
  -- http(s)://, www., or a word ending in a common web address ending.
  add constraint messages_body_no_links
    check (
      regexp_replace(body, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
      !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)'
    );

-- 2. Deal preview: details only while waiting for a buyer ----------

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
  select d.id,
         case when d.buyer_id is null then d.title end,
         case when d.buyer_id is null then d.description end,
         case when d.buyer_id is null then d.price end,
         case when d.buyer_id is null then d.seller_id end,
         case when d.buyer_id is null then p.display_name end,
         d.buyer_id is not null
  from public.deals d
  join public.profiles p on p.id = d.seller_id
  where d.id = p_deal_id
    and (select auth.uid()) is not null;
$$;

-- 3. Check ------------------------------------------------------------
-- You should see two rows: messages_body_length and
-- messages_body_no_links.

select conname
from pg_constraint
where conrelid = 'public.messages'::regclass and contype = 'c'
order by conname;
