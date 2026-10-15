-- 008 — trader_record: how many deals a trader has completed and
-- abandoned, as seller or buyer.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Why a function: deals are private to their two traders, so a buyer
-- can't count a seller's deals themselves. This function counts them
-- and returns only the two numbers, never the deals.
--
-- Completed: the deal reached 'completed'.
-- Abandoned: a buyer joined, but the deal wasn't completed within 3 days
--            of joining. Deals still inside those 3 days don't count
--            either way, so traders aren't penalised mid-trade.

create or replace function public.trader_record(p_trader_id uuid)
returns table (completed integer, abandoned integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where d.step = 'completed')::integer,
    count(*) filter (
      where d.step <> 'completed'
        and d.buyer_id is not null
        and coalesce(
              (select min(e.created_at) from public.deal_events e
                where e.deal_id = d.id and e.action = 'buyer_joined'),
              d.created_at
            ) < now() - interval '3 days'
    )::integer
  from public.deals d
  where p_trader_id in (d.seller_id, d.buyer_id)
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.trader_record(uuid) from public, anon;
grant execute on function public.trader_record(uuid) to authenticated;
