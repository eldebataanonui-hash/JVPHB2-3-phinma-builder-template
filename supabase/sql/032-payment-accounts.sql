-- 032 — payment accounts: where to send the money.
--
-- Run this in the Supabase dashboard:
--   SQL Editor -> New query -> paste -> Run
--
-- * Each trader saves the e-wallet or bank accounts they can be paid to
--   (or pay from): method, account name, and the account number or the
--   phone number linked to it. Up to 10 each.
-- * Private: only you can read your own list. The other trader in a
--   deal you're both in sees your accounts through
--   deal_payment_accounts(), and only while that deal is in progress.
--   Strangers and logged-out visitors see nothing.
--
-- Remember: change policies only through numbered SQL files like this
-- one, never by hand in the dashboard.

-- 1. The table ------------------------------------------------------

create table if not exists payment_accounts (
  id             bigint      generated always as identity primary key,
  user_id        uuid        not null default auth.uid() references profiles(id) on delete cascade,
  -- Same ids as deals.payment_method (017).
  method         text        not null check (method in ('gcash', 'maya', 'maribank', 'gotyme', 'shopeepay', 'instapay')),
  -- For InstaPay: which bank (e.g. BDO, BPI). Empty for e-wallets.
  bank_name      text        not null default '' check (char_length(bank_name) <= 40 and not public.contains_link(bank_name)),
  account_name   text        not null check (char_length(trim(account_name)) between 1 and 80 and not public.contains_link(account_name)),
  -- Digits, spaces, + and - only, with at least 4 digits.
  account_number text        not null check (
                   account_number ~ '^[0-9 +-]{4,40}$'
                   and char_length(regexp_replace(account_number, '[^0-9]', '', 'g')) >= 4
                 ),
  created_at     timestamptz not null default now(),
  unique (user_id, method, account_number)
);

create index if not exists payment_accounts_user_idx on payment_accounts (user_id);

-- You send only the account details; the database fills in who you are.
-- No editing: delete an account and add it again to change it.
revoke all on payment_accounts from anon, authenticated;
grant select, delete on payment_accounts to authenticated;
grant insert (method, bank_name, account_name, account_number) on payment_accounts to authenticated;
alter table payment_accounts enable row level security;

-- 2. Rules: your own accounts only ---------------------------------------

drop policy if exists "read your own payment accounts" on payment_accounts;
create policy "read your own payment accounts"
  on payment_accounts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "add your own payment accounts" on payment_accounts;
create policy "add your own payment accounts"
  on payment_accounts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "remove your own payment accounts" on payment_accounts;
create policy "remove your own payment accounts"
  on payment_accounts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. At most 10 accounts each (a trigger, so the rule above doesn't have
--    to look up its own table) ----------------------------------------

create or replace function public.limit_payment_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.payment_accounts where user_id = new.user_id) >= 10 then
    raise exception 'You can save up to 10 payment accounts.';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_payment_accounts() from public, anon, authenticated;

drop trigger if exists payment_accounts_limit on payment_accounts;
create trigger payment_accounts_limit
  before insert on payment_accounts
  for each row execute function public.limit_payment_accounts();

-- 4. The other trader's accounts, inside a deal ---------------------------
-- Only for the deal's seller or buyer, only once a buyer has joined, and
-- only until the deal completes.

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
    and d.step <> 'completed'
    and (select auth.uid()) in (d.seller_id, d.buyer_id)
  order by a.method, a.created_at;
$$;

revoke execute on function public.deal_payment_accounts(uuid) from public, anon;
grant execute on function public.deal_payment_accounts(uuid) to authenticated;

-- 5. Check ------------------------------------------------------------
-- You should see three rows: DELETE, INSERT, SELECT, each {authenticated}.

select policyname, cmd, roles from pg_policies where tablename = 'payment_accounts' order by cmd;
