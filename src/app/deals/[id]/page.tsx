import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLink } from "@/components/copy-link";
import { createClient } from "@/lib/supabase/server";
import { STEP_LABELS, formatPesos } from "@/lib/deals";
import { joinDeal } from "@/app/deals/actions";

export default async function DealRoomPage(props: PageProps<"/deals/[id]">) {
  const { id } = await props.params;
  const { error } = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/deals/${id}`);

  // RLS only returns the deal if you are its seller or buyer.
  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, description, price, step, seller_id, buyer_id")
    .eq("id", id)
    .maybeSingle();

  if (!deal) return <DealPreview id={id} error={error} />;

  const isSeller = user.id === deal.seller_id;
  const ids = [deal.seller_id, deal.buyer_id].filter((x): x is string => Boolean(x));
  const { data: people } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  const nameOf = (pid: string | null) =>
    people?.find((p) => p.id === pid)?.display_name ?? "—";

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const dealUrl = `${proto}://${h.get("host")}/deals/${deal.id}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardDescription>Deal Room · {STEP_LABELS[deal.step]}</CardDescription>
          <CardTitle className="text-2xl">{deal.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xl font-semibold">{formatPesos(deal.price)}</p>
          {deal.description && (
            <p className="whitespace-pre-wrap text-sm">{deal.description}</p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Seller</dt>
            <dd>
              <Link href={`/profile/${deal.seller_id}`} className="underline">
                {nameOf(deal.seller_id)}
              </Link>
            </dd>
            <dt className="text-muted-foreground">Buyer</dt>
            <dd>
              {deal.buyer_id ? (
                <Link href={`/profile/${deal.buyer_id}`} className="underline">
                  {nameOf(deal.buyer_id)}
                </Link>
              ) : (
                "Not joined yet"
              )}
            </dd>
          </dl>
        </CardContent>
      </Card>

      {isSeller && !deal.buyer_id && (
        <Card>
          <CardHeader>
            <CardTitle>Send this link to your buyer</CardTitle>
            <CardDescription>
              They&apos;ll need to log in, then tap Join as buyer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyLink url={dealUrl} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}

// What a trader who isn't in the deal sees: a safe preview and a Join
// button. The preview function never returns the ownership code.
async function DealPreview({ id, error }: { id: string; error?: string | string[] }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("deal_preview", { p_deal_id: id });
  const preview = data?.[0];
  if (!preview) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
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
          <p className="text-sm">
            <span className="text-muted-foreground">Seller: </span>
            <Link href={`/profile/${preview.seller_id}`} className="underline">
              {preview.seller_name}
            </Link>
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {preview.has_buyer ? (
            <p className="text-sm text-muted-foreground">
              This deal already has a buyer.
            </p>
          ) : (
            <form action={joinDeal}>
              <input type="hidden" name="deal_id" value={preview.id} />
              <Button type="submit">Join as buyer</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
