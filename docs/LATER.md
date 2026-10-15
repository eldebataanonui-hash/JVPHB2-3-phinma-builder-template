# Later

Good ideas that are not in the MVP.

Parking something here is a decision, not a loss. It is how the MVP
stays small enough to actually ship by Session 3.


## From /grill-with-docs (2026-10-15)

- **Government ID verification.** Planned next step, through a licensed
  ID-verification provider. Parked because a free version would mean
  storing sensitive IDs (Data Privacy Act of 2012), manual review by an
  admin (a second type of user), and no reliable way to spot fake IDs.
- **More games.** Roblox first, then others such as Genshin. Each needs
  its own Lock-In Checklist because account recovery works differently.
- **Escrow / holding money for users.** Needs licensing and a paid
  payment service.
- **Phone or SMS verification.** Needs a paid text-messaging service.
- **Marketplace or listings search.** Deals still start on Facebook for
  now.
- **Star ratings and written reviews.** The MVP only shows a
  completed-deals count.
- **Cooling-off period and dispute handling** after a deal is complete.

## From /to-spec (2026-10-15)

- **Full admin panel in the app.** For the MVP, the team handles
  reported concerns in the Supabase dashboard.
- **Automatic below-market price warning.** Needs price data; for now it
  is a written red-flag tip.
- **Cancelling or editing a deal** after it's created.
- **Saving each Lock-In Checklist item separately.** The MVP confirms the
  checklist once as a whole.

## From the profile and messages work (2026-10-15)

- **Reporting a profile picture** to the team, and removing it.
- **Block or mute a trader** in direct messages.
- **Report a direct message** to the team (concerns are per Deal Room
  for now).
- **Seller can reset a stalled deal.** Anyone with the code or link can take the
  buyer slot; if they stall, the seller can't remove them and the deal
  counts as abandoned after 3 days. Let the seller reset a deal before
  the first payment, and count "abandoned" only against whoever's turn
  it was. (Found in code review.)
- **Phone push notifications or email alerts** for deal steps and
  messages. In-app notifications (the bell) work now; push needs a
  service and email hits the free sending limit.

## From the second code review (2026-10-15)

- **Harder-to-fake records.** One person with two accounts can complete
  fake deals with themselves. Only count deals between unrelated
  accounts, or weight records by account age.
- **Block or report a trader in Messages.** Messages are rate-limited
  but there's no way to block someone.
- **Smarter reserved-name check.** "Supp0rt" or "A d m i n" still get
  through.
- **Longer deal codes** (10 to 12 characters) if the site grows.
- **Mark notifications read with a button press**, not when a page loads
  (a prefetch can mark things read that nobody saw).
- **Email receipts and alerts** (e.g. "Deal completed" to Gmail). Needs
  an email service (Brevo or Resend) with a server-side API key and
  sender verification; Supabase's built-in email only sends sign-up
  emails to team members. For now: in-app notifications and the
  printable trade receipt.
