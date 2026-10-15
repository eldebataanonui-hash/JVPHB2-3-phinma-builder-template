# 20 — Seller sends the account login details

**What to build:** At the handover step, the seller sends the sold
account's login and password through an encrypted box in the Deal Room.
Only the buyer can reveal them, and they're deleted when the deal
completes.

**Blocked by:** 05, 16

**Status:** todo

- [ ] Login details are stored encrypted in Supabase Vault; no table
      holds them as plain text, and no trader can read the storage table
- [ ] Only the seller can send them, only at the handover step; sending
      again replaces them
- [ ] Only the buyer can reveal them, only from the handover step until
      completion, and only after tapping Show
- [ ] The seller can't finish the handover step until they're sent
- [ ] The buyer gets a notification that never contains the details
- [ ] They're deleted automatically when the deal completes; the receipt
      notes that they were sent and deleted
- [ ] Red flags, Rules, chat warnings and About say the same thing about
      passwords
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
