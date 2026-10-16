import Link from "next/link";
import { BadgeCheck, Check, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlanFinder } from "@/components/pricing/plan-finder";
import { formatManilaDate } from "@/lib/deals";
import { errorText } from "@/lib/errors";
import {
  FREE_FOREVER,
  PLANS,
  TRIAL_DAYS,
  TYPICAL_SCAM_LOSS,
  formatPeso,
  perMonth,
  planById,
  savingPercent,
  trialInfo,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { clearPlanPick, pickPlan } from "@/app/pricing/actions";

const FAQ = [
  {
    q: "Why pay if the safety steps are free?",
    a: "You don't have to. Every safety step stays free for everyone, always: a scam-safe trade should never depend on money. Plans are for traders who want buyers to notice and trust them faster: a Pro badge, more photos and a better spot in Suggested traders.",
  },
  {
    q: "Will I be charged when I pick a plan?",
    a: "No. Payments aren't switched on yet. Picking a plan only saves your choice, so we know which plans traders want. When payments start, we'll tell you the date first, and nobody is charged without confirming.",
  },
  {
    q: "Is it free right now?",
    a: `Yes. Every new account gets a ${TRIAL_DAYS}-day free trial, and while AQTech GHub is in beta, everything stays free even after the trial.`,
  },
  {
    q: "Do you hold my money for trades?",
    a: "Never. Trades are paid directly between traders by GCash, Maya or bank. A plan only pays for using AQTech GHub, never for a trade.",
  },
  {
    q: "Can I change or cancel?",
    a: "Yes, any time. Change your pick below, or remove it. When payments start, plans won't renew without you choosing to.",
  },
];

export default async function PricingPage(props: PageProps<"/pricing">) {
  const { picked, error: errorCode } = await props.searchParams;
  const error = errorText(errorCode);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: pick }, { data: counts }] = user
    ? await Promise.all([
        supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
        supabase.from("plan_picks").select("plan, picked_at").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("plan_pick_counts"),
      ])
    : [{ data: null }, { data: null }, { data: null }];
  const trial = me ? trialInfo(me.created_at) : null;
  const myPlan = pick ? planById(pick.plan) : null;
  const picksFor = (id: string) =>
    (counts as { plan: string; picks: number }[] | null)?.find((c) => c.plan === id)?.picks ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
      <section className="flex flex-col items-start gap-4 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 sm:p-8">
        <p className="flex w-fit items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {TRIAL_DAYS}-day free trial · safety free forever
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Safety is free. <span className="text-primary">Standing out is Pro.</span>
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Every trader gets the live code, two-half payments, Lock-In and
          reviews for free. Pro plans help honest traders get noticed, so
          buyers pick you over a stranger on Facebook. A whole year costs less
          than a quarter of one {formatPeso(TYPICAL_SCAM_LOSS)} scam.
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

      <section id="plans" className="flex flex-col gap-4">
        {myPlan && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-primary/50 bg-primary/10 px-4 py-3 text-sm">
            <p>
              <span className="font-semibold">Your pick: {myPlan.name}</span> ({formatPeso(myPlan.price)}{" "}
              {myPlan.period}). {picked ? "Saved. " : ""}You won&apos;t be charged: payments aren&apos;t
              switched on yet.
            </p>
            <form action={clearPlanPick}>
              <Button type="submit" variant="outline" size="sm">
                Remove my pick
              </Button>
            </form>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PlanCard
            name="Free"
            price="₱0"
            period="forever"
            forWho="Every trader"
            why="Every safety step, for every trade. Never paywalled."
            perks={FREE_FOREVER}
            icon="shield"
          >
            <p className="text-center text-xs text-muted-foreground">Included with every account</p>
          </PlanCard>

          {PLANS.map((plan) => {
            const saving = savingPercent(plan);
            const count = picksFor(plan.id);
            const isMine = myPlan?.id === plan.id;
            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={formatPeso(plan.price)}
                period={plan.period}
                sub={plan.months > 1 ? `${formatPeso(Math.round(perMonth(plan) * 100) / 100)} a month` : undefined}
                saving={saving > 0 ? `Save ${saving}%` : undefined}
                forWho={plan.forWho}
                why={plan.why}
                perks={["Everything in Free", ...plan.perks]}
                highlight={plan.highlight}
                mine={isMine}
              >
                {user ? (
                  <form action={pickPlan} className="flex flex-col gap-1.5">
                    <input type="hidden" name="plan" value={plan.id} />
                    <Button
                      type="submit"
                      disabled={isMine}
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full"
                    >
                      {isMine ? "✓ Your pick" : myPlan ? `Switch to ${plan.name}` : `Pick ${plan.name}`}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      No charge. Payments aren&apos;t on yet.
                      {count > 0 && ` · ${count} trader${count === 1 ? "" : "s"} picked this`}
                    </p>
                  </form>
                ) : (
                  <Link
                    href="/signup"
                    className={cn(buttonVariants({ variant: plan.highlight ? "default" : "outline" }), "w-full")}
                  >
                    Start free trial
                  </Link>
                )}
              </PlanCard>
            );
          })}
        </div>
      </section>

      <PlanFinder />

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

// One plan: price, who it's for, why it's worth it, perks, and a button.
function PlanCard({
  name,
  price,
  period,
  sub,
  saving,
  forWho,
  why,
  perks,
  highlight,
  mine,
  icon,
  children,
}: {
  name: string;
  price: string;
  period: string;
  sub?: string;
  saving?: string;
  forWho: string;
  why: string;
  perks: string[];
  highlight?: boolean;
  mine?: boolean;
  icon?: "shield";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius)] border bg-card p-5",
        highlight ? "border-primary ring-1 ring-primary/40" : "border-border",
        mine && "border-primary",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-2xl font-bold">
          {icon === "shield" ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <BadgeCheck className="h-5 w-5 text-primary" />
          )}
          {name}
        </h3>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            <Crown className="h-3 w-3" />
            Best value
          </span>
        )}
      </div>

      <div>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </p>
        <p className="flex flex-wrap gap-2 text-xs">
          {sub && <span className="text-muted-foreground">{sub}</span>}
          {saving && <span className="font-semibold text-emerald-400">{saving}</span>}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">For: {forWho}</p>
        <p className="text-sm">{why}</p>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className={perk === "Everything in Free" ? "font-semibold" : undefined}>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">{children}</div>
    </div>
  );
}
