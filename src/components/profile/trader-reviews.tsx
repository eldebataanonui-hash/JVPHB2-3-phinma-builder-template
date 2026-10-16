import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Review, ReviewItem } from "@/components/review-item";
import { Stars } from "@/components/stars";
import { type Rating, tagLabel } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { plural } from "@/lib/utils";

// Reviews of a trader, from their completed deals: the average, the
// most common tags and the latest reviews. RLS only returns revealed
// reviews (plus any you wrote yourself).
export async function TraderReviews({
  traderId,
  viewerId,
  rating,
}: {
  traderId: string;
  viewerId: string;
  rating: Rating | null;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deal_reviews")
    .select("id, deal_id, reviewer_id, reviewee_role, stars, tags, comment, created_at")
    .eq("reviewee_id", traderId)
    .order("created_at", { ascending: false })
    .limit(10);
  const reviews: (Review & { deal_id: string })[] = data ?? [];

  // RLS also returns reviews you wrote yourself, even while they're still
  // hidden. Those aren't in the average yet, so label them.
  const hiddenMine = new Set<number>();
  for (const r of reviews.filter((r) => r.reviewer_id === viewerId)) {
    const { data: revealed } = await supabase.rpc("review_is_revealed", {
      p_deal_id: r.deal_id,
      p_reviewer_id: r.reviewer_id,
    });
    if (revealed === false) hiddenMine.add(r.id);
  }

  const authorIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const nameOf = (id: string) => authors?.find((a) => a.id === id)?.display_name ?? "A trader";

  return (
    <Card id="reviews">
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
        <CardDescription>
          Only traders who completed a Deal Room with them can review. Reviews
          can&apos;t be edited or deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rating ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold">
              {rating.average.toFixed(1)}
            </span>
            <div className="flex flex-col gap-0.5">
              <Stars value={rating.average} />
              <span className="text-xs text-muted-foreground">
                from {plural(rating.reviews, "review")}
              </span>
            </div>
            {rating.topTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rating.topTags.map((t) => (
                  <span key={t} className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {tagLabel(t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Reviews appear after completed deals.
          </p>
        )}

        {reviews.length > 0 && (
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                authorName={nameOf(r.reviewer_id)}
                note={
                  hiddenMine.has(r.id)
                    ? "Your review: only you can see it until they review you too, or 7 days after the deal completed. It isn't in the average yet."
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
