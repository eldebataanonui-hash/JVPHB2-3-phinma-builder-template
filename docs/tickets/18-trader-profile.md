# 18 — Richer trader profiles: Trust check, stats, Selling now

**What to build:** Visiting a trader's profile tells a buyer whether to
trust them: a trust level badge, an automatic Trust check (green checks
and amber warnings from their real record), trader stats, and the
accounts they're selling right now.

**Blocked by:** 06, 08, 17

**Status:** done

- [x] `trader_stats` returns deals completed as seller and as buyer,
      abandoned deals and last active (by the day); logged-in only
- [x] `open_deals` returns only a seller's deals still waiting for a
      buyer, with safe fields only; logged-in only
- [x] Trust level badge next to the name: New trader, Getting started,
      Trusted trader, Top trader, or Mixed record
- [x] Trust check: email confirmed, account age, finished deals,
      abandoned deals, social media linked, recent trading
- [x] Trader stats: sold, bought, completion rate, member since, last
      active
- [x] Selling now on other traders' profiles, with the first listing
      photo, opening the Deal Room preview
- [x] "My profile" in the sidebar only highlights on your own profile
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
