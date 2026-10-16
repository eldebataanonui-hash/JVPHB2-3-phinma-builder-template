-- 029 — fixes from the fourth code review (login details).
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- 1. Replacing the login details no longer notifies the buyer again or
--    adds another line to the record: only the FIRST send is recorded.
--    (Replacing still updates the encrypted details.)
-- 2. If a deal_credentials row is ever deleted, for any reason, its
--    encrypted Vault secret is deleted too, so no orphaned logins stay
--    behind.
--
-- Note: the current, canonical advance_deal is the one in 027.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. Send once, replace quietly -------------------------------------------
-- Same as 027, except the record line (and so the notification) is only
-- added the first time.

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

    -- First send only: recorded, and the buyer is notified.
    insert into public.deal_events (deal_id, actor_id, action)
    values (p_deal_id, me, 'credentials_sent');
  else
    perform vault.update_secret(existing, payload);
    update public.deal_credentials set submitted_at = now() where deal_id = p_deal_id;
  end if;
end;
$$;

revoke execute on function public.submit_credentials(uuid, text, text, text) from public, anon;
grant execute on function public.submit_credentials(uuid, text, text, text) to authenticated;

-- 2. Deleting a credentials row also deletes its Vault secret -----------

create or replace function public.delete_vault_secret_for_credentials()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end;
$$;

revoke execute on function public.delete_vault_secret_for_credentials() from public, anon, authenticated;

drop trigger if exists on_deal_credentials_deleted on deal_credentials;
create trigger on_deal_credentials_deleted
  after delete on deal_credentials
  for each row execute function public.delete_vault_secret_for_credentials();

-- 3. Check ------------------------------------------------------------
-- You should see one row: on_deal_credentials_deleted.

select tgname from pg_trigger where tgname = 'on_deal_credentials_deleted';
