import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TraderRecord } from "@/components/trader-record";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { updateBio } from "@/app/profile/actions";
import { STEP_LABELS, formatPesos } from "@/lib/deals";

export default async function ProfilePage(props: PageProps<"/profile/[id]">) {
  const { id } = await props.params;
  const { error: errorCode, saved } = await props.searchParams;
  const error = errorText(errorCode);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/profile/${id}`);

  // RLS allows any logged-in trader to read profiles.
  const { data: profile, error: loadError } = await supabase
    .from("profiles")
    .select("display_name, created_at, bio")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return <ProblemNotice message="Could not load this profile. Please try again." />;
  if (!profile) notFound();

  const isMe = user.id === id;

  // RLS only returns deals you are the seller or buyer in, so on your
  // own profile this is simply "my deals".
  const { data: deals } = isMe
    ? await supabase
        .from("deals")
        .select("id, title, price, step, seller_id")
        .order("created_at", { ascending: false })
    : { data: null };
  const joined = new Date(profile.created_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* A profile only exists once the email is confirmed (see 003 SQL). */}
          <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-xs font-medium">
            ✓ Email confirmed
          </span>
          <p className="text-sm text-muted-foreground">Joined {joined}</p>
          <TraderRecord traderId={id} />
          {profile.bio ? (
            <p className="whitespace-pre-wrap text-sm">{profile.bio}</p>
          ) : (
            !isMe && (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )
          )}
          {!isMe && (
            <Link href={`/messages/${id}`} className={`${buttonVariants()} w-fit`}>
              Message
            </Link>
          )}
        </CardContent>
      </Card>

      {isMe && (
        <Card>
          <CardHeader>
            <CardTitle>Your description</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateBio} className="flex flex-col gap-2">
              <Textarea
                name="bio"
                defaultValue={profile.bio}
                maxLength={500}
                rows={3}
                placeholder="e.g. MLBB seller since 2022. Mythic accounts, fast replies."
                aria-label="Your description"
              />
              <p className="text-xs text-muted-foreground">
                Up to 500 characters. Links aren&apos;t allowed.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {saved && <p className="text-sm">Saved.</p>}
              <Button type="submit" variant="outline" className="w-fit">
                Save description
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isMe && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Selling</CardTitle>
              <Link href="/deals/new" className={buttonVariants({ size: "sm" })}>
                New Deal
              </Link>
            </CardHeader>
            <CardContent>
              <DealList
                deals={deals?.filter((d) => d.seller_id === user.id)}
                empty="You're not selling anything yet. Tap New Deal to start."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buying</CardTitle>
            </CardHeader>
            <CardContent>
              <DealList
                deals={deals?.filter((d) => d.seller_id !== user.id)}
                empty="You haven't joined any deals yet. Open a seller's Deal Room link to join."
              />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

function DealList({
  deals,
  empty,
}: {
  deals?: { id: string; title: string; price: number; step: string }[];
  empty: string;
}) {
  if (!deals?.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {deals.map((deal) => (
        <Link
          key={deal.id}
          href={`/deals/${deal.id}`}
          className="flex flex-col gap-1 rounded-[var(--radius)] border border-border p-3 hover:bg-secondary"
        >
          <span className="flex justify-between gap-3 text-sm font-medium">
            <span>{deal.title}</span>
            <span>{formatPesos(deal.price)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {STEP_LABELS[deal.step]}
          </span>
        </Link>
      ))}
    </div>
  );
}

// Shows a database problem on the page, so the team can see what failed.
function ProblemNotice({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-12">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-destructive">{message}</p>
    </main>
  );
}
