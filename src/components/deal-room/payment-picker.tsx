import { PAYMENT_METHODS } from "@/lib/deals";
import { cn } from "@/lib/utils";
import { choosePaymentMethod } from "@/app/deals/actions";

// The buyer picks how they'll pay: one tap on an e-wallet saves it.
// AQTech GHub never moves the money; this tells the seller which app to
// check, and goes in the record.
export function PaymentPicker({ dealId, current }: { dealId: string; current: string | null }) {
  return (
    <form action={choosePaymentMethod} className="flex flex-col gap-2">
      <input type="hidden" name="deal_id" value={dealId} />
      <p className="text-sm font-medium">
        {current ? "Paying with (tap another to change):" : "How will you pay? Tap one:"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="submit"
            name="method"
            value={m.id}
            aria-pressed={current === m.id}
            className={cn(
              "rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition-colors",
              current === m.id
                ? "border-primary bg-primary/15 font-semibold"
                : "border-border bg-secondary hover:border-primary/50",
            )}
          >
            {current === m.id ? "✓ " : ""}
            {m.label}
          </button>
        ))}
      </div>
    </form>
  );
}
