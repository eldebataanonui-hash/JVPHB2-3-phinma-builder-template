import Link from "next/link";
import { BadgeCheck, KeyRound, MessageCircle, ShieldCheck, Split, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// About us: who we are, why AQTech GHub exists and how it keeps trades
// safe. Public, so anyone can read it before signing up.
const HOW = [
  { icon: BadgeCheck, title: "Verified traders", body: "Every trader confirms their email, and their profile shows a deal record built only from finished trades." },
  { icon: KeyRound, title: "Live ownership code", body: "The seller proves they control the account right now. Screenshots and videos can't fake that." },
  { icon: Split, title: "Pay in two halves", body: "Half before the handover, half after the buyer has full control. Never the full price first." },
  { icon: ShieldCheck, title: "Lock-In Checklist", body: "Every login moves to the buyer, so the seller can't take the account back." },
  { icon: Wallet, title: "Your own e-wallet", body: "Pay with GCash, Maya, MariBank and more. We record the method; we never hold your money." },
  { icon: MessageCircle, title: "Everything on the record", body: "Chat, steps and concerns are kept with times and can't be deleted, so there's proof if something goes wrong." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="flex flex-col items-start gap-5 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 sm:p-8">
        <Logo size="lg" />
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Safe Mobile Legends account trades, step by step.
        </h1>
        <p className="text-base text-muted-foreground">
          AQTech GHub is a student project from the PHINMA AI Builder Workshop.
          We built it because buying and selling game accounts on Facebook
          groups, Messenger, Discord and Telegram is full of scams.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="text-2xl font-bold">Why we exist</h2>
        <p className="text-sm text-muted-foreground">
          One of our classmates found the Mythic account he wanted in a
          Facebook trading group. The seller had screenshots, a login video
          and good comments, and said &quot;no middleman needed, send GCash
          first.&quot; He paid ₱1,700. The seller blocked him and deleted the
          post. Facebook and GCash couldn&apos;t help, and the money was gone.
        </p>
        <p className="text-sm text-muted-foreground">
          In one week of asking around, we found three more classmates who
          nearly lost money the same way. Our purpose is simple:{" "}
          <span className="font-semibold text-foreground">
            make trading game accounts safe for both the buyer and the seller,
          </span>{" "}
          without anyone having to trust a stranger with everything.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">How we keep trades safe</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {HOW.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="text-2xl font-bold">What we don&apos;t do</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
          <li>We never hold or move your money, and we can&apos;t reverse payments.</li>
          <li>We never ask for your password, or for a GCash or bank code.</li>
          <li>We can&apos;t stop every scam, but we make them much harder and leave a record when they happen.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/rules" className={buttonVariants({ variant: "outline" })}>
          Read the Trading Rules
        </Link>
        <Link href="/" className={buttonVariants()}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
