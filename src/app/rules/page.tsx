import Link from "next/link";
import {
  Ban,
  CircleCheck,
  CircleX,
  ClipboardList,
  Flag,
  Hand,
  KeyRound,
  Receipt,
  ScrollText,
  ShieldCheck,
  Split,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The Trading Rules: public, so anyone can read them before signing up.
// Laid out like a game's rulebook: the match flow, the fouls, what to do
// when something goes wrong, and what our team can and can't do.

// A real sequence, so it's numbered.
const MATCH_FLOW = [
  { icon: ShieldCheck, title: "Enter a Deal Room", body: "Every trade happens in a Deal Room: one seller, one buyer." },
  { icon: KeyRound, title: "Prove ownership", body: "The seller puts the live ownership code in their in-game name." },
  { icon: Split, title: "Pay in two halves", body: "Half before the Lock-In Checklist, half after full control. Never the full price first." },
  { icon: ClipboardList, title: "Confirm every step", body: "The right person confirms each step, in order, and it's recorded with the time." },
];

const FOULS = [
  "Confirming a step that didn't really happen, such as \"I've sent the first half\" when you haven't.",
  "Taking the account back after the buyer confirmed full control.",
  "Asking for payment, fees or security codes outside the Deal Room. (Sharing a deal code, JOIN-…, is fine.)",
  "Asking anyone for their own passwords or a GCash/bank code. The only security code ever shared is the Moonton binding code, in the Deal Room chat, at the Lock-In step.",
  "Asking to be paid to a number other than the account shown in the Deal Room.",
  "Sending a sold account's login anywhere except the encrypted login box in the Deal Room.",
  "Sending links in the Deal Room chat, or moving the deal to another app to send them.",
  "Leaving a deal unfinished for more than 3 days. It counts as abandoned on your record.",
];

// Also a sequence: do these in order.
const IF_WRONG = [
  { icon: Hand, title: "Stop", body: "Don't send any more money." },
  { icon: Flag, title: "Report", body: "Tap Report a concern in the Deal Room and describe what happened." },
  { icon: Receipt, title: "Keep proof", body: "Keep your GCash or bank receipts and screenshots of your chats." },
];

const TEAM_CAN = [
  "Review every concern alongside the deal's record, which nobody can edit",
  "Contact both traders by email if needed",
  "Respond to concerns within 48 hours",
];

const TEAM_CANT = [
  "Hold your money: trades are paid directly between traders",
  "Reverse payments: GCash and banks handle that",
];

export default function RulesPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 sm:p-8">
        <p className="flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <ScrollText className="h-3.5 w-3.5" />
          Rulebook
        </p>
        <h1 className="text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl">
          Trading <span className="text-primary">Rules</span>
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          By trading on AQTech GHub, both traders agree to these rules. Play
          fair, follow the steps, and you make a scam much harder.
        </p>
        <nav aria-label="Sections" className="flex flex-wrap gap-2 pt-1 text-sm">
          {[
            ["#flow", "How a trade works"],
            ["#fouls", "Broken deals"],
            ["#wrong", "If something goes wrong"],
            ["#team", "Our team"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border bg-secondary px-3 py-1 transition-colors hover:border-primary hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="flow" className="flex scroll-mt-20 flex-col gap-4">
        <SectionTitle kicker="The match flow" title="How a trade works" />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MATCH_FLOW.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-4">
              <span className="font-[family-name:var(--font-display)] text-4xl font-bold leading-none text-primary/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon className="absolute right-4 top-4 h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="fouls" className="flex scroll-mt-20 flex-col gap-4">
        <SectionTitle
          kicker="Fouls"
          title="What counts as a broken deal"
          tone="danger"
          note="Any of these can be reported to our team. Abandoned deals also count on your record."
        />
        <ul className="flex flex-col gap-2 rounded-[var(--radius)] border-2 border-red-500/50 bg-red-500/5 p-3 sm:p-4">
          {FOULS.map((foul) => (
            <li key={foul} className="flex items-start gap-3 rounded-[var(--radius)] bg-card p-3 text-sm leading-relaxed">
              <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{foul}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="wrong" className="flex scroll-mt-20 flex-col gap-4">
        <SectionTitle kicker="Emergency" title="If something goes wrong" note="Do these in order." />
        <ol className="grid gap-3 sm:grid-cols-3">
          {IF_WRONG.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex flex-col gap-2 rounded-[var(--radius)] border border-amber-500/40 bg-amber-500/5 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 font-[family-name:var(--font-display)] text-lg font-bold text-amber-400">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide">{title}</h3>
              <p className="text-sm">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="team" className="flex scroll-mt-20 flex-col gap-4">
        <SectionTitle kicker="Referees" title="What our team can and can't do" />
        <div className="grid gap-3 sm:grid-cols-2">
          <TeamList title="We can" items={TEAM_CAN} good />
          <TeamList title="We can't" items={TEAM_CANT} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/deals/new" className={buttonVariants()}>
          Start a deal (sellers)
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to home
        </Link>
      </div>
    </main>
  );
}

function SectionTitle({
  kicker,
  title,
  note,
  tone,
}: {
  kicker: string;
  title: string;
  note?: string;
  tone?: "danger";
}) {
  return (
    <div className="flex flex-col gap-1">
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.2em]",
          tone === "danger" ? "text-red-400" : "text-primary",
        )}
      >
        {kicker}
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

function TeamList({ title, items, good }: { title: string; items: string[]; good?: boolean }) {
  const Icon = good ? CircleCheck : CircleX;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius)] border p-4",
        good ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card",
      )}
    >
      <h3 className={cn("text-lg font-bold uppercase tracking-wide", good ? "text-emerald-400" : "text-muted-foreground")}>
        {title}
      </h3>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", good ? "text-emerald-400" : "text-muted-foreground")} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
