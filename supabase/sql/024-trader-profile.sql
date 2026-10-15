-- 024 — richer trader profiles: stats and "Selling now".
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Deals are private to their two traders, so other traders can't count
-- or list them directly. These functions return only safe summaries:
--   * trader_stats: deals completed as seller and as buyer, abandoned
--     deals, and last active (rounded to the day, trading only)
--   * open_deals: a seller's deals still waiting for a buyer (title,
--     price, when listed). Never the ownership code, never deals that
--     already have a buyer.
-- Both need a logged-in trader.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

create or replace function public.trader_stats(p_trader_id uuid)
returns table (
  completed_as_seller integer,
  completed_as_buyer  integer,
  abandoned           integer,
  last_active         timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.deals d
      where d.seller_id = p_trader_id and d.step = 'completed')::integer,
    (select count(*) from public.deals d
      where d.buyer_id = p_trader_id and d.step = 'completed')::integer,
    (select r.abandoned from public.trader_record(p_trader_id) r),
    date_trunc('day', greatest(
      (select max(d.created_at) from public.deals d where d.seller_id = p_trader_id),
      (select max(e.created_at) from public.deal_events e where e.actor_id = p_trader_id)
    ))
  where (select auth.uid()) is not null;
$$;

revoke execute on function public.trader_stats(uuid) from public, anon;
grant execute on function public.trader_stats(uuid) to authenticated;

create or replace function public.open_deals(p_seller_id uuid)
returns table (id uuid, title text, price integer, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.title, d.price, d.created_at
  from public.deals d
  where d.seller_id = p_seller_id
    and d.buyer_id is null
    and d.step = 'waiting_for_buyer'
    and (select auth.uid()) is not null
  order by d.created_at desc
  limit 12;
$$;

revoke execute on function public.open_deals(uuid) from public, anon;
grant execute on function public.open_deals(uuid) to authenticated;
