-- ONE-OFF CLEAN-UP (not part of rebuilding the database, so it is not
-- numbered like the files in supabase/sql/).
--
-- Removes every deal that is NOT completed: unfinished test trades
-- (which count as "abandoned" and pull demo profiles towards "Mixed
-- record") and open test listings.
--
-- KEEPS: all accounts and profiles, every completed deal (with its
-- record and receipt), direct messages, profile pictures and socials.
--
-- Deleting a deal also deletes its record (deal_events), chat
-- (messages), concerns, notifications and stored login details, because
-- those tables are set to "on delete cascade". Listing photos of deleted
-- deals become invisible (nobody can view a deal that no longer exists).
--
-- HOW TO RUN, in the Supabase SQL Editor:
--   STEP 1: run ONLY the "PREVIEW" query below (highlight it, then Run).
--           Check the list. Every row there will be deleted.
--   STEP 2: if the list is right, run the "DELETE" block (highlight it,
--           then Run). This cannot be undone.

-- PREVIEW ---------------------------------------------------------------

select d.title, d.price, d.step, s.display_name as seller,
       b.display_name as buyer, d.created_at
from deals d
join profiles s on s.id = d.seller_id
left join profiles b on b.id = d.buyer_id
where d.step <> 'completed'
order by d.created_at;

-- DELETE (run only after checking the preview) -------------------------

begin;

-- Encrypted login details of those deals (Vault secrets).
delete from vault.secrets
where id in (
  select c.secret_id from deal_credentials c
  join deals d on d.id = c.deal_id
  where d.step <> 'completed'
);

-- The deals themselves; their records, chats, concerns, notifications
-- and credential rows go with them.
delete from deals where step <> 'completed';

commit;

-- Check: should show 0 unfinished deals left.
select count(*) as unfinished_deals_left from deals where step <> 'completed';
