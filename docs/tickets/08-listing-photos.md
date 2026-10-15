# 08 — Listing photos (stretch)

**What to build:** The seller can add a few photos of the listed account
(rank, skins, heroes) to their Deal Room, so the buyer can see what's on
offer. Photos are a showcase, not proof: the live ownership code is what
proves the seller controls the account.

Only build this after tickets 06 and 07 are done and working live.

**Blocked by:** 06, 07

**Status:** todo

- [x] Only the seller can add photos, and only to their own deal
- [x] Up to 4 images per deal, images only, about 2 MB each at most
- [x] Photos are kept in a private Supabase Storage bucket with Row
      Level Security policies (022): only the deal's seller may upload or
      delete; the deal's seller and buyer, and logged-in traders viewing
      the preview, may see them
- [x] The upload screen warns the seller to crop out emails, phone
      numbers and account IDs
- [x] The Deal Room and the preview show the photos, with the note:
      "Photos show what's on offer. They don't prove ownership. The live
      code does."
- [x] Every storage policy is saved as a numbered SQL file
- [ ] Works on the live URL (reopened: preview photos fixed in 025, needs a live check)
