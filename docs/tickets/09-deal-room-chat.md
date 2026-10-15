# 09 — Deal Room chat

**What to build:** The seller and buyer can message each other inside
their Deal Room, so the conversation stays on the record instead of in
Messenger, where scammers delete posts and send phishing links.

**Blocked by:** 05

**Status:** todo

- [ ] The `messages` table exists with Row Level Security on and its
      policies: only the deal's seller and buyer may read; only they may
      send, as themselves, once a buyer has joined; nobody may edit or
      delete a message
- [ ] Messages containing links are rejected, by the database and with a
      friendly message on screen
- [ ] The Deal Room shows the chat with sender name and time, a Send box
      and a Refresh button
- [ ] The chat warns: never send your password or a GCash/bank code; the
      only code ever shared is the Moonton binding code, at the Lock-In
      step
- [ ] Red flags, the Lock-In Checklist and the Trading Rules say the same
      thing about which code may be shared
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
