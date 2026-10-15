-- 011 — lock down what traders can write to their own profile.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Found in code review: the update policy from 002 let a trader change
-- ANY column of their own profile, including created_at. The Find
-- traders page tells buyers to use the join date to spot copycats, so a
-- scammer could make a new account look years old.
--
-- After this, traders can only read profiles and create their own with
-- an id and display name. Nobody can change a profile through the
-- website (there is no edit screen). The sign-up trigger from 003 still
-- works: it runs as the database owner, not as the trader.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Start from nothing, then grant only what the app needs --------

revoke all on profiles from anon, authenticated;
grant select on profiles to authenticated;
grant insert (id, display_name) on profiles to authenticated;

-- 2. The update policy is no longer needed --------------------------

drop policy if exists "traders can update their own profile" on profiles;

-- 3. Check ------------------------------------------------------------
-- You should see two rows, both for {authenticated}: SELECT and INSERT.

select policyname, cmd, roles
from pg_policies
where tablename = 'profiles';
