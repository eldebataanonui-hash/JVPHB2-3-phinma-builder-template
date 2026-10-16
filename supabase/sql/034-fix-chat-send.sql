-- 034 — fix: sending chat messages and direct messages failed.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Problem: in 021 the "send" rules for Deal Room chat and direct messages
-- counted a trader's recent messages by looking inside the same table the
-- rule protects. Postgres refuses a rule that looks inside its own table
-- ("infinite recursion detected in policy"), so every send failed with
-- "Something went wrong". This is the same mistake that broke photo
-- uploads, fixed for photos in 025.
--
-- Fix: the counting moves into small helper functions (they run with the
-- database's own permissions, so the rule never looks inside its own
-- table). The limits are unchanged: at most 30 Deal Room messages and 20
-- direct messages per 10 minutes.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Helpers: how many messages did this trader send in the last 10 minutes?

create or replace function public.recent_chat_count(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.messages m
  where m.sender_id = p_user
    and m.created_at > now() - interval '10 minutes';
$$;

create or replace function public.recent_direct_message_count(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.direct_messages m
  where m.sender_id = p_user
    and m.created_at > now() - interval '10 minutes';
$$;

revoke execute on function public.recent_chat_count(uuid) from public, anon;
grant execute on function public.recent_chat_count(uuid) to authenticated;
revoke execute on function public.recent_direct_message_count(uuid) from public, anon;
grant execute on function public.recent_direct_message_count(uuid) to authenticated;

-- 2. Deal Room chat: same rules as 021, counted by the helper -------------

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
    and public.recent_chat_count((select auth.uid())) < 30
  );

-- 3. Direct messages: same rules as 021, counted by the helper ------------

drop policy if exists "traders can send direct messages" on direct_messages;
create policy "traders can send direct messages"
  on direct_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and public.recent_direct_message_count((select auth.uid())) < 20
  );

-- 4. Check ------------------------------------------------------------
-- You should see two rows, both INSERT for {authenticated}.

select tablename, policyname, cmd, roles
from pg_policies
where policyname in ('deal traders can send messages', 'traders can send direct messages')
order by tablename;
