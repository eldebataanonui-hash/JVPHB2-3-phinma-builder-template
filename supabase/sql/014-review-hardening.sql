-- 014 — the remaining safety fixes from the code review.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. Display names can't impersonate the team ("Admin", "AQTech GHub
--    Team", "Support"...) and must contain at least one letter or digit
--    (no blank-looking names made of invisible characters).
-- 2. Deal titles and descriptions can't contain links, like chat.
-- 3. Old default permissions on the deal tables are cleared, then only
--    what the app needs is granted back.
-- 4. advance_deal treats a missing step value as "wrong step".
--
-- "not valid" on the new checks means: enforce them for every new or
-- changed row, but don't fail on rows that already exist.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Display names ----------------------------------------------------

alter table profiles drop constraint if exists profiles_display_name_allowed;
alter table profiles
  add constraint profiles_display_name_allowed check (
    display_name ~ '[[:alnum:]]'
    and display_name !~* '(aqtech|ghub|admin|moderator|support|official|staff)'
  ) not valid;

-- The sign-up trigger falls back to "Trader" for a name that isn't
-- allowed, so confirming an email can never fail because of the name.
create or replace function public.create_profile_for_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 40);
begin
  if new.email_confirmed_at is not null then
    if wanted !~ '[[:alnum:]]'
       or wanted ~* '(aqtech|ghub|admin|moderator|support|official|staff)' then
      wanted := 'Trader';
    end if;

    insert into public.profiles (id, display_name)
    values (new.id, wanted)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.create_profile_for_confirmed_user() from public, anon, authenticated;

-- 2. No links in deal titles or descriptions -------------------------

alter table deals drop constraint if exists deals_no_links;
alter table deals
  add constraint deals_no_links check (
    regexp_replace(title || ' ' || description, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
    !~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)'
  ) not valid;

-- 3. Clear default permissions, grant back only what's needed ---------

revoke all on deals from anon, authenticated;
grant select on deals to authenticated;
grant insert (title, description, price) on deals to authenticated;

revoke all on deal_events from anon, authenticated;
grant select on deal_events to authenticated;

revoke all on concerns from anon, authenticated;
grant select on concerns to authenticated;
grant insert (deal_id, message) on concerns to authenticated;

revoke all on messages from anon, authenticated;
grant select on messages to authenticated;
grant insert (deal_id, body) on messages to authenticated;

-- 4. advance_deal: a missing step counts as the wrong step -----------
-- Same as 007, except "is distinct from" instead of "<>", because
-- "<>" with a missing value is neither true nor false and skipped the
-- check.

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
-- You should see two rows: deals_no_links and
-- profiles_display_name_allowed.

select conname
from pg_constraint
where conname in ('deals_no_links', 'profiles_display_name_allowed')
order by conname;
