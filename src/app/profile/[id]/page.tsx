import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { SellingNow } from "@/components/profile/selling-now";
import { TraderInsights, TrustBadge } from "@/components/profile/trader-insights";
import { TraderReviews } from "@/components/profile/trader-reviews";
import { ratingFrom } from "@/lib/reviews";
import { TraderRecord } from "@/components/trader-record";
import type { TraderFacts } from "@/lib/trust";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { startIdVerification, updateBio, updateSocials } from "@/app/profile/actions";
import { BadgeCheck } from "lucide-react";
import { SOCIALS } from "@/lib/socials";
import { trialInfo } from "@/lib/plans";
import { AtSign, ExternalLink } from "lucide-react";
import { STEP_LABELS, formatPesos } from "@/lib/deals";

export default async function ProfilePage(props: PageProps<"/profile/[id]">) {
  const { id } = await props.params;
  const { error: errorCode, saved, social_error, socials_saved, kyc_error } = await props.searchParams;
  const kycError = errorText(kyc_error);
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
    .select("display_name, created_at, bio, avatar_path, social_facebook, social_instagram, social_tiktok, social_x, social_youtube, social_discord, id_verified_at")
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
  // The trader's record, for the trust badge, Trust check and stats.
  const [{ data: statsRows }, { data: ratingRows }] = await Promise.all([
    supabase.rpc("trader_stats", { p_trader_id: id }),
    supabase.rpc("trader_ratings", { p_trader_ids: [id] }),
  ]);
  const stats = statsRows?.[0];
  const rating = ratingFrom(ratingRows, id);
  const facts: TraderFacts = {
    joinedAt: profile.created_at,
    completedAsSeller: stats?.completed_as_seller ?? 0,
    completedAsBuyer: stats?.completed_as_buyer ?? 0,
    abandoned: stats?.abandoned ?? 0,
    lastActive: stats?.last_active ?? null,
    socialsLinked: SOCIALS.filter((s) => profile[s.key]).map((s) => s.label),
    idVerified: Boolean(profile.id_verified_at),
    rating,
  };

  // Your own verification status (kyc_checks is readable only by you).
  const { data: kyc } = isMe
    ? await supabase.from("kyc_checks").select("status, updated_at").eq("user_id", id).maybeSingle()
    : { data: null };

  const joined = new Date(profile.created_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar name={profile.display_name} path={profile.avatar_path} size={72} />
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="truncate text-2xl">{profile.display_name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <TrustBadge facts={facts} />
              {profile.id_verified_at && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  ID verified
                </span>
              )}
            </div>
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

      <TraderInsights facts={facts} />

      <TraderReviews traderId={id} rating={rating} />

      {!isMe && <SellingNow sellerId={id} sellerName={profile.display_name} />}

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
        <Card id="plan">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Your plan</CardTitle>
            <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "sm" })}>
              See plans
            </Link>
          </CardHeader>
          <CardContent>
            {trialInfo(profile.created_at).active ? (
              <p className="text-sm">
                <span className="font-semibold">Free trial</span>:{" "}
                {trialInfo(profile.created_at).daysLeft} day
                {trialInfo(profile.created_at).daysLeft === 1 ? "" : "s"} left. Full
                access to every feature.
              </p>
            ) : (
              <p className="text-sm">
                <span className="font-semibold">Beta access</span>: your free trial
                has ended, but everything stays free while AQTech GHub is in beta.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isMe && (
        <Card id="verify">
          <CardHeader>
            <CardTitle>ID verification (optional)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {profile.id_verified_at ? (
              <p className="text-sm">
                ✓ Your ID is verified. Buyers and sellers see the &quot;ID
                verified&quot; badge on your profile.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Earn the &quot;ID verified&quot; badge. Didit, an identity
                  verification company, performs a real check of your
                  government ID and a live selfie. Didit handles your ID photo
                  and selfie under its own privacy policy (see{" "}
                  <a href="https://didit.me" target="_blank" rel="noopener noreferrer" className="underline">
                    didit.me
                  </a>
                  ); AQTech GHub never sees or stores them, only the result
                  (verified or not, and when). By tapping Verify my ID you
                  agree to this. It&apos;s optional: you can trade without it.
                </p>
                {kyc && (
                  <p className="text-sm">
                    Last check: <span className="font-semibold">{kyc.status}</span>
                  </p>
                )}
                {kycError && <p className="text-sm text-destructive">{kycError}</p>}
                <form action={startIdVerification}>
                  <Button type="submit" variant="outline" className="w-fit">
                    <BadgeCheck className="h-4 w-4" />
                    {kyc ? "Try again" : "Verify my ID"}
                  </Button>
                </form>
              </>
            )}
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
                Add your accounts so buyers and sellers can check you&apos;re
                real. Paste your profile link from the app (we keep just the
                username), then tap Test link to make sure it opens your
                account. Leave any blank.
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
                      placeholder={s.key === "social_discord" ? "username" : "username or profile link"}
                      autoCapitalize="none"
                      autoComplete="off"
                    />
                    {s.url && profile[s.key] && (
                      <a
                        href={s.url(profile[s.key] as string)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-fit text-xs text-primary underline"
                      >
                        Test link: does it open your {s.label}?
                      </a>
                    )}
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
                deals={deals?.filter((d) => d.seller_id === user.id && d.step !== "completed")}
                empty="Nothing for sale right now. Tap New Deal to start."
              />
              <DealList
                heading="Sold"
                deals={deals?.filter((d) => d.seller_id === user.id && d.step === "completed")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buying</CardTitle>
            </CardHeader>
            <CardContent>
              <DealList
                deals={deals?.filter((d) => d.seller_id !== user.id && d.step !== "completed")}
                empty="No trades in progress. Enter a seller's deal code on Join a deal."
              />
              <DealList
                heading="Bought"
                deals={deals?.filter((d) => d.seller_id !== user.id && d.step === "completed")}
              />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

// A list of your deals. With a heading (Sold, Bought), it's hidden when
// empty; without one, it shows the empty message.
function DealList({
  deals,
  empty,
  heading,
}: {
  deals?: { id: string; title: string; price: number; step: string }[];
  empty?: string;
  heading?: string;
}) {
  if (!deals?.length) {
    return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null;
  }

  return (
    <div className="flex flex-col gap-2">
      {heading && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading} ({deals.length})
        </p>
      )}
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
            {deal.step === "completed" ? "✓ Completed · receipt available" : STEP_LABELS[deal.step]}
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
          const look =
            "inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm";
          return s.url ? (
            <a
              key={s.key}
              href={s.url(username)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${look} transition-colors hover:border-primary hover:bg-primary/15`}
            >
              <AtSign className="h-4 w-4 text-primary" />
              <span className="font-semibold">{s.label}</span>
              <span className="text-muted-foreground">{username}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span key={s.key} className={look}>
              <AtSign className="h-4 w-4 text-primary" />
              <span className="font-semibold">{s.label}</span>
              <span className="text-muted-foreground">{username}</span>
            </span>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Not verified: anyone can type a username. Open the account and check
        it mentions AQTech GHub or matches this trader before you trust it.
        Keep chats about payment, and all payments, inside a Deal Room.
      </p>
    </div>
  );
}
