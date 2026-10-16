// Reviews: both traders rate each other after a completed deal. The
// rules (who, when, one each, hidden until both review) live in
// supabase/sql/030-reviews.sql.

import { DAY_MS } from "@/lib/utils";

// The quick tags a reviewer can tap. Ids match the SQL list.
const REVIEW_TAGS = [
  { id: "as_described", label: "As described", for: "seller" },
  { id: "smooth_handover", label: "Smooth handover", for: "both" },
  { id: "fast_replies", label: "Fast replies", for: "both" },
  { id: "friendly", label: "Friendly", for: "both" },
  { id: "paid_on_time", label: "Paid on time", for: "buyer" },
] as const;

const REVIEW_WINDOW_DAYS = 7;

export function tagLabel(id: string) {
  return REVIEW_TAGS.find((t) => t.id === id)?.label ?? id;
}

// The tags that make sense for the trader being reviewed.
export function tagsFor(role: "seller" | "buyer") {
  return REVIEW_TAGS.filter((t) => t.for === "both" || t.for === role);
}

export type Rating = { average: number; reviews: number; topTags: string[] };

// One trader's rating, from the trader_ratings() rows.
export function ratingFrom(
  rows: { trader_id: string; average: number | string; reviews: number; top_tags: string[] }[] | null,
  traderId: string,
): Rating | null {
  const row = rows?.find((r) => r.trader_id === traderId);
  if (!row || !row.reviews) return null;
  return { average: Number(row.average), reviews: row.reviews, topTags: row.top_tags ?? [] };
}

export function reviewWindowOpen(completedAt: string | null) {
  if (!completedAt) return false;
  return Date.now() - new Date(completedAt).getTime() < REVIEW_WINDOW_DAYS * DAY_MS;
}
