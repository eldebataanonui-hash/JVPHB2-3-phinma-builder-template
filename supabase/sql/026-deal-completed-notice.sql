-- 026 — tell BOTH traders when a deal is completed.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Before: the last step ("second half arrived") is confirmed by the
-- seller, so only the buyer got a notification. Now, the moment a deal
-- becomes completed, the database notifies the seller AND the buyer
-- ("Deal completed: your trade receipt is ready"). The old last-step
-- notification is skipped so the buyer doesn't get two.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Notify both traders when a deal becomes completed ------------------

create or replace function public.notify_deal_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.step = 'completed' and old.step is distinct from 'completed'
     and new.buyer_id is not null then
    insert into public.notifications (user_id, actor_id, kind, deal_id)
    values
      (new.seller_id, new.buyer_id,  'deal_completed', new.id),
      (new.buyer_id,  new.seller_id, 'deal_completed', new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_deal_completed() from public, anon, authenticated;

drop trigger if exists on_deal_completed_notify on deals;
create trigger on_deal_completed_notify
  after update of step on deals
  for each row execute function public.notify_deal_completed();

-- 2. Skip the old last-step notice (replaced by "Deal completed") ------
-- Same as 019, plus the skip.

create or replace function public.notify_deal_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d     public.deals%rowtype;
  other uuid;
begin
  if new.action = 'second_half_received' then
    return new;
  end if;

  select * into d from public.deals where id = new.deal_id;
  other := case when new.actor_id = d.seller_id then d.buyer_id else d.seller_id end;
  if other is not null and other <> new.actor_id then
    insert into public.notifications (user_id, actor_id, kind, deal_id)
    values (other, new.actor_id, new.action, new.deal_id);
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_deal_event() from public, anon, authenticated;

-- 3. Check ------------------------------------------------------------
-- You should see one row: on_deal_completed_notify.

select tgname from pg_trigger where tgname = 'on_deal_completed_notify';
