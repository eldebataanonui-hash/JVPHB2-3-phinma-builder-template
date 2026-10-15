# 20 — Seller sends the account login details

**What to build:** At the handover step, the seller sends the sold
account's login and password through an encrypted box in the Deal Room.
Only the buyer can reveal them, and they're deleted when the deal
completes.

**Blocked by:** 05, 16

**Status:** done

- [x] Login details are stored encrypted in Supabase Vault; no table
      holds them as plain text, and no trader can read the storage table
- [x] Only the seller can send them, only at the handover step; sending
      again replaces them
- [x] Only the buyer can reveal them, only from the handover step until
      completion, and only after tapping Show
- [x] The seller can't finish the handover step until they're sent
- [x] The buyer gets a notification that never contains the details
- [x] They're deleted automatically when the deal completes; the receipt
      notes that they were sent and deleted
- [x] Red flags, Rules, chat warnings and About say the same thing about
      passwords
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
