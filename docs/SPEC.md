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
   send its deal code to a buyer, so that we trade on fair, fixed terms.
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
   - Before a buyer joins: the seller sees the deal code to send. Anyone else
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
traders never ask for your own passwords or a GCash/bank code (a sold
account's login only goes through the encrypted login box). Deal codes
(JOIN-…) are safe to share; the only security code ever shared is the
Moonton binding code, at the Lock-In step.

## Data
Row Level Security is ON for every table, with the policies below. On
top of that, traders only get column-level permission for exactly the
fields they may write; everything else is filled in by the database.
Policies are only ever changed through numbered files in supabase/sql/.

### `profiles`
One row per trader, created by the database when the email is confirmed.
- Columns: `id` (the trader's login ID), `display_name`, `bio` (up to
  500 characters, no links), `avatar_path` (a picture in the trader's own
  folder, or empty), `created_at`.
- **Read:** any logged-in trader.
- **Create:** only your own row, with `id` and `display_name`.
- **Update:** only your own `bio` and `avatar_path`. Never the name or
  join date.
- **Delete:** nobody.
- Display names can't contain "AQTech" or "GHub", can't be just "Admin",
  "Support" or similar, and need a letter or digit.

### `deals`
One row per Deal Room.
- Columns: `id`, `seller_id`, `buyer_id` (empty until a buyer joins),
  `title`, `description`, `price` (whole pesos), `ownership_code`
  (AQ-…, proves account control), `join_code` (JOIN-…, shared with the
  buyer), `payment_method`, `step`, `created_at`, `completed_at`.
- **Read:** only the seller and the buyer of that deal.
- **Create:** any logged-in trader, writing only title, description and
  price; the database fills in everything else. No links allowed.
- **Update and delete:** nobody directly. Changes happen only through
  the database functions below.

### `deal_events`
The timestamped record.
- Columns: `id`, `deal_id`, `actor_id` (who confirmed), `action` (what
  they confirmed), `created_at`.
- **Read:** only the seller and the buyer of that deal.
- **Create:** only through the database functions.
- **Update and delete:** nobody, ever.

### `messages` (Deal Room chat)
- **Read:** only the deal's seller and buyer.
- **Create:** only them, as themselves, once a buyer has joined; no
  links; at most 30 per 10 minutes.
- **Update and delete:** nobody.

### `direct_messages`
- **Read:** only the sender and the recipient.
- **Create:** only as yourself, never to yourself; no links; at most 20
  per 10 minutes.
- **Update and delete:** nobody.

### `concerns`
Reports sent to the AQTech GHub team.
- Columns: `id`, `deal_id`, `reporter_id`, `message`, `status` (open or
  resolved), `created_at`.
- **Read:** only the trader who filed it.
- **Create:** only the seller or the buyer of that deal, as themselves,
  with status open.
- **Update and delete:** nobody through the website. The team updates
  the status in the Supabase dashboard.

### `notifications`
- **Read:** only your own.
- **Update:** only `read_at` on your own.
- **Create:** only the database's own triggers (deal steps, Deal Room
  chat, direct messages). Nobody can create one directly.

### Storage: `avatars` bucket
Public pictures (anyone with the link can view one). JPG, PNG or WebP,
2 MB max, at most 5 files per trader. Traders can only upload to and
delete from their own folder.

### Database functions
These run inside the database and check the rules themselves, so the
website can't skip them. All need a logged-in trader.
- **Deal preview**: shows a deal's title, description, price and seller
  while it is still waiting for a buyer. Once a buyer joins, it only says
  the deal has a buyer. It never shows the ownership code.
- **Deal by code**: turns a deal code (JOIN-…) into the deal's id.
- **Join deal**: makes the caller the buyer, only if the deal has no
  buyer yet and the caller is not the seller.
- **Choose payment method**: only the buyer, only before the first half.
- **Advance step**: moves a deal to its next step and adds a
  `deal_events` row, only if the caller is the right person for the
  current step (and a payment method is chosen before the first half).
- **Trader record**: returns how many deals a trader has completed and
  how many they have abandoned, as seller or buyer. Abandoned means a
  deal with a buyer that was not completed within 3 days. Deals still in
  progress are not counted either way.
- **Suggested traders**: up to 30 other traders, most completed deals
  first, then most recent trading activity (by the day).

## Deal Room chat (ticket 09)
The seller and buyer can message each other inside the Deal Room once a
buyer has joined. Messages can't be edited or deleted, so they stay on
the record for the team to review with a concern. Links are blocked.
New messages appear by themselves. Deal codes (JOIN-…) are fine to
share. The only security code ever shared is the Moonton binding code,
in the chat, at the Lock-In step; never a password or a GCash/bank
code.

## Find traders (ticket 10)
Logged-in traders can search other traders by display name and open
their Profile. Names aren't unique, so results show the join date and
deal record. This searches traders, not listings: there is still no
marketplace.

## Profile description and direct messages (ticket 11)
Each trader can write a short description (up to 500 characters, no
links) on their own Profile. Other traders see it, with a Message
button. Direct messages are for questions before a trade: only the two
people can read them, they can't be edited or deleted, and links are
blocked. Every conversation warns: never pay or share a password or
security code here (deal codes are fine); start a Deal Room for any
trade.

