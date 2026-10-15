import { createClient } from "@/lib/supabase/server";

// "3 of 4 deals completed", counting deals as seller and as buyer.
// Shown as real numbers, not a percentage: a new trader with one deal
// would show "100%", which looks more trustworthy than it is.
export async function TraderRecord({ traderId }: { traderId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("trader_record", { p_trader_id: traderId });
  const record = data?.[0];
  const completed = record?.completed ?? 0;
  const total = completed + (record?.abandoned ?? 0);

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
