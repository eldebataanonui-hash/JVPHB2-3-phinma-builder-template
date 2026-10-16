# 23 — Ratings and reviews after a completed deal

**What to build:** Both traders rate each other after a completed deal,
with stars, quick tags and a short comment. Ratings show on profiles and
trader cards and feed the trust badge and Trust check, so trust isn't
only "how many deals".

**Blocked by:** 19

**Status:** done

- [x] `supabase/sql/030-reviews.sql`: `deal_reviews` with RLS on; writes
      only through `submit_review()` (participant, completed, within 7
      days, one each); blind until both review or the window closes;
      `trader_ratings()` for averages
- [x] "Rate this trade" card on completed Deal Rooms: 1–5 stars, tags,
      optional comment (300 characters, no links)
- [x] Notification "⭐ … reviewed you"
- [x] Profile: rating summary, top tags, latest reviews marked
      "Verified trade"; Rating in Trader stats
- [x] Trust check line and trust badge use the rating
- [x] Stars on Find traders cards and next to each record in Deal Rooms
- [x] 030 run in Supabase; check shows the one SELECT policy
- [x] Live test: two accounts review each other; the first review stays
      hidden until the second is posted
- [x] A logged-out visitor can't read reviews or call the functions
