-- 005 — repair the profiles read policy.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- The read policy from 002 had been changed in the dashboard to apply
-- to ALL actions, for everyone, with no condition, which lets nothing
-- through: nobody could read any profile. This puts it back exactly as
-- 002 intended. Safe to run more than once.
--
-- Rule for the team: change policies only through numbered SQL files
-- like this one, never by hand in the dashboard.

drop policy if exists "logged-in traders can read profiles" on profiles;

create policy "logged-in traders can read profiles"
  on profiles for select
  to authenticated
  using (true);

-- Check: you should see exactly three rows: SELECT, INSERT, UPDATE,
-- all for {authenticated}.
select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'profiles';
