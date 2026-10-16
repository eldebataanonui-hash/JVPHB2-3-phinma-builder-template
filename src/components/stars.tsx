import { Star } from "lucide-react";
import type { Rating } from "@/lib/reviews";
import { cn } from "@/lib/utils";

// Five stars, filled up to `value` (rounded to the nearest whole star).
export function Stars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50")}
        />
      ))}
    </span>
  );
}

// "★ 4.8 · 12 reviews", or "No reviews yet".
export function RatingText({ rating }: { rating: Rating | null }) {
  if (!rating) return <p className="text-sm text-muted-foreground">No reviews yet</p>;
  return (
    <p className="flex items-center gap-1.5 text-sm">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold">{rating.average.toFixed(1)}</span>
      <span className="text-muted-foreground">
        · {rating.reviews} review{rating.reviews === 1 ? "" : "s"}
      </span>
    </p>
  );
}
