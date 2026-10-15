# 12 — Suggested traders on Find traders

**What to build:** Opening Find traders without searching shows other
traders to discover, most trusted and most active first, each with a
View profile and a Message button.

**Blocked by:** 10, 11

**Status:** done

- [x] The suggested traders function returns up to 30 other traders,
      ordered by completed deals, then most recent trading activity,
      then newest; only to logged-in traders; never the deals themselves
- [x] "Last active" counts only trading actions (creating a deal,
      confirming a step), never messages, and is shown roughly
- [x] Each card shows name, join date, last active, deal record, a short
      description, View profile and Message
- [x] Searching still filters by name, and you never see yourself
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
