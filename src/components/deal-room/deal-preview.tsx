import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RedFlags } from "@/components/red-flags";
import { TraderRecord } from "@/components/trader-record";
import { DealPhotos } from "@/components/deal-room/deal-photos";
import { formatPesos } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";
import { joinDeal } from "@/app/deals/actions";

// What a trader who isn't in the deal sees: a safe preview and a Join
// button. The preview function never returns the ownership code.
export async function DealPreview({ id, error }: { id: string; error: string | null }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("deal_preview", { p_deal_id: id });
  const preview = data?.[0];
  if (!preview) notFound();

  // Once a buyer joins, the deal is private: no title, price or seller.
  if (preview.has_buyer || !preview.title || !preview.seller_id) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>This deal already has a buyer</CardTitle>
            <CardDescription>
              Deal Rooms are private once a buyer joins.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardDescription>Deal Room preview</CardDescription>
          <CardTitle className="text-2xl">{preview.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xl font-semibold">{formatPesos(preview.price)}</p>
          {preview.description && (
            <p className="whitespace-pre-wrap text-sm">{preview.description}</p>
          )}
          <DealPhotos dealId={preview.id} isSeller={false} />
          <p className="text-sm">
            <span className="text-muted-foreground">Seller: </span>
            <Link href={`/profile/${preview.seller_id}`} className="underline">
              {preview.seller_name}
            </Link>
          </p>
          <div className="flex gap-1 text-sm">
            <span className="text-muted-foreground">Seller&apos;s record:</span>
            <TraderRecord traderId={preview.seller_id} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <form action={joinDeal}>
            <input type="hidden" name="deal_id" value={preview.id} />
            <Button type="submit">Join as buyer</Button>
          </form>
        </CardContent>
      </Card>

      <RedFlags />
    </main>
  );
}
