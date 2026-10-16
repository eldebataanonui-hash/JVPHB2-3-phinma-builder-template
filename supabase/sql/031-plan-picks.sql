-- 031 — plan picks: a trader can pick the plan they'd subscribe to.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- No payments are taken. This only saves which plan you picked, so you
-- can see it on the Plans page and the team can see which plans people
-- want. One pick per trader; change it or remove it any time.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists plan_picks (
  user_id   uuid        primary key default auth.uid() references profiles(id) on delete cascade,
  plan      text        not null check (plan in ('monthly', 'biannual', 'annual')),
  picked_at timestamptz not null default now()
);

-- You can only send the plan; the database fills in who and when.
revoke all on plan_picks from anon, authenticated;
grant select, delete on plan_picks to authenticated;
grant insert (plan), update (plan, picked_at) on plan_picks to authenticated;
alter table plan_picks enable row level security;

-- 2. Rules: your own pick only ----------------------------------------

drop policy if exists "read your own plan pick" on plan_picks;
create policy "read your own plan pick"
  on plan_picks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "pick a plan for yourself" on plan_picks;
create policy "pick a plan for yourself"
  on plan_picks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "change your own plan pick" on plan_picks;
create policy "change your own plan pick"
  on plan_picks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "remove your own plan pick" on plan_picks;
create policy "remove your own plan pick"
  on plan_picks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. How many traders picked each plan (counts only, no names) -----------

create or replace function public.plan_pick_counts()
returns table (plan text, picks integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.plan, count(*)::integer
  from public.plan_picks p
  where (select auth.uid()) is not null
  group by p.plan;
$$;

revoke execute on function public.plan_pick_counts() from public, anon;
grant execute on function public.plan_pick_counts() to authenticated;

-- 4. Check ------------------------------------------------------------
-- You should see four rows: SELECT, INSERT, UPDATE and DELETE, each {authenticated}.

select policyname, cmd, roles from pg_policies where tablename = 'plan_picks' order by cmd;
