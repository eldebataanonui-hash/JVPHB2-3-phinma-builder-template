# 19 — Deal completed: notify both, trade receipt, Sold and Bought

**What to build:** When a deal completes, both traders are notified, the
Deal Room shows a printable trade receipt as proof, and the deal moves
out of "for sale" into Sold (seller) and Bought (buyer) on their own
profiles.

**Blocked by:** 05, 16

**Status:** done

- [x] A database trigger notifies both seller and buyer when a deal
      becomes completed; the old last-step notice is skipped so nobody
      gets two
- [x] Completed Deal Rooms show a trade receipt: receipt number (deal
      code), account, price, both halves, payment method, both traders,
      completion time and every step's time
- [x] Print / Save PDF prints only the receipt, readable on paper
- [x] Your own profile splits Selling into for sale / in progress and
      Sold, and Buying into in progress and Bought
- [x] Email receipts are parked in LATER (they need a new email service)
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
