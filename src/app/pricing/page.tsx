import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatManilaDate } from "@/lib/deals";
import { INCLUDED_TODAY, PLANNED_PERKS, PLANS, TRIAL_DAYS, trialInfo } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Is it free right now?",
    a: `Yes. Every new account gets a ${TRIAL_DAYS}-day free trial, and while AQTech GHub is in beta, everything stays free even after the trial.`,
  },
  {
    q: "Do you hold my money?",
    a: "Never. Trades are paid directly between traders by GCash, Maya or bank. A subscription would only ever be for using the platform.",
  },
  {
    q: "What happens when plans launch?",
    a: "We'll announce prices before anything changes, and nobody will be charged without choosing a plan first.",
  },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle()
    : { data: null };
  const trial = me ? trialInfo(me.created_at) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
      <section className="flex flex-col items-start gap-4 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 sm:p-8">
        <p className="flex w-fit items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {TRIAL_DAYS}-day free trial
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Trade safer. <span className="text-primary">Try it free.</span>
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Every account starts with {TRIAL_DAYS} days of full access. Plans are
          coming soon; during beta, everything stays free.
        </p>
        {trial ? (
          <p className="rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm">
            {trial.active
              ? `Your free trial: ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left (until ${formatManilaDate(trial.endsAt.toISOString())}).`
              : "Your free trial has ended. Everything stays free while AQTech GHub is in beta."}
          </p>
        ) : (
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Start your {TRIAL_DAYS}-day free trial
          </Link>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn("flex flex-col", plan.highlight && "border-primary ring-1 ring-primary/40")}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    <Crown className="h-3 w-3" />
                    Best value
                  </span>
                )}
              </div>
              <CardDescription>{plan.note}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-4">
              <p>
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold">
                  {plan.price === null ? "TBA" : `₱${plan.price.toLocaleString("en-PH")}`}
                </span>{" "}
                <span className="text-sm text-muted-foreground">
                  {plan.price === null ? "price to be announced" : plan.period}
                </span>
              </p>
              <Button type="button" disabled variant={plan.highlight ? "default" : "outline"}>
                Coming soon
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Included today, for everyone</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {INCLUDED_TODAY.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Planned for paid plans</CardTitle>
            <CardDescription>Ideas we&apos;re working towards. Not available yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {PLANNED_PERKS.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f} <span className="text-xs">(planned)</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Questions</h2>
        {FAQ.map((item) => (
          <details key={item.q} className="rounded-[var(--radius)] border border-border bg-card p-4">
            <summary className="cursor-pointer font-semibold">{item.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
