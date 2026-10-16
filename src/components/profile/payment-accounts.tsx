import { Lock, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/lib/deals";
import { MAX_PAYMENT_ACCOUNTS, accountMethodLabel } from "@/lib/payment-accounts";
import { createClient } from "@/lib/supabase/server";
import { addPaymentAccount, removePaymentAccount } from "@/app/profile/actions";

// Your e-wallet and bank accounts, on your own profile only. RLS returns
// only your own rows.
export async function PaymentAccounts({ error, saved }: { error: string | null; saved: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_accounts")
    .select("id, method, bank_name, account_name, account_number")
    .order("method")
    .order("created_at");
  const accounts = data ?? [];

  return (
    <Card id="payment-accounts">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Payment accounts
        </CardTitle>
        <CardDescription className="flex items-start gap-1.5">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Private. Only the other trader in a deal you&apos;re both in can see
          these, and only until the deal completes. As a seller, buyers send
          money here. As a buyer, sellers use it to check the money came from you.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {accounts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-secondary/50 p-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {accountMethodLabel(a)}
                  </p>
                  <p className="break-all font-mono text-base font-semibold">{a.account_number}</p>
                  <p className="truncate text-sm text-muted-foreground">{a.account_name}</p>
                </div>
                <form action={removePaymentAccount}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="outline" size="sm" aria-label={`Remove ${accountMethodLabel(a)} ${a.account_number}`}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add the GCash, Maya or bank account you want to be paid to.
          </p>
        )}

        {accounts.length < MAX_PAYMENT_ACCOUNTS ? (
          <form action={addPaymentAccount} className="flex flex-col gap-3 rounded-[var(--radius)] border border-dashed border-border p-3">
            <p className="text-sm font-semibold">Add an account</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="method">Method</Label>
                <select
                  id="method"
                  name="method"
                  required
                  defaultValue="gcash"
                  className="h-9 rounded-[var(--radius)] border border-input bg-secondary px-3 text-sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="bank_name">Bank name (InstaPay only)</Label>
                <Input id="bank_name" name="bank_name" maxLength={40} placeholder="e.g. BDO, BPI, UnionBank" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="account_name">Account name</Label>
                <Input id="account_name" name="account_name" required maxLength={80} placeholder="As shown in the app, e.g. ANA R." />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="account_number">Account or phone number</Label>
                <Input
                  id="account_number"
                  name="account_number"
                  required
                  maxLength={40}
                  inputMode="tel"
                  placeholder="e.g. 0917 123 4567"
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              For GCash, Maya and ShopeePay, use the mobile number linked to the
              wallet. For MariBank, GoTyme and InstaPay, use the account number.
              The bank name is only used for InstaPay. Never enter a PIN,
              password or OTP here.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm">Saved.</p>}
            <Button type="submit" variant="outline" className="w-fit">
              Add account
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&apos;ve saved {MAX_PAYMENT_ACCOUNTS} accounts, the most allowed. Remove one to add another.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