## Profile pictures (ticket 13)
Traders can add a JPG, PNG or WebP picture up to 2 MB from their own
Profile. It is stored in a public "avatars" bucket (anyone with the link
can view it, like avatars on most sites); traders can only upload to and
delete from their own folder. It shows on the Profile, Find traders,
Messages and the top bar.

## Payment method (ticket 14)
Before the first half, the buyer chooses GCash, Maya (PayMaya),
MariBank, GoTyme Bank, ShopeePay or InstaPay. The first-half button is
locked until they do. The seller sees which app to check. AQTech GHub
never holds or moves money: this only records the agreed method.

## Suggested traders (ticket 12)
Find traders shows up to 30 other traders before you search: most
completed deals first, then most recently active. "Last active" only
counts trading, rounded to the day, never messages.

## Deal codes (ticket 15)
Every deal has a deal code (JOIN-XXXXXXXX). The seller sends it, for
example in Messages; the buyer enters it on Join a deal. A new buyer who
signs up from Join a deal is brought back there after confirming their
email. The Deal Room link still works for sharing outside the app.

## Notifications (ticket 16)
When the other trader confirms a step, writes in the Deal Room chat or
sends you a direct message, you get a notification. The bell in the top
bar shows how many are unread and checks every 15 seconds; when
something new arrives, the page you're on refreshes itself. Opening a
deal or conversation marks its notifications read.

## Account login details (ticket 20)
The team chose to let sellers send the sold account's login and password
in the Deal Room. At the handover step (after the first half arrives) the
seller fills in an encrypted login box; it's stored in Supabase Vault,
only the buyer can reveal it, and it's deleted when the deal completes.
The seller can't finish the handover step without sending it. The buyer
is notified (the notification never contains the details) and told to
change the password and move the bound email at once, because the seller
still knows the password.

## Plans and free trial (ticket 22)
A Plans page shows Free (every safety feature, forever) and three Pro
plans: Monthly ₱49, Bi-annual ₱249 (save 15%) and Annual ₱399 (save
32%, best value), each with who it's for, why it's worth it and its
perks. Pro perks are for visibility, never safety. A "Which plan fits
you?" calculator works out the cheapest plan for the months you'll trade
and the cost per account. Logged-in traders can pick a plan; the pick is
saved (`plan_picks`, 031) and nobody is charged (ticket 24). Every account gets a
14-day free trial counted from sign-up, shown in the top bar and on your
profile. Nothing is charged and nothing is locked: after the trial,
everything stays free during beta.

## Deal completed and trade receipt (ticket 19)
When a deal completes, both traders get a "Deal completed"
notification, and the Deal Room shows a printable trade receipt (deal
code as receipt number, account, price and both halves, payment method,
both traders, completion time and every step's time). On your own
profile, finished deals move to Sold (seller) and Bought (buyer).

## Optional ID verification with Didit (ticket 21)
On their own profile, a trader can tap Verify my ID. Didit, an identity
verification company, performs a real check of a government ID and a
live selfie (with face match) on its own hosted page. AQTech GHub stores
only the result (`profiles.id_verified_at` and the private `kyc_checks`
row), never the ID photo, ID number or face scan. Verified traders get an
"ID verified" badge and a green line in the Trust check. It is optional
and never required to trade. Results are saved only through
`record_kyc_result`, which needs a server-only secret kept in Supabase
Vault; Didit's webhook is accepted only with a valid signature and a
recent timestamp.

## Ratings and reviews (ticket 23)
After a deal is completed, both traders can review each other once:
1–5 stars, optional quick tags (As described, Smooth handover, Fast
replies, Friendly, Paid on time) and an optional comment of up to 300
characters, with links blocked. Reviews can't be edited or deleted.
Reviews are "blind": each stays hidden until the other trader reviews
too, or until the 7-day review window after completion closes. Profiles
show the average, the review count, the top tags and the latest reviews,
each marked "Verified trade". The rating feeds the Trust check and the
trust badge: a low average (under 3★ from 3+ reviews) shows "Mixed
record", and "Top trader" needs 4.5★ or more once there are reviews.
Stars also show on trader cards and next to each trader's record in a
Deal Room. Data: `deal_reviews` (030).

## Stretch: listing photos (ticket 08)
Only after everything above works live. The seller may add up to 4
photos of the listed account to their Deal Room, stored in a private
Supabase Storage bucket. Sellers only. Photos are a showcase, not
verification: the live ownership code is the proof of control.

## Login
Yes. Supabase Auth with email and password, and email confirmation
turned on. Every trade action needs a logged-in trader, because the
whole point is knowing who confirmed each step.

Supabase's free built-in email sends only a few confirmation emails per
hour, so create and confirm the demo accounts the day before.

## Done for the demo
On the live URL:
- [ ] A new trader can sign up, confirm their email and log in.
- [ ] The seller creates a Deal Room and copies its deal code.
- [ ] The buyer enters the code, sees the seller's record and joins.
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
- A full admin panel in the app
- Roblox, Genshin and other games
- Holding money for users (escrow), or payment processing of any kind
- Phone or SMS verification
- A marketplace or listings search
- A cooling-off period after completion
- An automatic below-market price warning
- Phone push notifications and email alerts
- Cancelling or editing a deal after it's created
- Saving each Lock-In Checklist item separately
