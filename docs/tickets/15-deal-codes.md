# 15 — Deal codes instead of links

**What to build:** Links are blocked in Messages and chat, which also
blocked sellers sharing their Deal Room link. Every deal now has a short
deal code (JOIN-XXXXXXXX). The seller copies it; the buyer enters it on
Join a deal and lands on the preview.

**Blocked by:** 04, 11

**Status:** todo

- [ ] Every deal, old and new, has a unique deal code made by the
      database; traders can't set it
- [ ] The find-by-code function returns only the deal's id, only to
      logged-in traders
- [ ] The seller's Deal Room shows "Send this code to your buyer" with a
      Copy button, and the link as a secondary option
- [ ] A Join a deal page, linked from the sidebar, Home and every
      Messages conversation; a wrong code shows a clear message
- [ ] The deal code is clearly different from the ownership code
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
