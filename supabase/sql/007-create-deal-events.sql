-- 007 — deal_events: the timestamped record, and the step function
-- that moves a deal forward.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists deal_events (
  id         bigint      generated always as identity primary key,
  deal_id    uuid        not null references deals(id) on delete cascade,
  actor_id   uuid        not null references profiles(id),
  -- What the trader confirmed.
  action     text        not null check (action in (
               'buyer_joined',
               'code_placed',
               'code_confirmed',
               'first_half_sent',
               'first_half_received',
               'lock_in_done',
               'full_control_confirmed',
               'second_half_sent',
               'second_half_received'
             )),
  created_at timestamptz not null default now()
);

-- 2. Nobody writes to the record directly ---------------------------
--
-- Rows are only ever added by the functions below. Nobody can edit or
-- delete them, which is what makes the record useful as proof.

revoke insert, update, delete on deal_events from anon, authenticated;

-- 3. Row Level Security --------------------------------------------

alter table deal_events enable row level security;

-- Only the seller and the buyer of the deal may read its record.
create policy "traders can read the record of their own deals"
  on deal_events for select
  to authenticated
  using (
    exists (
      select 1 from deals d
      where d.id = deal_events.deal_id
        and (select auth.uid()) in (d.seller_id, d.buyer_id)
    )
  );

-- Deliberately NO insert, update or delete policy.

-- 4. Joining is now recorded too -----------------------------------
--
-- Same as 006's join_deal, plus a 'buyer_joined' row in the record.

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

  insert into public.deal_events (deal_id, actor_id, action)
  values (p_deal_id, (select auth.uid()), 'buyer_joined');
end;
$$;

-- 5. Advance a deal one step ---------------------------------------
--
-- p_from_step is the step the trader saw when they tapped the button.
-- If the deal has already moved on (say, a double tap), nothing
-- happens twice.
--
--   step                     who acts   recorded as             next step
--   awaiting_code            seller     code_placed             code_placed
--   code_placed              buyer      code_confirmed          awaiting_first_payment
--   awaiting_first_payment   buyer      first_half_sent         first_payment_sent
--   first_payment_sent       seller     first_half_received     awaiting_lock_in
--   awaiting_lock_in         seller     lock_in_done            lock_in_done
--   lock_in_done             buyer      full_control_confirmed  awaiting_second_payment
--   awaiting_second_payment  buyer      second_half_sent        second_payment_sent
--   second_payment_sent      seller     second_half_received    completed

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
  -- Lock the deal so two taps at once can't both go through.
  select * into d from public.deals where id = p_deal_id for update;

  if not found or me is null or me not in (d.seller_id, d.buyer_id) then
    raise exception 'Deal not found.';
  end if;

  if d.step <> p_from_step then
    raise exception 'This step was already done. Refresh the page.';
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

revoke execute on function public.advance_deal(uuid, text) from public, anon;
grant execute on function public.advance_deal(uuid, text) to authenticated;

-- 6. Check ------------------------------------------------------------
-- You should see one row: SELECT for {authenticated}.

select policyname, cmd, roles
from pg_policies
where tablename = 'deal_events';
