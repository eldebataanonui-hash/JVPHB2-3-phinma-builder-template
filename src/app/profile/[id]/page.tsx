import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { TraderRecord } from "@/components/trader-record";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { updateBio, updateSocials } from "@/app/profile/actions";
import { SOCIALS } from "@/lib/socials";
import { AtSign, ExternalLink } from "lucide-react";
import { STEP_LABELS, formatPesos } from "@/lib/deals";

export default async function ProfilePage(props: PageProps<"/profile/[id]">) {
  const { id } = await props.params;
  const { error: errorCode, saved, social_error, socials_saved } = await props.searchParams;
  const error = errorText(errorCode);
  const socialError = errorText(social_error);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/profile/${id}`);

  // RLS allows any logged-in trader to read profiles.
  const { data: profile, error: loadError } = await supabase
    .from("profiles")
    .select("display_name, created_at, bio, avatar_path, social_facebook, social_instagram, social_tiktok, social_x, social_youtube, social_discord")
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar name={profile.display_name} path={profile.avatar_path} size={72} />
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="truncate text-2xl">{profile.display_name}</CardTitle>
            {isMe && <AvatarUpload userId={id} hasPicture={Boolean(profile.avatar_path)} />}
          </div>
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
          <SocialLinks profile={profile} />
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
        <Card id="socials">
          <CardHeader>
            <CardTitle>Social media (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSocials} className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Add your usernames so buyers and sellers can check you&apos;re
                real. Just the username, like <span className="font-mono">desay.ml</span>,
                not a web address. Leave any blank.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOCIALS.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <Label htmlFor={s.key}>{s.label}</Label>
                    <Input
                      id={s.key}
                      name={s.key}
                      defaultValue={profile[s.key] ?? ""}
                      maxLength={200}
                      placeholder="username"
                      autoCapitalize="none"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
              {socialError && <p className="text-sm text-destructive">{socialError}</p>}
              {socials_saved && <p className="text-sm">Saved.</p>}
              <Button type="submit" variant="outline" className="w-fit">
                Save social media
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
                empty="You haven't joined any deals yet. Enter a seller's deal code on Join a deal."
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-destructive">{message}</p>
    </main>
  );
}

// A trader's social media. Links are built from usernames by
// src/lib/socials.ts, always to the real site, never typed in by users.
function SocialLinks({
  profile,
}: {
  profile: Partial<Record<(typeof SOCIALS)[number]["key"], string | null>>;
}) {
  const filled = SOCIALS.filter((s) => profile[s.key]);
  if (!filled.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {filled.map((s) => {
          const username = profile[s.key] as string;
          const chip =
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs";
          return s.url ? (
            <a
              key={s.key}
              href={s.url(username)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${chip} hover:border-primary/50`}
            >
              <AtSign className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{s.label}</span>
              <span className="text-muted-foreground">{username}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" aria-label="opens in a new tab" />
            </a>
          ) : (
            <span key={s.key} className={chip}>
              <AtSign className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{s.label}</span>
              <span className="text-muted-foreground">{username}</span>
            </span>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Use these to check this trader is real. Keep chats about payment, and
        all payments, inside a Deal Room.
      </p>
    </div>
  );
}
