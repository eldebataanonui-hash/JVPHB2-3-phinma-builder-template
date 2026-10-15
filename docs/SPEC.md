# Spec: AQTech GHub

## Problem
I want to buy a Mobile Legends account from someone I found in a
Facebook group, but I can't tell if they're legit. Screenshots, videos
and comments can all be faked, and if I pay first they can block me and
keep my money. Even if they hand the account over, they could take it
back later through a login method still bound to them.

## Solution
The seller and I trade inside a Deal Room. The seller proves they own
the listed account by putting a live ownership code in its in-game name.
I pay half, the seller follows the Lock-In Checklist to move every
binding to me, I confirm I have full control, then I pay the other half.
Every step is confirmed by the right person, in order, and timestamped.
Before I start, I can see the seller's record of completed deals. If
something goes wrong, I report a concern and the AQTech GHub team reviews
it with the full record.

## The user
An **MLBB trader** with a confirmed email. The same person can be the
**seller** in one Deal Room and the **buyer** in another. When a design
choice conflicts, the buyer comes first.

The AQTech GHub team handles reported concerns through the Supabase
dashboard. They are not a second type of user in the app.

## User stories
1. As a trader, I want to sign up and confirm my email, so that other
   traders know I am a reachable person.
2. As a seller, I want to create a Deal Room for my listed account and
   send the link to a buyer, so that we trade on fair, fixed terms.
3. As a buyer, I want to see the seller's completed-deals record before
   I join, so that I can judge whether they are legit.
4. As a buyer, I want the seller to prove ownership with a live code I
   can see in the game, so that screenshots and videos can't fool me.
5. As a buyer, I want to pay in two halves around a Lock-In Checklist,
   so that I never risk the full price before I have full control.
6. As a trader, I want every confirmation recorded with who and when,
   and impossible to edit, so that I have proof if something goes wrong.
7. As a trader, I want to report a concern about a deal, so that the
   AQTech GHub team can step in with the full record.

## Screens
1. **Home**: what AQTech GHub does, the red-flag tips, and buttons to
   sign up or log in.
2. **Sign up / Log in**: email, password and display name. New users
   must click the confirmation link in their email before they can log
   in, so every logged-in trader has a confirmed email.
3. **Profile**: a trader's display name, when they joined, an "Email
   confirmed" badge, and their record shown as "3 of 4 deals completed"
   (as seller and buyer combined). On your own profile you also see
   every Deal Room you are in, with its current step, and a **New Deal**
   button.
4. **New Deal**: the seller enters the listed account's title, a
   description (rank, skins, heroes) and the price in pesos. A warning
   says never to put login details here. Creating it opens the Deal
   Room.
5. **Deal Room**:
   - Before a buyer joins: the seller sees the link to send. Anyone else
     who opens it sees the terms, the seller's name and record, and a
     **Join as buyer** button.
   - After the buyer joins: the terms, both names (each links to their
     Profile), the current step, the button for whoever's turn it is
     (no one else sees an action), the Lock-In Checklist when it applies,
     the timestamped record, red-flag reminders, and a **Report a
     concern** button.
