# AQTech GHub

## Who
Mobile Legends: Bang Bang (MLBB) players in the Philippines who **buy**
accounts from strangers they meet in Facebook groups, Messenger group
chats, Discord and Telegram. Sellers benefit too, but when a design
choice conflicts, the buyer comes first.

## The struggle
Clark, a real MLBB player we know, wanted a high-rank account with rare
skins and maxed heroes. In the Facebook group "MLBB Account Trading PH"
he found a seller offering exactly that for ₱1,700, cheaper than similar
listings.

- The seller showed screenshots of the profile, heroes and skins, plus a
  short video of logging in, as "proof".
- The seller said: "I've sold 12 accounts here, check my comments — all
  good. No middleman needed, saves you extra fee." The positive comments
  turned out to be from fake accounts.
- The seller asked for GCash payment first. Clark paid ₱1,700 and sent
  the receipt. The seller replied "Give me 2 minutes to unlink my phone
  number", then blocked him on Facebook and Messenger and deleted the
  post.
- Facebook said it was a private transaction and took no action. GCash
  said it could not reverse a payment sent voluntarily.

Clark lost ₱1,700 and never got the account. In one week of asking
around class we found three more near-scams, including a buyer who was
asked for repeated "verification fees" and never received the account.

Scams we see in this market:
1. **Pay and vanish**: the buyer pays first and the seller disappears.
2. **Takeback**: after being paid, the seller recovers the account
   through a login method still bound to them.
3. **Fake proof**: screenshots, videos and comments that are faked or
   come from dummy accounts.
4. **Phishing**: links or requests designed to steal the other person's
   password or one-time code.

## Today's workaround
Buyers trust screenshots, login videos and comments, or pay a middleman
who holds the money for a fee, and middlemen can be scammers too. When it
fails, the buyer has no proof, no platform support and no way to get the
money back.

## The MVP
A Deal Room where one MLBB seller and one buyer complete a trade step by
step: the seller proves ownership with a live code, the buyer pays in two
halves around a guided Lock-In Checklist, and each step is confirmed and
timestamped.

MVP features:
1. Sign up with a confirmed email.
2. The seller creates a Deal Room for one listed account (price and
   description) and sends the link to the buyer. They still meet on
   Facebook; the site handles the deal itself.
3. **Live ownership code**: the seller puts a site-generated code in
   their MLBB in-game name or profile signature, and the buyer confirms
   seeing it.
4. **Split payment** (the site never touches the money): buyer pays 50%
   → seller confirms receipt → Lock-In Checklist → buyer confirms full
   control → buyer pays the remaining 50% → seller confirms receipt.
5. **Red-flag warnings**: "pay first", "verification fees", "no
   middleman needed", prices well below similar listings, and any
   request for a password or one-time code.
6. A **timestamped record** of every step, and a **completed-deals
   count** on each user's profile that dummy accounts cannot inflate.

Why a website and not a shared document: it locks steps in order,
records which person confirmed each step and when, and builds a deal
history that fake comments cannot inflate.

Honest limit: the buyer can still lose the first 50% if the seller
vanishes before the Lock-In Checklist. That halves the loss and leaves
an unfinished deal on the seller's record, but it does not make scams
impossible.

## How we'll know it worked
A live three-minute demo: a teammate playing the seller (with a real
MLBB account) and an MLBB player from outside the team playing the
buyer complete a trade from start to finish without the buyer needing
help. The outside buyer is confirmed.

The Lock-In Checklist is drafted in `docs/SPEC.md`. A teammate who plays
MLBB must check each item against the game's current settings before it
is built.

## Out of scope
- Government ID verification (planned next, through a licensed
  ID-verification provider)
- Roblox, Genshin and other games
- Holding money for users (escrow), or payment processing of any kind
- Phone or SMS verification
- A marketplace or listings search (deals still start on Facebook)
- In-site chat
- Star ratings and written reviews (only completed-deal counts for now)
- A cooling-off period and dispute handling after the deal
- Blocking links inside the Deal Room (the MVP shows warnings instead)

## Glossary
- **Listed account**: the MLBB account being sold.
- **User**: a person signed up on our website.
- **Buyer**: the user paying for a listed account.
- **Seller**: the user handing over a listed account.
- **Legit seller**: a seller who can prove, live, that they control the
  listed account right now. Screenshots, videos and comments do not
  count.
- **Binding**: how an MLBB account is connected to a login method
  (Moonton account, Facebook, Google Play, TikTok, Apple and so on).
- **Deal Room**: the shared page where one buyer and one seller complete
  one trade, step by step.
- **Live ownership code**: a random code the site gives the seller to
  put in the listed account's in-game name or signature, so the buyer
  can see the seller controls it.
- **Lock-In Checklist**: the steps that move every binding and recovery
  option of the listed account from the seller to the buyer.
- **Split payment**: the buyer pays half before the Lock-In Checklist
  and half after confirming full control.
- **Red flag**: a known scam behavior, such as "pay first",
  "verification fees", "no middleman needed", or a price well below
  similar listings.
