# 11 — Profile description and direct messages

**What to build:** Every trader's Profile shows a short description they
write themselves, and other traders can tap Message to talk before
trading. Payments and codes still belong in a Deal Room.

**Blocked by:** 03

**Status:** todo

- [ ] `profiles` gains a `bio` column (up to 500 characters, no links).
      Traders can update only their own bio, never the join date or
      anything else
- [ ] Your own Profile has an Edit description box; others' Profiles show
      the description and a Message button
- [ ] The `direct_messages` table exists with Row Level Security on and
      its policies: only the sender and recipient may read; you may only
      send as yourself; nobody may edit or delete; links are rejected
- [ ] Messages page lists your conversations, newest first
- [ ] A conversation page shows the messages with Send and Refresh, and
      the warning "Never pay or share codes here. Start a Deal Room for
      any trade."
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
