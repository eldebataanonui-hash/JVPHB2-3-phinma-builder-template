import { CheckCircle2, CircleAlert, CircleMinus, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLastActive, formatManilaDate } from "@/lib/deals";
import { type TraderFacts, trustCheck, trustLevel } from "@/lib/trust";
import { cn } from "@/lib/utils";

// The trust level badge shown next to a trader's name.
export function TrustBadge({ facts }: { facts: TraderFacts }) {
  const level = trustLevel(facts);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        level.tone === "good" && "border-primary/50 bg-primary/15 text-primary",
        level.tone === "warn" && "border-amber-500/50 bg-amber-500/10 text-amber-400",
        level.tone === "muted" && "border-border text-muted-foreground",
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {level.label}
    </span>
  );
}

// "Trust check": green checks and amber warnings worked out from the
// trader's real record, plus their stats.
export function TraderInsights({ facts }: { facts: TraderFacts }) {
  const items = trustCheck(facts);
  const completed = facts.completedAsSeller + facts.completedAsBuyer;
  const finished = completed + facts.abandoned;

  const stats = [
    { label: "Sold", value: facts.completedAsSeller },
    { label: "Bought", value: facts.completedAsBuyer },
    {
      label: "Rating",
      value: facts.rating ? `★ ${facts.rating.average.toFixed(1)} (${facts.rating.reviews})` : "—",
    },
    { label: "Completion rate", value: finished ? `${Math.round((completed / finished) * 100)}%` : "—" },
    { label: "Member since", value: formatManilaDate(facts.joinedAt) },
    {
      label: "Last active",
      value: facts.lastActive ? formatLastActive(facts.lastActive).replace("Active ", "") : "—",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trust check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.text} className="flex items-start gap-2">
                {item.ok === true && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
                {item.ok === false && <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                {item.ok === null && <CircleMinus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className={item.ok === null ? "text-muted-foreground" : undefined}>{item.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Worked out from their real record. A guide, not a guarantee: always
            trade in a Deal Room.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trader stats</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[var(--radius)] border border-border bg-secondary/50 p-3">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="font-[family-name:var(--font-display)] text-xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
