# 16 — Notifications

**What to build:** Whenever the other trader confirms a deal step, writes
in the Deal Room chat or sends a direct message, you get a notification.
A bell in the top bar shows the unread count, and the page you're on
updates by itself when something new arrives.

**Blocked by:** 05, 09, 11

**Status:** done

- [x] The `notifications` table exists with Row Level Security on: you
      can only read your own, and only mark them read; rows are only
      created by database triggers
- [x] Triggers notify the other trader for every deal step and Deal Room
      chat message, and the recipient for every direct message
- [x] A bell with an unread count in the top bar, checking every 15
      seconds; when the count goes up, the current page refreshes
- [x] A Notifications page, newest first; tapping one marks it read and
      opens the deal or conversation; Mark all as read
- [x] Opening a Deal Room or conversation marks its notifications read
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
