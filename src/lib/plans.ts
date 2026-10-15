// Subscription plans and the free trial. For now this is display only:
// no payments are taken and nothing is locked. Prices are null until the
// team decides them and adds a payment provider (see docs/LATER.md).

export const TRIAL_DAYS = 14;

export type Plan = {
  id: "monthly" | "biannual" | "annual";
  name: string;
  period: string;
  price: number | null; // pesos per period; null = to be announced
  note: string;
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  { id: "monthly", name: "Monthly", period: "per month", price: null, note: "Flexible. Cancel anytime." },
  { id: "biannual", name: "Bi-annual", period: "every 6 months", price: null, note: "Save compared with monthly." },
  {
    id: "annual",
    name: "Annual",
    period: "per year",
    price: null,
    note: "Best value for regular traders.",
    highlight: true,
  },
];

// Everything here works today, for every trader.
export const INCLUDED_TODAY = [
  "Unlimited Deal Rooms with the live ownership code",
  "Two-half payments with GCash, Maya, MariBank and more",
  "Lock-In Checklist and encrypted login handover",
  "Timestamped record and printable trade receipt",
  "Trust check, trader stats and Selling now",
  "Deal Room chat, direct messages and notifications",
];

// Ideas for paid plans. Not built yet: always shown as "planned".
export const PLANNED_PERKS = [
  "Priority placement in Suggested traders",
  "Pro badge on your profile",
  "More listing photos per deal",
  "Faster response on reported concerns",
];

const DAY = 86_400_000;

// The free trial runs for TRIAL_DAYS from the day the profile was made.
export function trialInfo(createdAt: string) {
  const endsAt = new Date(new Date(createdAt).getTime() + TRIAL_DAYS * DAY);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY));
  return { endsAt, daysLeft, active: daysLeft > 0 };
}
