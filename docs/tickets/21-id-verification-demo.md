# 21 — Optional ID verification (demo) with Didit

**What to build:** A trader can verify an ID and a live selfie through
Didit's hosted page to earn an "ID verified (demo)" badge. It's optional
and never blocks trading. AQTech GHub stores only the result, never the
ID photo, ID number or face scan.

**Blocked by:** 18

**Status:** todo

- [ ] Didit keys and our record secret are server-only (never
      NEXT_PUBLIC_), in .env.local and Vercel, never in git
- [ ] "Verify my ID" on your own profile opens Didit's hosted page
- [ ] Results are saved only through record_kyc_result, which needs the
      server secret stored in Supabase Vault; traders can't set their own
      badge
- [ ] The return page asks Didit for the result directly and checks it
      belongs to the logged-in trader (never trusts the address bar)
- [ ] The webhook checks Didit's signature and timestamp before saving
- [ ] Profiles show "ID verified (demo)"; the Trust check shows it as a
      green check, or "ID not verified (optional)"
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL with Didit's sandbox
