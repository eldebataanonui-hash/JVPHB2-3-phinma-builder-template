-- 028 — optional ID verification (demo) through Didit.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Didit's hosted page checks an ID photo, a live selfie and that the
-- face matches the ID. AQTech GHub never sees or stores the ID photo, ID
-- number or face scan: we only keep the result.
--   * profiles.id_verified_at: when the trader's ID was approved (shown
--     as an "ID verified (demo)" badge; readable like the rest of a
--     profile; traders can't set it themselves).
--   * kyc_checks: the latest Didit session and status per trader. Each
--     trader can read only their own; nobody can write it directly.
--   * record_kyc_result(): the ONLY way to save a result. It needs a
--     secret that only the server knows (stored encrypted in Vault, see
--     the separate one-off step in the instructions), so nobody can give
--     themselves a badge.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The badge on the profile -------------------------------------------

alter table profiles add column if not exists id_verified_at timestamptz;
-- No grant: traders can read it (011 grants select) but never update it.

-- 2. Private verification status ------------------------------------------

create table if not exists kyc_checks (
  user_id    uuid        primary key references profiles(id) on delete cascade,
  session_id text        not null,
  status     text        not null,
  updated_at timestamptz not null default now()
);

revoke all on kyc_checks from anon, authenticated;
grant select on kyc_checks to authenticated;
alter table kyc_checks enable row level security;

drop policy if exists "traders can read their own verification" on kyc_checks;
create policy "traders can read their own verification"
  on kyc_checks for select
  to authenticated
  using ((select auth.uid()) = user_id);
-- Deliberately NO insert, update or delete policy.

-- 3. Saving a result: only with the server's secret -------------------

create or replace function public.record_kyc_result(
  p_secret text, p_user_id uuid, p_session_id text, p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
begin
  select decrypted_secret into expected
  from vault.decrypted_secrets where name = 'kyc_record_secret';

  if expected is null or p_secret is distinct from expected then
    raise exception 'Not allowed.';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Unknown trader.';
  end if;

  insert into public.kyc_checks (user_id, session_id, status, updated_at)
  values (p_user_id, left(p_session_id, 100), left(p_status, 40), now())
  on conflict (user_id) do update
    set session_id = excluded.session_id,
        status     = excluded.status,
        updated_at = now();

  if p_status = 'Approved' then
    update public.profiles set id_verified_at = now() where id = p_user_id;
  elsif p_status in ('Declined', 'Kyc Expired') then
    update public.profiles set id_verified_at = null where id = p_user_id;
  end if;
end;
$$;

-- The server calls this without a logged-in user (from Didit's webhook),
-- so anon may call it; the secret check is what protects it.
revoke execute on function public.record_kyc_result(text, uuid, text, text) from public;
grant execute on function public.record_kyc_result(text, uuid, text, text) to anon, authenticated;

-- 4. Check ------------------------------------------------------------
-- You should see: the id_verified_at column, one policy on kyc_checks,
-- and whether the server secret has been stored yet (do the one-off step
-- from the instructions if it says false).

select 'id_verified_at column' as what,
       exists (select 1 from information_schema.columns
               where table_name = 'profiles' and column_name = 'id_verified_at')::text as result
union all
select 'kyc_checks policies', (select count(*) from pg_policies where tablename = 'kyc_checks')::text
union all
select 'server secret stored',
       exists (select 1 from vault.secrets where name = 'kyc_record_secret')::text;
