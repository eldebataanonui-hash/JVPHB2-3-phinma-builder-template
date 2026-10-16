# 24 — Plan prices, value and plan picks

**What to build:** Replace "TBA" with real prices and show why each plan
is worth it for MLBB traders. Let traders pick a plan (saved, never
charged) and work out which plan fits them.

**Blocked by:** 22

**Status:** in progress (waiting for 031 to run)

- [x] Prices in one place (`src/lib/plans.ts`): Monthly ₱49, Bi-annual
      ₱249, Annual ₱399; savings and per-month prices worked out from them
- [x] Free plan card: every safety feature, free forever
- [x] Each plan: who it's for, why it's worth it, perks (visibility, not
      safety)
- [x] "Which plan fits you?" calculator: cheapest mix for the months you
      trade, total, per account, and against a ₱1,700 scam
- [x] Pick / Switch / Remove my pick; "No charge" shown on every button
- [x] `supabase/sql/031-plan-picks.sql`: RLS on, your own pick only;
      counts only (no names) via `plan_pick_counts()`
- [x] Real billing and perks parked in LATER
- [ ] 031 run in Supabase; check shows four policies
- [ ] Live: pick a plan, switch, remove; logged out sees "Start free trial"
