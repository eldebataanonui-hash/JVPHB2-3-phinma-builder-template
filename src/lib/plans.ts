// Subscription plans and the free trial. Every price, saving and perk on
// the Plans page comes from here, so they can't disagree.
//
// No payments are taken yet: traders can pick a plan (saved in
// plan_picks, see supabase/sql/031-plan-picks.sql) and nobody is
// charged. Real billing needs a payment provider (see docs/LATER.md).
// The safety features are free for everyone, always.

export const TRIAL_DAYS = 14;

// What Clark lost in one scam. Used to show what a plan costs next to
// what one scam costs.
export const TYPICAL_SCAM_LOSS = 1700;

export type PlanId = "monthly" | "biannual" | "annual";

export type Plan = {
  id: PlanId;
  name: string;
  months: number;
  price: number; // pesos per billing period
  period: string;
  forWho: string;
  why: string;
  perks: string[];
  highlight?: boolean;
};

// Paid perks. None of them are safety features: those stay free.
const PRO_PERKS = [
  "Pro badge on your profile and trader card",
  "Up to 10 listing photos per deal (free: 4)",
  "Priority spot in Suggested traders",
];

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    months: 1,
    price: 49,
    period: "per month",
    forWho: "Selling one or two accounts",
    why: "Stand out for the month you're selling, then stop. No commitment.",
    perks: PRO_PERKS,
  },
  {
    id: "biannual",
    name: "Bi-annual",
    months: 6,
    price: 249,
    period: "every 6 months",
    forWho: "Trading every ranked season",
    why: "Covers about two MLBB ranked seasons, so your badge and reviews keep working while you trade.",
    perks: [...PRO_PERKS, "Concerns answered within 24 hours (free: 48)"],
  },
  {
    id: "annual",
    name: "Annual",
    months: 12,
    price: 399,
    period: "per year",
    forWho: "Regular sellers and resellers",
    why: "The lowest monthly price. A full year costs less than a quarter of what Clark lost in one scam.",
    perks: [
      ...PRO_PERKS,
      "Concerns answered within 24 hours (free: 48)",
      "Top placement in Suggested traders",
      "Founding trader badge, for early subscribers",
    ],
    highlight: true,
  },
];

// Free forever: every safety feature, for every trader.
export const FREE_FOREVER = [
  "Unlimited Deal Rooms with the live ownership code",
  "Two-half payments with GCash, Maya, MariBank and more",
  "Lock-In Checklist and encrypted login handover",
  "Timestamped record and printable trade receipt",
  "Trust check, star ratings and reviews",
  "Chat, direct messages and notifications",
  "Up to 4 listing photos per deal",
];

export function planById(id: string) {
  return PLANS.find((p) => p.id === id) ?? null;
}

export function perMonth(plan: Plan) {
  return plan.price / plan.months;
}

// Percent saved against paying Monthly for the same number of months.
export function savingPercent(plan: Plan) {
  const monthly = PLANS[0];
  const full = monthly.price * plan.months;
  return Math.round(((full - plan.price) / full) * 100);
}

export function formatPeso(n: number) {
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 })}`;
}

const DAY = 86_400_000;

// The free trial runs for TRIAL_DAYS from the day the profile was made.
export function trialInfo(createdAt: string) {
  const endsAt = new Date(new Date(createdAt).getTime() + TRIAL_DAYS * DAY);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY));
  return { endsAt, daysLeft, active: daysLeft > 0 };
}
