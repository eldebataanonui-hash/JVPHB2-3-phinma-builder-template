"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revealCredentials } from "@/app/deals/actions";

type Creds = { login: string; password: string; note: string };

// The buyer's view of the login details. Nothing secret is in the page
// until the buyer taps "Show": then they're fetched once, shown, and
// can be hidden again.
export function CredentialsReveal({ dealId }: { dealId: string }) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function show() {
    setBusy(true);
    setError("");
    const result = await revealCredentials(dealId);
    setBusy(false);
    if (result.ok) setCreds(result.creds);
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4 text-primary" />
        Account login details (confidential)
      </p>

      {creds ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Login</dt>
            <dd className="font-mono">{creds.login}</dd>
            <dt className="text-muted-foreground">Password</dt>
            <dd className="font-mono">{creds.password}</dd>
            {creds.note && (
              <>
                <dt className="text-muted-foreground">Note</dt>
                <dd className="whitespace-pre-wrap">{creds.note}</dd>
              </>
            )}
          </dl>
          <p className="text-sm font-medium text-destructive">
            The seller still knows this password. Log in now, then change the
            password and move the bound email to yours (the Lock-In steps
            below) before you confirm full control.
          </p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setCreds(null)}>
            <EyeOff className="h-4 w-4" />
            Hide
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Encrypted, only you can see them, and they&apos;re deleted when the
            deal completes. Don&apos;t screenshot or forward them.
          </p>
          <Button type="button" size="sm" className="w-fit" disabled={busy} onClick={show}>
            <Eye className="h-4 w-4" />
            {busy ? "Opening…" : "Show login details"}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
