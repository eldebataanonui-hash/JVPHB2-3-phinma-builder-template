"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tagsFor } from "@/lib/reviews";
import { cn, plural } from "@/lib/utils";
import { submitReview } from "@/app/deals/actions";

const WORDS = ["", "Bad", "Poor", "Okay", "Good", "Excellent"];

// Tap 1 to 5 stars, tap any quick tags, add an optional comment.
export function ReviewForm({
  dealId,
  otherName,
  otherRole,
}: {
  dealId: string;
  otherName: string;
  otherRole: "seller" | "buyer";
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || stars;

  return (
    <form action={submitReview} className="flex flex-col gap-3">
      <input type="hidden" name="deal_id" value={dealId} />
      <input type="hidden" name="stars" value={stars || ""} />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">
          How was trading with {otherName} (the {otherRole})?
        </legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={plural(n, "star")}
              aria-pressed={stars === n}
              className="rounded p-1"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50",
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{WORDS[shown]}</span>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Tap any that fit (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {tagsFor(otherRole).map((t) => (
            <label
              key={t.id}
              className="cursor-pointer rounded-full border border-border bg-secondary px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:font-semibold"
            >
              <input type="checkbox" name="tags" value={t.id} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Textarea
        name="comment"
        maxLength={300}
        rows={2}
        placeholder="A short comment (optional). Links aren't allowed."
        aria-label="Comment"
      />

      <p className="text-xs text-muted-foreground">
        Reviews can&apos;t be edited or deleted. {otherName} sees yours once
        they review you too, or 7 days after the deal completed, so nobody
        can rate in revenge.
      </p>

      <Button type="submit" className="w-fit" disabled={!stars}>
        Post review
      </Button>
    </form>
  );
}
