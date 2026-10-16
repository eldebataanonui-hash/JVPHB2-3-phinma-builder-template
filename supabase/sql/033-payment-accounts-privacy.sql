-- 033 — payment accounts: show numbers later, and only what's needed.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- Fixes a privacy gap found in code review of 032: anyone logged in could
-- join a seller's open deal as buyer and immediately read the seller's
-- whole list of payment numbers (and a fake listing could do the same to
-- a buyer). Now:
--   * Numbers are shown only at the payment steps, which come after the
--     live ownership code has been placed and confirmed.
--   * The buyer, while choosing how to pay, sees the seller's accounts so
--     they can pick a method. Once a method is chosen, both traders see
--     only the other trader's account for that method.
--   * Nothing is shown at other steps, or after the deal completes.
-- Also: duplicate numbers written differently count as the same account,
-- the 10-account limit can't be beaten by simultaneous saves, and the
-- database requires a bank name for InstaPay.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The other trader's accounts, only when money is about to move -------

create or replace function public.deal_payment_accounts(p_deal_id uuid)
returns table (method text, bank_name text, account_name text, account_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.method, a.bank_name, a.account_name, a.account_number
  from public.deals d
  join public.payment_accounts a
    on a.user_id = case when (select auth.uid()) = d.seller_id then d.buyer_id else d.seller_id end
  where d.id = p_deal_id
    and d.buyer_id is not null
    and (select auth.uid()) in (d.seller_id, d.buyer_id)
    and (
      -- the buyer choosing how to pay sees the seller's accounts
      ((select auth.uid()) = d.buyer_id and d.step = 'awaiting_first_payment')
      -- otherwise only the chosen method, at the payment steps
      or (
        d.payment_method is not null
        and a.method = d.payment_method
        and d.step in ('awaiting_first_payment', 'first_payment_sent',
                       'awaiting_second_payment', 'second_payment_sent')
      )
    )
  order by a.method, a.created_at;
$$;

revoke execute on function public.deal_payment_accounts(uuid) from public, anon;
grant execute on function public.deal_payment_accounts(uuid) to authenticated;

-- 2. The same number written differently is the same account -----------------
-- "0917-123-4567" and "0917 123 4567" can't both be saved. Digits and +
-- are compared; spaces and dashes are ignored.

create unique index if not exists payment_accounts_same_number_idx
  on payment_accounts (user_id, method, regexp_replace(account_number, '[^0-9+]', '', 'g'));

-- 3. At most 10 accounts, even with simultaneous saves ------------------------
-- Raises error code P0010 so the website doesn't depend on the wording.

create or replace function public.limit_payment_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (select count(*) from public.payment_accounts where user_id = new.user_id) >= 10 then
    raise exception 'You can save up to 10 payment accounts.' using errcode = 'P0010';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_payment_accounts() from public, anon, authenticated;

-- 4. InstaPay needs a bank name (checked for new rows) -------------------------

alter table payment_accounts drop constraint if exists payment_accounts_instapay_bank;
alter table payment_accounts
  add constraint payment_accounts_instapay_bank
  check (method <> 'instapay' or bank_name <> '') not valid;

-- 5. Check ------------------------------------------------------------
-- You should see one row: deal_payment_accounts with security_definer = true.

select proname, prosecdef as security_definer
from pg_proc
where proname = 'deal_payment_accounts' and pronamespace = 'public'::regnamespace;
