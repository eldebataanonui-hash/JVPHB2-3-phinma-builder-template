import Link from "next/link";
import { KeyRound, ShieldCheck, Split } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RedFlags } from "@/components/red-flags";
import { createClient } from "@/lib/supabase/server";

// The three things that make a trade safe, shown on Home.
const STEPS = [
  {
    icon: KeyRound,
    title: "Live ownership code",
    body: "The seller puts our code in their in-game name. Screenshots and videos can't fake that.",
  },
  {
    icon: Split,
    title: "Pay in two halves",
    body: "Half before the handover, half after you have full control. Never the full price first.",
  },
  {
    icon: ShieldCheck,
    title: "Lock-In Checklist",
    body: "Every login moves to the buyer, so the seller can't take the account back.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="flex flex-col gap-4 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 sm:p-8">
        <p className="w-fit rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary">
          Mobile Legends account trading
        </p>
        <h1 className="text-4xl font-bold leading-none sm:text-5xl">
          Trade accounts.
          <br />
          <span className="text-primary">Not scams.</span>
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          A Deal Room walks buyer and seller through every step, in order,
          with a record nobody can edit.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Link href="/deals/new" className={buttonVariants()}>
                Start a deal
              </Link>
              <Link href="/deals/join" className={buttonVariants({ variant: "outline" })}>
                Join with a code
              </Link>
              <Link href="/traders" className={buttonVariants({ variant: "outline" })}>
                Find traders
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants()}>
                Start your 14-day free trial
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-4">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <RedFlags />

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/rules" className="text-primary underline">
          Read the Trading Rules
        </Link>
        <Link href="/about" className="text-primary underline">
          About us
        </Link>
        <Link href="/pricing" className="text-primary underline">
          Plans and free trial
        </Link>
      </div>
    </main>
  );
}
