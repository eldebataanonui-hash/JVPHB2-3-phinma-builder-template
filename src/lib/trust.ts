// The Trust check and trust level on a trader's profile. Everything is
// worked out from their real record (finished deals, abandoned deals,
// star ratings from completed deals, account age, activity, linked
// social media), never from what they claim about themselves. It's a
// guide, not a guarantee.

import type { Rating } from "@/lib/reviews";
import { DAY_MS } from "@/lib/utils";

export type TraderFacts = {
  joinedAt: string;
  completedAsSeller: number;
  completedAsBuyer: number;
  abandoned: number;
  lastActive: string | null;
  socialsLinked: string[];
  idVerified: boolean;
  rating: Rating | null;
};

// A low average only counts once there are enough reviews to mean
// something: one unhappy trader shouldn't sink a new account.
const LOW_RATING = 3;
const TOP_RATING = 4.5;
const MIN_REVIEWS = 3;

export type TrustItem = { ok: boolean | null; text: string };


export function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

export function trustLevel(f: TraderFacts) {
  const completed = f.completedAsSeller + f.completedAsBuyer;
  const finished = completed + f.abandoned;
  const rate = finished ? completed / finished : 1;

  const r = f.rating;
  const lowRated = r !== null && r.reviews >= MIN_REVIEWS && r.average < LOW_RATING;

  if (completed === 0) return { label: "New trader", tone: "muted" as const };
  if (rate < 0.8 || lowRated) return { label: "Mixed record", tone: "warn" as const };
  // Top trader needs great reviews too, once they have any.
  if (completed >= 10 && rate >= 0.9 && (!r || r.average >= TOP_RATING)) {
    return { label: "Top trader", tone: "good" as const };
  }
  if (completed >= 3) return { label: "Trusted trader", tone: "good" as const };
  return { label: "Getting started", tone: "muted" as const };
}

export function trustCheck(f: TraderFacts): TrustItem[] {
  const completed = f.completedAsSeller + f.completedAsBuyer;
  const age = daysSince(f.joinedAt);
  const items: TrustItem[] = [{ ok: true, text: "Email confirmed" }];
  // Optional real ID + selfie check performed by Didit.
  items.push(
    f.idVerified
      ? { ok: true, text: "ID verified (via Didit)" }
      : { ok: null, text: "ID not verified (optional)" },
  );

  if (age < 7) items.push({ ok: false, text: `New account: joined ${age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"} ago`}` });
  else items.push({ ok: true, text: `Member for ${age} days` });

  if (completed > 0) {
    items.push({
      ok: true,
      text: `${completed} finished deal${completed === 1 ? "" : "s"} (${f.completedAsSeller} as seller, ${f.completedAsBuyer} as buyer)`,
    });
  } else {
    items.push({ ok: false, text: "No finished deals yet" });
  }

  const r = f.rating;
  if (!r) {
    items.push({ ok: null, text: "No reviews yet" });
  } else if (r.reviews >= MIN_REVIEWS && r.average < LOW_RATING) {
    items.push({ ok: false, text: `Low rating: ${r.average.toFixed(1)}★ from ${r.reviews} reviews` });
  } else if (r.average >= 4) {
    items.push({ ok: true, text: `Rated ${r.average.toFixed(1)}★ from ${r.reviews} review${r.reviews === 1 ? "" : "s"} by real trades` });
  } else {
    items.push({ ok: null, text: `Rated ${r.average.toFixed(1)}★ from ${r.reviews} review${r.reviews === 1 ? "" : "s"}` });
  }

  if (f.abandoned > 0) {
    items.push({ ok: false, text: `${f.abandoned} abandoned deal${f.abandoned === 1 ? "" : "s"}` });
  }

  // Social usernames are typed in by the trader and not checked, so they
  // never earn a green tick: anyone could list a trusted seller's account.
  if (f.socialsLinked.length) {
    items.push({ ok: null, text: `Social media listed: ${f.socialsLinked.join(", ")} (not verified)` });
  } else {
    items.push({ ok: null, text: "No social media listed" });
  }

  if (f.lastActive && daysSince(f.lastActive) <= 7) items.push({ ok: true, text: "Traded in the last 7 days" });
  else if (!f.lastActive) items.push({ ok: null, text: "Hasn't traded yet" });
  else items.push({ ok: null, text: `Last traded ${daysSince(f.lastActive)} days ago` });

  return items;
}
