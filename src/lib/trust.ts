// The Trust check and trust level on a trader's profile. Everything is
// worked out from their real record (finished deals, abandoned deals,
// account age, activity, linked social media), never from what they
// claim about themselves. It's a guide, not a guarantee.

export type TraderFacts = {
  joinedAt: string;
  completedAsSeller: number;
  completedAsBuyer: number;
  abandoned: number;
  lastActive: string | null;
  socialsLinked: string[];
  idVerified: boolean;
};

export type TrustItem = { ok: boolean | null; text: string };

const DAY = 86_400_000;

export function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY));
}

export function trustLevel(f: TraderFacts) {
  const completed = f.completedAsSeller + f.completedAsBuyer;
  const finished = completed + f.abandoned;
  const rate = finished ? completed / finished : 1;

  if (completed === 0) return { label: "New trader", tone: "muted" as const };
  if (rate < 0.8) return { label: "Mixed record", tone: "warn" as const };
  if (completed >= 10 && rate >= 0.9) return { label: "Top trader", tone: "good" as const };
  if (completed >= 3) return { label: "Trusted trader", tone: "good" as const };
  return { label: "Getting started", tone: "muted" as const };
}

export function trustCheck(f: TraderFacts): TrustItem[] {
  const completed = f.completedAsSeller + f.completedAsBuyer;
  const age = daysSince(f.joinedAt);
  const items: TrustItem[] = [{ ok: true, text: "Email confirmed" }];
  // Optional ID check through Didit (sandbox demo for now).
  items.push(
    f.idVerified
      ? { ok: true, text: "ID verified (demo, via Didit)" }
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
