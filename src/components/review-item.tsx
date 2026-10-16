import { BadgeCheck } from "lucide-react";
import { Stars } from "@/components/stars";
import { formatManilaDate } from "@/lib/deals";
import { tagLabel } from "@/lib/reviews";

export type Review = {
  id: number;
  reviewer_id: string;
  reviewee_role: string;
  stars: number;
  tags: string[];
  comment: string;
  created_at: string;
};

// One review: stars, who wrote it, tags and comment. "Verified trade"
// because a review can only come from a completed Deal Room.
export function ReviewItem({
  review,
  authorName,
  note,
}: {
  review: Review;
  authorName: string;
  note?: string;
}) {
  const authorRole = review.reviewee_role === "seller" ? "buyer" : "seller";
  return (
    <li className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.stars} />
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified trade
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {authorName} · as the {authorRole} · {formatManilaDate(review.created_at)}
      </p>
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <span key={t} className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {tagLabel(t)}
            </span>
          ))}
        </div>
      )}
      {review.comment && <p className="whitespace-pre-wrap break-words text-sm">{review.comment}</p>}
      {note && <p className="text-xs text-amber-400">{note}</p>}
    </li>
  );
}