6. **Trading Rules**: the policies. What counts as a broken deal, what
   to do if something goes wrong, what the AQTech GHub team can and can't
   do (we never hold money and can't reverse payments), and how fast the
   team responds to concerns.

### Deal Room steps
Each step unlocks only after the previous one is done.

| # | Step | Who acts |
|---|---|---|
| 1 | Buyer joins | Buyer |
| 2 | Seller puts the live ownership code in the in-game name → buyer confirms seeing it | Seller, then buyer |
| 3 | Buyer sends the first half → seller confirms it arrived | Buyer, then seller |
| 4 | Seller completes the Lock-In Checklist → buyer confirms full control | Seller, then buyer |
| 5 | Buyer sends the second half → seller confirms it arrived | Buyer, then seller |
| 6 | Completed | — |

The checklist is shown in full and confirmed once as a whole, not item
by item.

### Lock-In Checklist (draft)
**Draft: a teammate who plays MLBB must check each item against the
game's current settings before this is built.** MLBB menus change between
updates.

Seller does:
1. Change the account's bound Moonton email to the buyer's email. The
   buyer reads out or confirms the verification code Moonton sends them.
2. Remove every third-party login bound to the seller (Facebook, Google
   Play, TikTok, Apple, VK or others).

Buyer does:
3. Bind at least one of their own third-party logins as a backup.
4. Log in on their own device with their own login.
5. Open the account settings and check that every bound login and email
   shown belongs to the buyer and nothing belongs to the seller.
6. Change the password, and keep the security setting that sends new
   device login codes to the bound email turned on, so the codes now go
   to the buyer.

The buyer confirms full control only after step 6.

**Known gap:** an original owner may still try to recover the account
through Moonton customer support using old evidence such as purchase
receipts, the account's first Moonton email or old screenshots. The
checklist cannot block this. The Deal Room's timestamped record is the
buyer's evidence if it happens, and a cooling-off period is parked in
`docs/LATER.md`.

### Red-flag tips
Shown on Home and in every Deal Room: never pay the full price first;
never pay "verification fees"; "no middleman needed" is a scam line; a
price far below similar listings is a warning sign; AQTech GHub and honest
traders never ask for your password or one-time code.

## Data
Row Level Security is ON for every table, with the policies below.

### `profiles`
One row per trader.
- Columns: `id` (the trader's login ID), `display_name`, `created_at`.
- **Read:** any logged-in trader.
- **Create and update:** only your own row.
- **Delete:** nobody.

### `deals`
One row per Deal Room.
- Columns: `id`, `seller_id`, `buyer_id` (empty until a buyer joins),
  `title`, `description`, `price` (whole pesos), `ownership_code`
  (generated by the database when the deal is created), `step`,
  `created_at`, `completed_at`.
- **Read:** only the seller and the buyer of that deal.
- **Create:** any logged-in trader, only with themselves as seller and
  the step at the start.
- **Update and delete:** nobody directly. Changes happen only through
  the database functions below.

### `deal_events`
The timestamped record.
- Columns: `id`, `deal_id`, `actor_id` (who confirmed), `step` (what
  they confirmed), `created_at`.
- **Read:** only the seller and the buyer of that deal.
- **Create:** only through the step function.
- **Update and delete:** nobody, ever.

### `concerns`
Reports sent to the AQTech GHub team.
- Columns: `id`, `deal_id`, `reporter_id`, `message`, `status` (open or
  resolved), `created_at`.
- **Read:** only the trader who filed it.
- **Create:** only the seller or the buyer of that deal, as themselves,
  with status open.
- **Update and delete:** nobody through the website. The team updates
  the status in the Supabase dashboard.

### Database functions
These run inside the database and check the rules themselves, so the
website can't skip them.
- **Deal preview**: given a deal's link, shows its title, description,
  price and seller to any logged-in trader, so a buyer can decide before
  joining. It never shows the ownership code.
- **Join deal**: makes the caller the buyer, only if the deal has no
  buyer yet and the caller is not the seller.
- **Advance step**: moves a deal to its next step and adds a
  `deal_events` row, only if the caller is the right person for the
  current step.
- **Trader record**: returns how many deals a trader has completed and
  how many they have abandoned, as seller or buyer. Abandoned means a
  deal with a buyer that was not completed within 3 days. Deals still in
  progress are not counted either way.

## Login
Yes. Supabase Auth with email and password, and email confirmation
turned on. Every trade action needs a logged-in trader, because the
whole point is knowing who confirmed each step.

Supabase's free built-in email sends only a few confirmation emails per
hour, so create and confirm the demo accounts the day before.

## Done for the demo
On the live URL:
- [ ] A new trader can sign up, confirm their email and log in.
- [ ] The seller creates a Deal Room and copies its link.
- [ ] The buyer opens the link, sees the seller's record and joins.
- [ ] All five steps work in order, and each person only ever sees their
      own action button.
- [ ] The timestamped record shows every confirmation with name and time.
- [ ] After completion, both profiles show the new completed deal.
- [ ] Either trader can report a concern, and it appears in the Supabase
      dashboard.
- [ ] The Trading Rules page and red-flag tips are visible.
- [ ] A logged-out visitor, or a third trader, cannot read the deal's
      details, record or concerns.

## Out of scope
- Government ID verification
- A full admin panel in the app
- Roblox, Genshin and other games
- Holding money for users (escrow), or payment processing of any kind
- Phone or SMS verification
- A marketplace or listings search
- In-site chat
- Star ratings and written reviews
- A cooling-off period after completion
- Blocking links inside the Deal Room
- An automatic below-market price warning
- Notifications when it's your turn
- Cancelling or editing a deal after it's created
- Saving each Lock-In Checklist item separately
