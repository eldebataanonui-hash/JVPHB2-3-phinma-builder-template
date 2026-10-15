import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/password-input";
import { submitCredentials } from "@/app/deals/actions";

// The seller sends the listed account's login details at the handover
// step. They're stored encrypted (Supabase Vault), only the buyer can
// reveal them, and they're deleted when the deal completes.
export function CredentialsForm({
  dealId,
  sent,
  error,
}: {
  dealId: string;
  sent: boolean;
  error: string | null;
}) {
  return (
    <form action={submitCredentials} className="flex flex-col gap-3 rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-4">
      <input type="hidden" name="deal_id" value={dealId} />
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4 text-primary" />
        Account login details (confidential)
      </p>
      <p className="text-xs text-muted-foreground">
        {sent
          ? "Sent ✓. Only the buyer can see them. Send again to replace them."
          : "Required before you can finish this step. Encrypted, only the buyer can see them, and they're deleted when the deal completes."}
      </p>
      <div className="flex flex-col gap-1">
        <Label htmlFor="cred_login">Login (email, Moonton account or username)</Label>
        <Input id="cred_login" name="login" required maxLength={200} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="cred_password">Password</Label>
        <PasswordInput id="cred_password" name="password" required maxLength={200} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="cred_note">Note for the buyer (optional)</Label>
        <Textarea
          id="cred_note"
          name="note"
          maxLength={500}
          rows={2}
          placeholder="e.g. Log in with the Moonton option. Bound to Facebook too; I've removed it."
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="outline" className="w-fit">
        {sent ? "Replace login details" : "Send login details to the buyer"}
      </Button>
    </form>
  );
}
