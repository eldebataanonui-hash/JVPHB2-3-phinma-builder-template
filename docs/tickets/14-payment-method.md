# 14 — Choose a payment method

**What to build:** Before sending the first half, the buyer picks how
they'll pay (GCash, Maya, MariBank, GoTyme Bank, ShopeePay or InstaPay).
The seller sees which app to check, and every payment step names it.
AQTech GHub never moves money; this only records the choice.

**Blocked by:** 05

**Status:** todo

- [ ] `deals.payment_method` accepts only the six listed methods, and
      traders can't set it directly
- [ ] Only the buyer can choose, and only before the first half is sent;
      the choice is added to the record
- [ ] "I've sent the first half" stays locked until a method is chosen
      (on screen and in the database)
- [ ] The seller sees "The buyer sends ₱N by <method>", and the payment
      steps say "Open <method> and check…"
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
