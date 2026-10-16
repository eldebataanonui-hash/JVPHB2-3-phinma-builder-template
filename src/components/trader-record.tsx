import { RatingText } from "@/components/stars";
import { ratingFrom } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

// "3 of 4 deals completed", counting deals as seller and as buyer.
// Shown as real numbers, not a percentage: a new trader with one deal
// would show "100%", which looks more trustworthy than it is.
export function RecordText({ completed, abandoned }: { completed: number; abandoned: number }) {
  const total = completed + abandoned;
  return (
    <p className="text-sm">
      {total === 0 ? (
        <span className="text-muted-foreground">No finished deals yet</span>
      ) : (
        <>
          <span className="font-semibold">
            {completed} of {total}
          </span>{" "}
          deals completed
        </>
      )}
    </p>
  );
}

// Looks up one trader's record and star rating and shows them.
export async function TraderRecord({ traderId }: { traderId: string }) {
  const supabase = await createClient();
  const [{ data }, { data: ratings }] = await Promise.all([
    supabase.rpc("trader_record", { p_trader_id: traderId }),
    supabase.rpc("trader_ratings", { p_trader_ids: [traderId] }),
  ]);
  const record = data?.[0];
  return (
    <div className="flex flex-col gap-0.5">
      <RecordText completed={record?.completed ?? 0} abandoned={record?.abandoned ?? 0} />
      <RatingText rating={ratingFrom(ratings, traderId)} />
    </div>
  );
}
