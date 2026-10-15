-- 021 — remaining fixes from the second code review.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. One "contains a link?" rule, used by every check (it was copied in
--    five places).
-- 2. Rate limits: at most 20 direct messages and 30 Deal Room chat
--    messages per 10 minutes, so nobody can flood someone's inbox and
--    notifications.
-- 3. Re-picking the same payment method does nothing (no extra record
--    line or notification).
-- 4. "Last active" is rounded to the day inside the database, and only
--    counts real trading (an account that never traded shows nothing).
-- 5. At most 5 profile picture files per trader in storage.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. One link rule ------------------------------------------------------
-- Email addresses are removed first: the Lock-In step needs the buyer to
-- send theirs. Mirrors src/lib/links.ts (which only gives a friendly
-- message; this is the real protection).

create or replace function public.contains_link(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(coalesce(p_text, ''), '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '', 'gi')
         ~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\M)';
$$;

alter table messages drop constraint if exists messages_body_no_links;
alter table messages add constraint messages_body_no_links
  check (not public.contains_link(body));

alter table direct_messages drop constraint if exists direct_messages_body_no_links;
alter table direct_messages add constraint direct_messages_body_no_links
  check (not public.contains_link(body));

alter table profiles drop constraint if exists profiles_bio_check;
alter table profiles add constraint profiles_bio_check
  check (char_length(bio) <= 500 and not public.contains_link(bio));

alter table deals drop constraint if exists deals_no_links;
alter table deals add constraint deals_no_links
  check (not public.contains_link(title || ' ' || description));

-- 2. Rate limits ----------------------------------------------------------

drop policy if exists "traders can send direct messages" on direct_messages;
create policy "traders can send direct messages"
  on direct_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and (
      select count(*) from public.direct_messages m
      where m.sender_id = (select auth.uid())
        and m.created_at > now() - interval '10 minutes'
    ) < 20
  );

drop policy if exists "deal traders can send messages" on messages;
create policy "deal traders can send messages"
  on messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.deals d
      where d.id = messages.deal_id
        and d.buyer_id is not null
        and (select auth.uid()) in (d.seller_id, d.buyer_id)
    )
    and (
      select count(*) from public.messages m
      where m.sender_id = (select auth.uid())
        and m.created_at > now() - interval '10 minutes'
    ) < 30
  );

-- 3. Same payment method again = nothing happens ------------------------

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

  -- The deals_payment_method_allowed check (017) rejects unknown methods.
  if p_method is null then
    raise exception 'Unknown payment method.';
  end if;

  if p_method = d.payment_method then
    return;
  end if;

  update public.deals set payment_method = p_method where id = p_deal_id;

  insert into public.deal_events (deal_id, actor_id, action)
  values (p_deal_id, me, 'payment_method_chosen');
end;
$$;

revoke execute on function public.choose_payment_method(uuid, text) from public, anon;
grant execute on function public.choose_payment_method(uuid, text) to authenticated;

-- 4. Suggested traders: last active by the day, trading only -----------
-- Same as 016, except last_active ignores the sign-up date and is
-- rounded to the day, so nobody can see the exact minute someone traded.

create or replace function public.suggested_traders()
returns table (
  id           uuid,
  display_name text,
  bio          text,
  avatar_path  text,
  created_at   timestamptz,
  completed    integer,
  abandoned    integer,
  last_active  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.bio, p.avatar_path, p.created_at,
         r.completed, r.abandoned,
         date_trunc('day', greatest(
           (select max(d.created_at) from public.deals d where d.seller_id = p.id),
           (select max(e.created_at) from public.deal_events e where e.actor_id = p.id)
         )) as last_active
  from public.profiles p
  cross join lateral public.trader_record(p.id) r
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
  order by r.completed desc, last_active desc nulls last, p.created_at desc
  limit 30;
$$;

revoke execute on function public.suggested_traders() from public, anon;
grant execute on function public.suggested_traders() to authenticated;

-- 5. At most 5 profile picture files per trader -------------------------

drop policy if exists "traders can upload their own avatar" on storage.objects;
create policy "traders can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'avatars'
        and (storage.foldername(o.name))[1] = (select auth.uid())::text
    ) < 5
  );

-- 6. Check ------------------------------------------------------------
-- You should see four rows, all with validated = true.

select conname, convalidated as validated
from pg_constraint
where conname in ('messages_body_no_links', 'direct_messages_body_no_links',
                  'profiles_bio_check', 'deals_no_links')
order by conname;
