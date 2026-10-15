# 07 — Report a concern and Trading Rules

**What to build:** If something goes wrong, either trader can report a
concern from the Deal Room, and the AQTech GHub team sees it in the
Supabase dashboard with the full record. A Trading Rules page explains
the policies.

**Blocked by:** 04

**Status:** done

- [x] The Deal Room has a Report a concern button that opens a short form
- [x] The `concerns` table exists with Row Level Security on and its
      policies: only the reporter may read their own concern; only the
      seller or buyer of the deal may create one, as themselves, with
      status open; nobody may update or delete through the website
- [x] The trader sees a confirmation that their concern was sent
- [x] A new concern appears in the Supabase dashboard, and the team can
      mark it resolved there
- [x] The Trading Rules page covers what counts as a broken deal, what to
      do when something goes wrong, what the team can and can't do (we
      never hold money or reverse payments), and response time
- [x] Every database change is saved as a numbered SQL file
- [x] Works on the live URL
