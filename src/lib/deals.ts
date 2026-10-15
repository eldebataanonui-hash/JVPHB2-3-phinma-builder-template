// Plain-English labels for each deal step. The step names match the
// check constraint in supabase/sql/006-create-deals.sql.
export const STEP_LABELS: Record<string, string> = {
  waiting_for_buyer: "Waiting for a buyer",
  awaiting_code: "Seller to place the ownership code",
  code_placed: "Buyer to confirm the code",
  awaiting_first_payment: "Buyer to send the first half",
  first_payment_sent: "Seller to confirm the first half",
  awaiting_lock_in: "Seller to complete the Lock-In Checklist",
  lock_in_done: "Buyer to confirm full control",
  awaiting_second_payment: "Buyer to send the second half",
  second_payment_sent: "Seller to confirm the second half",
  completed: "Completed",
};

// Who acts at each step, and what their button says. This mirrors the
// table in supabase/sql/007-create-deal-events.sql, where the database
// enforces it. This copy only decides what the page shows.
export const STEP_ACTIONS: Record<
  string,
  { actor: "seller" | "buyer"; button: string }
> = {
  awaiting_code: { actor: "seller", button: "I've placed the code" },
  code_placed: { actor: "buyer", button: "I saw the code in the game" },
  awaiting_first_payment: { actor: "buyer", button: "I've sent the first half" },
  first_payment_sent: { actor: "seller", button: "The first half arrived" },
  awaiting_lock_in: { actor: "seller", button: "I've done my checklist steps" },
  lock_in_done: { actor: "buyer", button: "I have full control" },
  awaiting_second_payment: { actor: "buyer", button: "I've sent the second half" },
  second_payment_sent: { actor: "seller", button: "The second half arrived" },
};

// The six stages shown as progress in the Deal Room.
export const STAGES = [
  { label: "Buyer joins", steps: ["waiting_for_buyer"] },
  { label: "Ownership code", steps: ["awaiting_code", "code_placed"] },
  { label: "First half", steps: ["awaiting_first_payment", "first_payment_sent"] },
  { label: "Lock-In Checklist", steps: ["awaiting_lock_in", "lock_in_done"] },
  { label: "Second half", steps: ["awaiting_second_payment", "second_payment_sent"] },
  { label: "Completed", steps: ["completed"] },
];

// How the buyer will pay. The ids match the check in
// supabase/sql/017-payment-method.sql. AQTech GHub never moves money;
// this only tells the seller which app to check.
export const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash" },
  { id: "maya", label: "Maya (PayMaya)" },
  { id: "maribank", label: "MariBank" },
  { id: "gotyme", label: "GoTyme Bank" },
  { id: "shopeepay", label: "ShopeePay" },
  { id: "instapay", label: "InstaPay (any bank)" },
] as const;

export function paymentLabel(id: string | null) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? null;
}

// How each line in the timestamped record reads.
export const EVENT_LABELS: Record<string, string> = {
  buyer_joined: "joined as buyer",
  payment_method_chosen: "chose how to pay",
  code_placed: "placed the ownership code",
  code_confirmed: "confirmed seeing the code in the game",
  first_half_sent: "sent the first half",
  first_half_received: "confirmed the first half arrived",
  lock_in_done: "completed the seller's Lock-In steps",
  full_control_confirmed: "confirmed full control of the account",
  second_half_sent: "sent the second half",
  second_half_received: "confirmed the second half arrived",
};

// Draft Lock-In Checklist from docs/SPEC.md. The team must check these
// against the game's current settings; MLBB menus change between updates.
export const LOCK_IN_SELLER = [
  "Change the account's bound Moonton email to the buyer's email. If Moonton sends the buyer a binding code, the buyer shares it in this Deal Room's chat. That is the only code ever shared.",
  "Remove every third-party login bound to you (Facebook, Google Play, TikTok, Apple, VK or others).",
];
export const LOCK_IN_BUYER = [
  "Bind at least one of your own third-party logins as a backup.",
  "Log in on your own device with your own login.",
  "Open the account settings and check that every bound login and email belongs to you, and nothing belongs to the seller.",
  "Change the password, and keep the setting that sends new-device login codes to the bound email turned on.",
];

// The buyer pays in two halves. Any odd peso goes in the first half.
export function splitPrice(price: number) {
  const first = Math.ceil(price / 2);
  return { first, second: price - first };
}

export function formatPesos(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

// "Active today", "Active 3 days ago": rough on purpose, so it shows
// who's around without tracking exactly when.
export function formatLastActive(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "Active today";
  if (days === 1) return "Active yesterday";
  if (days < 30) return `Active ${days} days ago`;
  return "Not active this month";
}

export function formatManilaDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}

export function formatManilaTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}
