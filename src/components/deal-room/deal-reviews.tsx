import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/deal-room/review-form";
import { type Review, ReviewItem } from "@/components/review-item";
import { reviewWindowOpen } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

// "Rate this trade", on a completed Deal Room. RLS returns your own
// review, and the other trader's only once it's revealed (both reviewed,
// or the 7-day window closed).
export async function DealReviews({
  dealId,
  myId,
  isSeller,
  otherName,
  completedAt,
  names,
  error,
}: {
  dealId: string;
  myId: string;
  isSeller: boolean;
  otherName: string;
  completedAt: string | null;
  names: Record<string, string>;
  error: string | null;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deal_reviews")
    .select("id, reviewer_id, reviewee_role, stars, tags, comment, created_at")
    .eq("deal_id", dealId)
    .order("id");
  const reviews: Review[] = data ?? [];
  const mine = reviews.find((r) => r.reviewer_id === myId);
  const theirs = reviews.find((r) => r.reviewer_id !== myId);
  const open = reviewWindowOpen(completedAt);

  return (
    <Card id="review" className={!mine && open ? "border-primary" : undefined}>
      <CardHeader>
        <CardTitle>{mine ? "Reviews" : "Rate this trade"}</CardTitle>
        <CardDescription>
          Reviews show on both traders&apos; profiles, so the next buyer or
          seller knows who to trust. Only traders in a completed Deal Room
          can leave one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!mine && open && (
          <ReviewForm dealId={dealId} otherName={otherName} otherRole={isSeller ? "buyer" : "seller"} />
        )}
        {!mine && !open && (
          <p className="text-sm text-muted-foreground">
            The review window closed 7 days after this deal completed.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {mine && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Your review of {otherName}</p>
            <ul>
              <ReviewItem review={mine} authorName={names[myId] ?? "You"} />
            </ul>
            {!theirs && open && (
              <p className="text-xs text-muted-foreground">
                Hidden from {otherName} until they review you too, or until 7
                days after the deal completed.
              </p>
            )}
          </div>
        )}

        {theirs && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{otherName}&apos;s review of you</p>
            <ul>
              <ReviewItem review={theirs} authorName={names[theirs.reviewer_id] ?? otherName} />
            </ul>
          </div>
        )}
        {mine && !theirs && open && (
          <p className="text-sm text-muted-foreground">
            {otherName}&apos;s review of you will show here once it&apos;s
            revealed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
