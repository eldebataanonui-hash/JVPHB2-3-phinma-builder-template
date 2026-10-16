import { ShieldAlert, Wallet } from "lucide-react";
import { CopyField } from "@/components/copy-field";
import { formatPesos, paymentLabel } from "@/lib/deals";
import { type PaymentAccount, accountMethodLabel } from "@/lib/payment-accounts";

// Where the money goes. The buyer sees the seller's saved account for
// the chosen method ("Send to"); the seller sees the buyer's ("Expect
// payment from"), to check the money came from the right person. The
// accounts come from deal_payment_accounts() (032): only the other
// trader's, only while the deal is in progress.
export function PaymentDestination({
  isSeller,
  method,
  amount,
  otherName,
  accounts,
}: {
  isSeller: boolean;
  method: string | null;
  amount: number;
  otherName: string;
  accounts: PaymentAccount[];
}) {
  if (!method) return null;
  const matching = accounts.filter((a) => a.method === method);
  const label = paymentLabel(method) ?? method;

  if (isSeller) {
    return (
      <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-secondary/40 p-3 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Wallet className="h-4 w-4 text-primary" />
          Expect {formatPesos(amount)} from {otherName}&apos;s {label}
        </p>
        {matching.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {matching.map((a) => (
              <li key={`${a.method}-${a.account_number}`}>
                <span className="font-mono font-semibold">{a.account_number}</span>{" "}
                <span className="text-muted-foreground">· {a.account_name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {otherName} hasn&apos;t saved a {label} account, so check the sender&apos;s name carefully.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Check the money arrived in your own app before you confirm. A screenshot of a receipt isn&apos;t proof.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border-2 border-primary/60 bg-primary/10 p-3 text-sm">
      <p className="flex items-center gap-2 text-base font-semibold">
        <Wallet className="h-5 w-5 text-primary" />
        Send {formatPesos(amount)} to {otherName}&apos;s {label}
      </p>
      {matching.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {matching.map((a) => (
            <li key={`${a.method}-${a.account_number}`} className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{accountMethodLabel(a)}</p>
              <CopyField value={a.account_number} large />
              <p>
                Account name: <span className="font-semibold">{a.account_name}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {otherName} hasn&apos;t saved a {label} account yet. Ask them to add one
          under Payment accounts on their profile, or choose another method above.
        </p>
      )}
      <p className="flex items-start gap-1.5 text-xs">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        <span>
          Before you send, check the name your app shows matches the account
          name here. Only pay to the account shown in this Deal Room, never to
          a different number sent in chat.
        </span>
      </p>
    </div>
  );
}
