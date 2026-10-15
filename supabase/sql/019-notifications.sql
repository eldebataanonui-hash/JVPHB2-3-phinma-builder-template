-- 019 — notifications: tell the other person when something happens.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- The database creates notifications itself (with triggers), so nobody
-- can fake one. You can only read your own, and the only thing you can
-- change is marking them as read.
--
-- A notification is created when:
--   * a step is confirmed in a deal (joined, code placed, half sent...)
--     -> for the OTHER trader in that deal
--   * someone writes in a Deal Room chat -> for the other trader
--   * someone sends you a direct message -> for you
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists notifications (
  id         bigint      generated always as identity primary key,
  -- Who the notification is for.
  user_id    uuid        not null references profiles(id) on delete cascade,
  -- Who did the thing.
  actor_id   uuid        not null references profiles(id) on delete cascade,
  -- What happened: a deal step (same names as deal_events.action),
  -- 'deal_message' or 'direct_message'.
  kind       text        not null,
  deal_id    uuid        references deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index if not exists notifications_user_unread_idx
  on notifications (user_id, read_at, id desc);

-- Traders may read their own notifications and set read_at. Nothing
-- else: rows are only created by the triggers below.
revoke all on notifications from anon, authenticated;
grant select on notifications to authenticated;
grant update (read_at) on notifications to authenticated;

alter table notifications enable row level security;

drop policy if exists "traders can read their own notifications" on notifications;
create policy "traders can read their own notifications"
  on notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "traders can mark their own notifications read" on notifications;
create policy "traders can mark their own notifications read"
  on notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Deliberately NO insert or delete policy.

-- 2. Deal steps -> notify the other trader ---------------------------

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

drop trigger if exists on_deal_event_notify on deal_events;
create trigger on_deal_event_notify
  after insert on deal_events
  for each row execute function public.notify_deal_event();

-- 3. Deal Room chat -> notify the other trader ------------------------

create or replace function public.notify_deal_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d     public.deals%rowtype;
  other uuid;
begin
  select * into d from public.deals where id = new.deal_id;
  other := case when new.sender_id = d.seller_id then d.buyer_id else d.seller_id end;
  if other is not null and other <> new.sender_id then
    insert into public.notifications (user_id, actor_id, kind, deal_id)
    values (other, new.sender_id, 'deal_message', new.deal_id);
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_deal_message() from public, anon, authenticated;

drop trigger if exists on_deal_message_notify on messages;
create trigger on_deal_message_notify
  after insert on messages
  for each row execute function public.notify_deal_message();

-- 4. Direct messages -> notify the recipient --------------------------

create or replace function public.notify_direct_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, actor_id, kind)
  values (new.recipient_id, new.sender_id, 'direct_message');
  return new;
end;
$$;

revoke execute on function public.notify_direct_message() from public, anon, authenticated;

drop trigger if exists on_direct_message_notify on direct_messages;
create trigger on_direct_message_notify
  after insert on direct_messages
  for each row execute function public.notify_direct_message();

-- 5. Check ------------------------------------------------------------
-- You should see two rows for notifications (SELECT and UPDATE, both
-- {authenticated}) and three triggers.

select 'policy' as what, policyname as name, cmd
from pg_policies where tablename = 'notifications'
union all
select 'trigger', tgname, ''
from pg_trigger
where tgname in ('on_deal_event_notify', 'on_deal_message_notify', 'on_direct_message_notify')
order by what, name;
