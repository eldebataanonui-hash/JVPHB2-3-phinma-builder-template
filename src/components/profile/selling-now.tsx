import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatManilaDate, formatPesos } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";

// "Selling now": a seller's deals still waiting for a buyer, with the
// first listing photo. Tapping one opens the Deal Room preview, where
// the buyer sees the details and the seller's record before joining.
export async function SellingNow({ sellerId, sellerName }: { sellerId: string; sellerName: string }) {
  const supabase = await createClient();
  const { data: deals } = await supabase.rpc("open_deals", { p_seller_id: sellerId });

  // First photo of each deal (open deals' photos are visible to any
  // logged-in trader, see supabase/sql/022).
  const withPhotos = await Promise.all(
    (deals ?? []).map(async (d: { id: string; title: string; price: number; created_at: string }) => {
      const { data: files } = await supabase.storage
        .from("deal-photos")
        .list(d.id, { limit: 1, sortBy: { column: "name", order: "asc" } });
      const first = files?.[0]?.name;
      const { data: signed } = first
        ? await supabase.storage.from("deal-photos").createSignedUrl(`${d.id}/${first}`, 60 * 60)
        : { data: null };
      return { ...d, photo: signed?.signedUrl ?? null };
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selling now</CardTitle>
      </CardHeader>
      <CardContent>
        {withPhotos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {sellerName} has no accounts for sale right now.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {withPhotos.map((d) => (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-secondary/40 transition-colors hover:border-primary/60"
              >
                {d.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.photo} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <span className="flex aspect-video w-full items-center justify-center bg-secondary text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                  </span>
                )}
                <span className="flex flex-col gap-1 p-3">
                  <span className="text-sm font-semibold">{d.title}</span>
                  <span className="flex items-center justify-between text-sm">
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold text-primary">
                      {formatPesos(d.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Listed {formatManilaDate(d.created_at)}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-primary">View and join →</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
