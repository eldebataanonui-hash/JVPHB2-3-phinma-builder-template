-- 018 — deal codes: share a short code instead of a link.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Links are blocked in Messages and chat (they're how phishing works),
-- which also blocked sellers sharing their own Deal Room link. Every
-- deal now has a short code like JOIN-7F3K9B2A. The buyer types it on
-- "Join a deal" and lands on the deal preview.
--
-- The deal code is NOT the ownership code (AQ-...). The ownership code
-- still only proves the seller controls the MLBB account.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The code: made by the database, unique, 8 characters ------------
-- Existing deals get a code too: the default runs once for each row.

alter table deals
  add column if not exists join_code text not null
  default ('JOIN-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)));

create unique index if not exists deals_join_code_key on deals (join_code);

-- Traders still can't set it themselves: 014 only grants insert of
-- title, description and price.

-- 2. Find a deal by its code -----------------------------------------
-- Returns only the deal's id; the Deal Room page then decides what you
-- may see (the preview, or "already has a buyer"). Logged-in only.

create or replace function public.deal_id_for_code(p_code text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.deals d
  where d.join_code = upper(trim(p_code))
    and (select auth.uid()) is not null;
$$;

revoke execute on function public.deal_id_for_code(text) from public, anon;
grant execute on function public.deal_id_for_code(text) to authenticated;

-- 3. Check ------------------------------------------------------------
-- You should see one row per deal, each with its own JOIN- code.

select title, join_code from deals order by created_at;
