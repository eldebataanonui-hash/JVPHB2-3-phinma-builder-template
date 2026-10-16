# AQTech GHub — Project handoff

Everything a teammate (or a future session) needs to understand, run,
rebuild and keep developing AQTech GHub. **This file contains no secret
values, only their names.** Last updated 2026-10-15.

## What it is

A web app that helps Mobile Legends players trade game accounts without
getting scammed. A seller and a buyer complete a trade inside a **Deal
Room**, step by step: the seller proves they control the account with a
live code, the buyer pays in two halves around a Lock-In Checklist (and
an encrypted login handover), and every step is recorded with the time.

- **Live site:** https://jvphb-2-3-phinma-builder-template.vercel.app
- **Code:** GitHub repo `eldebataanonui-hash/JVPHB2-3-phinma-builder-template`
- **Stack (fixed):** Next.js (App Router) + TypeScript, Tailwind,
  hosted Supabase (database, login, storage, Vault), Vercel (every push
  to `main` deploys). Optional: Didit for ID verification (a real ID + selfie check).

## Where the plan lives

| File | What's in it |
|---|---|
| `docs/PROBLEM.md` | The problem: Clark's ₱1,700 scam, who we help |
| `docs/SPEC.md` | What the app does: screens, data, rules, every feature |
| `docs/tickets/01–22` | One file per feature, all done except 21's live test |
| `docs/PITCH.md` | 3-minute pitch, demo checklist, hard questions |
| `docs/LATER.md` | Good ideas deliberately not built yet |
| `docs/HANDOFF.md` | This file |

## Features (all live)

Sign-up with confirmed email · profiles with picture, description,
social usernames, trust badge, Trust check, stats and Selling now ·
Find traders with suggestions · direct messages · Deal Rooms with deal
codes (JOIN-…), listing photos, live ownership code, payment method
choice, two-half payment, Lock-In Checklist, encrypted login handover,
chat, timestamped record, report a concern, trade receipt · notifications
(bell, auto-refresh) · Trading Rules, About us, red flags · Plans page and
14-day free trial (display only) · optional ID verification (real
Didit check; live test still pending) ·
dark theme with soft magenta and the pixel bunny-controller logo.

## Rebuilding the database from scratch

Run every file in `supabase/sql/` **in number order** (002 → 031) in the
Supabase **SQL Editor** (New query → paste the whole file → nothing
highlighted → Run). Each file ends with a **check**; compare the result
with what the file says to expect before moving on.

Then these one-off steps (never saved in the repo, because they hold
secrets):

1. **Supabase → Authentication → URL Configuration:** Site URL = the
   live URL; Redirect URLs = `<live URL>/**` and `http://localhost:3000/**`.
2. **Authentication → Email:** "Confirm email" ON.
3. **Vault secret for ID verification:** in a new SQL query (closed
   without saving), run
   `select vault.create_secret('<KYC_RECORD_SECRET value>', 'kyc_record_secret');`
   The check at the bottom of 028 should then say "server secret stored:
   true".

`supabase/one-off/` holds data clean-ups that are **not** part of a
rebuild. The test-deal clean-up only touches deals between the test
account emails you list in it; real users' deals are never removed.

## Settings (names only, never commit values)

Kept in `.env.local` on the driver laptop (git ignores it) **and** in
Vercel → Settings → Environment Variables. After changing Vercel values,
redeploy (or push any commit).

| Name | Kind | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config (public) | Supabase → Connect |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config (public) | Supabase → Connect (publishable key) |
| `KYC_RECORD_SECRET` | **Secret** | A long random string we generated; the same value is in Supabase Vault as `kyc_record_secret` |
| `DIDIT_API_KEY` | **Secret** | Didit console → API keys |
| `DIDIT_WORKFLOW_ID` | **Secret** | Didit console → Workflows |
| `DIDIT_WEBHOOK_SECRET` | **Secret** | Didit console → Webhooks → Signing secret |

**Never** add the Supabase `service_role` key or any `sb_secret_` key to
this project, and never prefix a secret with `NEXT_PUBLIC_`. Keep a
private copy of `KYC_RECORD_SECRET` in a password manager: Vercel can't
show "Secret" values again.

## Didit (optional ID verification, Live environment)

- Workflow: **KYC Workflow** (Simple Mode) with **Liveness Detection**
  and **Face Match 1:1** on; paid extras off.
- Webhook destination: `<live URL>/api/kyc/webhook`, version **v3.0**,
  event **status.updated** only.
- Our app checks Didit's **X-Signature-V2** (HMAC-SHA256 over sorted,
  compact JSON) and rejects anything older than 5 minutes.
- The app stores only the result (`profiles.id_verified_at`,
  `kyc_checks`), never ID photos, ID numbers or face scans.

## Security rules we follow

- Row Level Security is ON for every table, with explicit policies;
  traders only get column-level permission for exactly what they may
  write. **Change policies only through new numbered SQL files, never by
  hand in the dashboard.**
- Pages show only fixed error messages (codes in the URL, text from
  `src/lib/errors.ts`), never text from the address bar.
- Links are blocked in chat, messages, descriptions and deals
  (`contains_link`), except the app's own built links to social sites.
- Login redirects only to paths on this site (`src/lib/safe-path.ts`).
- Account logins sent in a Deal Room are encrypted in Supabase Vault,
  readable only by the buyer, and deleted on completion.
- Three code reviews were run; every must-fix finding was fixed.

## Still open

1. **Ticket 21:** one real "Verify my ID" test on the live site.
2. **MUST DO before the demo: replace the Didit webhook signing secret**
   (it was pasted in a chat, and anyone holding it could fake an "ID
   verified" badge): add a new destination with the same URL, v3.0 and
   status.updated, delete the old one, update `DIDIT_WEBHOOK_SECRET` in
   Vercel and `.env.local`, redeploy, then Test Webhook (expect 200).
3. **Check the Lock-In Checklist wording** against the real MLBB
   settings.
4. **Before the demo:** run `supabase/one-off/cleanup-unfinished-test-deals.sql`
   (preview first), follow the checklist in `docs/PITCH.md`, rehearse
   twice.
5. Optional: a final `/code-review` of the receipt, login details, ID
   verification and plans.

## Lessons we learned (worth keeping)

- "Works on my machine" isn't done: push, then check the live URL.
- After running SQL, always run its check and compare.
- A rule that looks up its own table recurses; use a helper function.
- "not valid" rules still block updates to old rows; clean, then validate.
- A Vercel secret can hide an invisible pasted character; test the live
  site with a known-good request to find it.
