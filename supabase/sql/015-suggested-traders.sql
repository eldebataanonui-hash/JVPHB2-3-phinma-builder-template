-- 015 — suggested_traders: who to show on Find traders before you
-- search.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Returns up to 30 other traders, most trusted and most active first:
--   1. most completed deals
--   2. most recent trading activity (created a deal or confirmed a step)
--   3. newest account
--
-- It returns only what a Profile already shows (name, description,
-- join date, deal record) plus "last active". Last active only counts
-- trading actions, never messages. Deals themselves stay private.

create or replace function public.suggested_traders()
returns table (
  id          uuid,
  display_name text,
  bio         text,
  created_at  timestamptz,
  completed   integer,
  abandoned   integer,
  last_active timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.bio, p.created_at,
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
