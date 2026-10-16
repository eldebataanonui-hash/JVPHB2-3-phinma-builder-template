-- ONE-OFF CLEAN-UP (not part of rebuilding the database, so it is not
-- numbered like the files in supabase/sql/).
--
-- Removes unfinished deals that belong ONLY to your team's test accounts,
-- so demo profiles show a clean record. Real users' deals are never
-- touched: a deal is removed only if its seller AND (if any) its buyer
-- are both on your list of test emails below.
--
-- KEEPS: all accounts and profiles, every completed deal (with its
-- record and receipt), every deal involving anyone not on your list,
-- direct messages, profile pictures and socials.
--
-- Deleting a deal also deletes its record, chat, concerns, notifications
-- and stored login details (and, since 029, their encrypted Vault
-- secrets), because those are set to "on delete cascade".
--
-- HOW TO RUN, in the Supabase SQL Editor:
--   STEP 0: replace the example emails in BOTH lists below with your
--           team's test account emails (keep the quotes and commas).
--   STEP 1: highlight and run ONLY the PREVIEW query. Check the list:
--           every row there will be deleted.
--   STEP 2: if the list is right, highlight and run the DELETE block
--           (from "begin;" to "commit;"). This cannot be undone.

-- PREVIEW ---------------------------------------------------------------

with test_users as (
  select id from auth.users
  where email in ('test-seller@example.com', 'test-buyer@example.com')
)
select d.title, d.price, d.step, s.display_name as seller,
       b.display_name as buyer, d.created_at
from deals d
join profiles s on s.id = d.seller_id
left join profiles b on b.id = d.buyer_id
where d.step <> 'completed'
  and d.seller_id in (select id from test_users)
  and (d.buyer_id is null or d.buyer_id in (select id from test_users))
order by d.created_at;

-- DELETE (run only after checking the preview) -------------------------

begin;

with test_users as (
  select id from auth.users
  where email in ('test-seller@example.com', 'test-buyer@example.com')
)
delete from deals d
where d.step <> 'completed'
  and d.seller_id in (select id from test_users)
  and (d.buyer_id is null or d.buyer_id in (select id from test_users));

commit;
