import { createClient } from "@/lib/supabase/server";
import { DealPhotoUpload } from "@/components/deal-room/deal-photo-upload";
import { deleteDealPhoto } from "@/app/deals/actions";

const MAX_PHOTOS = 4;

// Photos of the listed account. The bucket is private: the storage
// rules decide who may see them, and we hand out links that expire
// after an hour.
export async function DealPhotos({ dealId, isSeller }: { dealId: string; isSeller: boolean }) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage
    .from("deal-photos")
    .list(dealId, { sortBy: { column: "name", order: "asc" } });
  const names = (files ?? []).map((f) => f.name).filter((n) => /\.(jpg|png|webp)$/.test(n));

  const { data: signed } = names.length
    ? await supabase.storage
        .from("deal-photos")
        .createSignedUrls(names.map((n) => `${dealId}/${n}`), 60 * 60)
    : { data: [] };
  const photos = (signed ?? [])
    .map((s, i) => ({ name: names[i], url: s.signedUrl }))
    .filter((p): p is { name: string; url: string } => Boolean(p.url));

  if (!photos.length && !isSeller) return null;

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.name} className="relative">
              <a href={p.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt="Photo of the listed account"
                  className="aspect-square w-full rounded-[var(--radius)] border border-border object-cover"
                />
              </a>
              {isSeller && (
                <form action={deleteDealPhoto} className="absolute right-1 top-1">
                  <input type="hidden" name="deal_id" value={dealId} />
                  <input type="hidden" name="name" value={p.name} />
                  <button
                    type="submit"
                    className="rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Remove this photo"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Photos show what&apos;s on offer. They don&apos;t prove ownership. The
        live code does.
      </p>
      {isSeller && photos.length < MAX_PHOTOS && (
        <DealPhotoUpload dealId={dealId} remaining={MAX_PHOTOS - photos.length} />
      )}
    </div>
  );
}
