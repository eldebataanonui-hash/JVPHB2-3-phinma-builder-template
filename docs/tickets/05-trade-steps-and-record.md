# 05 — The trade steps and the timestamped record

**What to build:** The seller and buyer complete a trade inside the Deal
Room, step by step, in order, and every confirmation is recorded with
who and when. This is the core of the demo.

**Blocked by:** 04

**Status:** todo

- [ ] The steps from the spec run in order: ownership code, first half,
      Lock-In Checklist, second half, completed
- [ ] At each step, only the trader whose turn it is sees an action
      button
- [ ] The live ownership code is shown to the seller with instructions
      to put it in the in-game name
- [ ] The Lock-In Checklist is shown in full when it applies, and is
      confirmed once as a whole (use the draft in the spec, checked by
      the team against the game)
- [ ] The `deal_events` table exists with Row Level Security on and its
      policies: only the seller and buyer may read; rows are created only
      by the step function; nobody may update or delete
- [ ] The step function refuses a confirmation from the wrong person or
      for the wrong step
- [ ] The Deal Room shows the timestamped record: who confirmed what,
      and when
- [ ] Completing the last step records the completion time
- [ ] Every database change is saved as a numbered SQL file
- [ ] Works on the live URL: a full trade between two real accounts,
      from join to completed
