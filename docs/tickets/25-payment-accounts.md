# 25 — Payment accounts: where to send the money

**What to build:** Traders save the e-wallet or bank accounts they're
paid to. In a Deal Room, the buyer sees the seller's account for the
chosen method, and the seller sees the buyer's, so nobody pays the
wrong number.

**Blocked by:** 14

**Status:** in progress (waiting for the team's live test)

- [x] `supabase/sql/032-payment-accounts.sql`: `payment_accounts` with RLS
      on (your own rows only), insert limited to the detail columns, at
      most 10 each, number format checked, no links;
      `deal_payment_accounts()` returns the other trader's accounts only
      to the deal's seller or buyer, only while the deal is in progress
- [x] Profile: private "Payment accounts" card to add and remove accounts
- [x] Payment picker marks "Seller has an account" per method
- [x] Buyer: "Send ₱… to" box with the number, Copy button and name check
- [x] Seller: "Expect ₱… from" the buyer's account
- [x] Red flag: "Send it to my other GCash number instead."
- [x] 032 run in Supabase; check shows three policies
- [ ] Live: add accounts, see them in a deal from the other side; a
      stranger and a logged-out visitor see nothing
- [x] Logged-out visitor can't read, add or remove accounts, or call deal_payment_accounts
