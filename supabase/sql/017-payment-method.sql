-- 017 — payment method: the buyer picks how they'll pay.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- AQTech GHub never moves money. This only records WHICH e-wallet or
-- bank the buyer will use, so the seller knows which app to check.
--
-- 1. deals.payment_method, one of a fixed list.
-- 2. choose_payment_method(): only the buyer, only before the first half
--    is sent. The choice goes into the record.
-- 3. advance_deal() won't accept "I've sent the first half" until a
--    method has been chosen.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The column -------------------------------------------------------

alter table deals
  add column if not exists payment_method text;

alter table deals drop constraint if exists deals_payment_method_allowed;
alter table deals
  add constraint deals_payment_method_allowed check (
    payment_method is null
    or payment_method in ('gcash', 'maya', 'maribank', 'gotyme', 'shopeepay', 'instapay')
  );

-- Traders can't set it directly (014 only grants insert of title,
-- description and price). Only the function below can.

-- 2. The record can say "chose a payment method" ----------------------

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.deal_events'::regclass and contype = 'c'
  loop
    execute format('alter table public.deal_events drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table deal_events
  add constraint deal_events_action_allowed check (action in (
    'buyer_joined',
    'payment_method_chosen',
    'code_placed',
    'code_confirmed',
    'first_half_sent',
    'first_half_received',
    'lock_in_done',
    'full_control_confirmed',
    'second_half_sent',
    'second_half_received'
  ));

-- 3. Choosing a method ------------------------------------------------

create or replace function public.choose_payment_method(p_deal_id uuid, p_method text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d  public.deals%rowtype;
  me uuid := (select auth.uid());
begin
  select * into d from public.deals where id = p_deal_id for update;

  if not found or me is null or me is distinct from d.buyer_id then
    raise exception 'Only the buyer can choose the payment method.';
  end if;

  if d.step <> 'awaiting_first_payment' then
    raise exception 'The payment method can only be chosen before the first half is sent.';
  end if;

  if p_method is null
     or p_method not in ('gcash', 'maya', 'maribank', 'gotyme', 'shopeepay', 'instapay') then
    raise exception 'Unknown payment method.';
  end if;

  update public.deals set payment_method = p_method where id = p_deal_id;

  insert into public.deal_events (deal_id, actor_id, action)
  values (p_deal_id, me, 'payment_method_chosen');
end;
$$;

revoke execute on function public.choose_payment_method(uuid, text) from public, anon;
grant execute on function public.choose_payment_method(uuid, text) to authenticated;

-- 4. advance_deal: no "first half sent" without a method ---------------
-- Same as 014, plus the payment method check.

create or replace function public.advance_deal(p_deal_id uuid, p_from_step text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d          public.deals%rowtype;
  me         uuid := (select auth.uid());
  actor_role text;
  act        text;
  next_step  text;
begin
  select * into d from public.deals where id = p_deal_id for update;

  if not found or me is null or me not in (d.seller_id, d.buyer_id) then
    raise exception 'Deal not found.';
  end if;

  if d.step is distinct from p_from_step then
    raise exception 'This step was already done. Refresh the page.';
  end if;

  if d.step = 'awaiting_first_payment' and d.payment_method is null then
    raise exception 'Choose a payment method first.';
  end if;

  case d.step
    when 'awaiting_code'           then actor_role := 'seller'; act := 'code_placed';            next_step := 'code_placed';
    when 'code_placed'             then actor_role := 'buyer';  act := 'code_confirmed';         next_step := 'awaiting_first_payment';
    when 'awaiting_first_payment'  then actor_role := 'buyer';  act := 'first_half_sent';        next_step := 'first_payment_sent';
    when 'first_payment_sent'      then actor_role := 'seller'; act := 'first_half_received';    next_step := 'awaiting_lock_in';
    when 'awaiting_lock_in'        then actor_role := 'seller'; act := 'lock_in_done';           next_step := 'lock_in_done';
    when 'lock_in_done'            then actor_role := 'buyer';  act := 'full_control_confirmed'; next_step := 'awaiting_second_payment';
    when 'awaiting_second_payment' then actor_role := 'buyer';  act := 'second_half_sent';       next_step := 'second_payment_sent';
    when 'second_payment_sent'     then actor_role := 'seller'; act := 'second_half_received';   next_step := 'completed';
    else raise exception 'This deal has no next step.';
  end case;

  if (actor_role = 'seller' and me <> d.seller_id)
     or (actor_role = 'buyer' and me is distinct from d.buyer_id) then
    raise exception 'It''s not your turn.';
  end if;

  update public.deals
     set step         = next_step,
         completed_at = case when next_step = 'completed' then now() else null end
   where id = p_deal_id;

  insert into public.deal_events (deal_id, actor_id, action)
  values (p_deal_id, me, act);
end;
$$;

-- 5. Check ------------------------------------------------------------
-- You should see two rows: deal_events_action_allowed and
-- deals_payment_method_allowed.

select conname
from pg_constraint
where conname in ('deal_events_action_allowed', 'deals_payment_method_allowed')
order by conname;
