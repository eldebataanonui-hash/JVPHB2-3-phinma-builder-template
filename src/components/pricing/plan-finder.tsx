"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { formatPesos } from "@/lib/deals";
import { ANNUAL, BIANNUAL, MONTHLY, TYPICAL_SCAM_LOSS } from "@/lib/plans";
import { plural } from "@/lib/utils";

// "Which plan fits you?" Move the sliders; it works out the cheapest
// way to cover the months you'll trade, and the cost per account traded.
export function PlanFinder() {
  const [months, setMonths] = useState(6);
  const [accounts, setAccounts] = useState(3);

  // Cheapest mix: some years of Annual, some Bi-annual blocks, and the
  // months left over on Monthly. Tries every mix, so it's always exact.
  function cheapest(m: number) {
    let best = { total: Infinity, years: 0, halves: 0, left: 0 };
    for (let years = 0; years <= Math.ceil(m / 12); years++) {
      const rest = Math.max(0, m - years * 12);
      for (let halves = 0; halves <= Math.ceil(rest / 6); halves++) {
        const left = Math.max(0, rest - halves * 6);
        const total = years * ANNUAL.price + halves * BIANNUAL.price + left * MONTHLY.price;
        if (total < best.total) best = { total, years, halves, left };
      }
    }
    const parts = [
      best.years && `${best.years > 1 ? `${best.years}× ` : ""}Annual`,
      best.halves && `${best.halves > 1 ? `${best.halves}× ` : ""}Bi-annual`,
      best.left && `${best.left > 1 ? `${best.left}× ` : ""}Monthly`,
    ].filter(Boolean);
    const covered = best.years * 12 + best.halves * 6 + best.left;
    return { total: best.total, label: parts.join(" + "), covered };
  }

  const { total, label: best, covered } = cheapest(months);
  const allMonthly = months * MONTHLY.price;
  const perAccount = total / accounts;
  const scamShare = Math.round((total / TYPICAL_SCAM_LOSS) * 100);

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius)] border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Which plan fits you?</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm" htmlFor="months">
          <span>
            Months you&apos;ll be trading: <span className="font-semibold">{months}</span>
          </span>
          <input
            id="months"
            type="range"
            min={1}
            max={24}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm" htmlFor="accounts">
          <span>
            Accounts you&apos;ll buy or sell: <span className="font-semibold">{accounts}</span>
          </span>
          <input
            id="accounts"
            type="range"
            min={1}
            max={30}
            value={accounts}
            onChange={(e) => setAccounts(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </label>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cheapest way" value={best} />
        <Stat
          label={`Total for ${plural(months, "month")}${covered > months ? ` (covers ${covered})` : ""}`}
          value={formatPesos(total)}
        />
        <Stat label="Per account traded" value={formatPesos(Math.round(perAccount * 100) / 100)} />
        <Stat label={`Compared with one ${formatPesos(TYPICAL_SCAM_LOSS)} scam`} value={`${scamShare}%`} />
      </dl>

      <p className="text-sm text-muted-foreground">
        {total < allMonthly
          ? `That's ${formatPesos(allMonthly - total)} less than paying monthly. `
          : ""}
        Clark lost {formatPesos(TYPICAL_SCAM_LOSS)} in one scam. The safety steps
        are free either way; once payments start, a plan will help buyers notice
        you faster.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-secondary/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">{value}</dd>
    </div>
  );
}
