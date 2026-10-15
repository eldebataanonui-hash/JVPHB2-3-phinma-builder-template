import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { STEP_LABELS, formatPesos } from "@/lib/deals";
import { logOut } from "@/app/auth/actions";

export default async function ProfilePage(props: PageProps<"/profile/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/profile/${id}`);

  // RLS allows any logged-in trader to read profiles.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return <ProblemNotice message={`Could not load profile: ${error.message}`} />;
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
        </CardContent>
      </Card>

      {isMe && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>My Deal Rooms</CardTitle>
            <Link href="/deals/new" className={buttonVariants({ size: "sm" })}>
              New Deal
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!deals?.length && (
              <p className="text-sm text-muted-foreground">No deals yet.</p>
            )}
            {deals?.map((deal) => (
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
                  {deal.seller_id === user.id ? "Selling" : "Buying"} ·{" "}
                  {STEP_LABELS[deal.step]}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {isMe && (
        <form action={logOut}>
          <Button type="submit" variant="outline">Log out</Button>
        </form>
      )}
    </main>
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
