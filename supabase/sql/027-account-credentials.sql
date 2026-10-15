-- 027 — the seller sends the account's login details to the buyer.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- The team chose to let sellers send the listed account's login and
-- password inside the Deal Room. To keep that as safe as possible:
--   * The details are ENCRYPTED in Supabase Vault (Supabase's built-in
--     encrypted secrets store). No table holds them as plain text.
--   * Only the seller can send them, and only at the handover step
--     (after the first half has arrived).
--   * Only the buyer can read them, while the deal is between the
--     handover step and completion.
--   * They are DELETED automatically when the deal is completed.
--   * The seller can't finish the handover step without sending them.
--   * The buyer is notified; the notification never contains them.
-- The seller still knows the password, so the buyer must change it and
-- move the bound email straight away (the Lock-In steps).
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 0. Supabase Vault must be available (it is on by default) -----------

create extension if not exists supabase_vault;

-- 1. Which deal's details are stored where -----------------------------
-- Only the id of the encrypted Vault secret is kept here. Nobody can
-- read or write this table directly: only the functions below.

create table if not exists deal_credentials (
  deal_id      uuid        primary key references deals(id) on delete cascade,
  secret_id    uuid        not null,
  submitted_at timestamptz not null default now()
);

revoke all on deal_credentials from anon, authenticated;
alter table deal_credentials enable row level security;
-- Deliberately NO policies: no direct access for any trader.

-- 2. The record can say "sent the login details" ------------------------

alter table deal_events drop constraint if exists deal_events_action_allowed;
alter table deal_events
  add constraint deal_events_action_allowed check (action in (
    'buyer_joined',
    'payment_method_chosen',
    'code_placed',
    'code_confirmed',
    'first_half_sent',
    'first_half_received',
    'credentials_sent',
    'lock_in_done',
    'full_control_confirmed',
    'second_half_sent',
    'second_half_received'
  ));

-- 3. Seller sends (or replaces) the details -----------------------------

create or replace function public.submit_credentials(
  p_deal_id uuid, p_login text, p_password text, p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d        public.deals%rowtype;
  me       uuid := (select auth.uid());
  existing uuid;
  payload  text;
begin
  select * into d from public.deals where id = p_deal_id for update;

  if not found or me is null or me <> d.seller_id then
    raise exception 'Only the seller can send the login details.';
  end if;

  if d.step <> 'awaiting_lock_in' then
    raise exception 'Login details can only be sent at the handover step.';
  end if;

  if coalesce(trim(p_login), '') = '' or coalesce(p_password, '') = ''
     or char_length(p_login) > 200 or char_length(p_password) > 200
     or char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Login details are missing or too long.';
  end if;

  payload := json_build_object(
    'login', trim(p_login), 'password', p_password, 'note', coalesce(trim(p_note), '')
  )::text;

  select secret_id into existing from public.deal_credentials where deal_id = p_deal_id;

  if existing is null then
    insert into public.deal_credentials (deal_id, secret_id)
    values (p_deal_id, vault.create_secret(payload, 'deal-' || p_deal_id::text, 'Account login for a deal'));
  else
    perform vault.update_secret(existing, payload);
    update public.deal_credentials set submitted_at = now() where deal_id = p_deal_id;
  end if;

  -- Recorded and notified (the notification never contains the details).
  insert into public.deal_events (deal_id, actor_id, action)
  values (p_deal_id, me, 'credentials_sent');
end;
$$;

revoke execute on function public.submit_credentials(uuid, text, text, text) from public, anon;
grant execute on function public.submit_credentials(uuid, text, text, text) to authenticated;

-- 4. Buyer reads the details --------------------------------------------

create or replace function public.read_credentials(p_deal_id uuid)
returns table (login text, password text, note text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  d      public.deals%rowtype;
  secret text;
begin
  select * into d from public.deals where id = p_deal_id;

  if not found or (select auth.uid()) is distinct from d.buyer_id then
    raise exception 'Only the buyer can see the login details.';
  end if;

  if d.step not in ('awaiting_lock_in', 'lock_in_done', 'awaiting_second_payment', 'second_payment_sent') then
    raise exception 'The login details are not available at this step.';
  end if;

  select s.decrypted_secret into secret
  from public.deal_credentials c
  join vault.decrypted_secrets s on s.id = c.secret_id
  where c.deal_id = p_deal_id;

  if secret is null then
    raise exception 'The seller has not sent the login details yet.';
  end if;

  return query
    select secret::json ->> 'login', secret::json ->> 'password', secret::json ->> 'note';
end;
$$;

revoke execute on function public.read_credentials(uuid) from public, anon;
grant execute on function public.read_credentials(uuid) to authenticated;

-- 5. Delete the details when the deal is completed ----------------------

create or replace function public.delete_credentials_on_complete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid uuid;
begin
  if new.step = 'completed' and old.step is distinct from 'completed' then
    delete from public.deal_credentials where deal_id = new.id returning secret_id into sid;
    if sid is not null then
      delete from vault.secrets where id = sid;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.delete_credentials_on_complete() from public, anon, authenticated;

drop trigger if exists on_deal_completed_delete_credentials on deals;
create trigger on_deal_completed_delete_credentials
  after update of step on deals
  for each row execute function public.delete_credentials_on_complete();

-- 6. advance_deal: no "handover done" without the login details ------
-- Same as 017, plus that check.

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

  if d.step = 'awaiting_lock_in'
     and not exists (select 1 from public.deal_credentials c where c.deal_id = p_deal_id) then
    raise exception 'Send the login details first.';
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

-- 7. Check ------------------------------------------------------------
-- You should see three rows: vault available = true, deal_credentials
-- locked (no policies) = 0, and the delete trigger.

select 'vault available' as what,
       exists (select 1 from pg_extension where extname = 'supabase_vault')::text as result
union all
select 'deal_credentials policies (should be 0)',
       (select count(*) from pg_policies where tablename = 'deal_credentials')::text
union all
select 'delete-on-complete trigger',
       (select tgname from pg_trigger where tgname = 'on_deal_completed_delete_credentials');
