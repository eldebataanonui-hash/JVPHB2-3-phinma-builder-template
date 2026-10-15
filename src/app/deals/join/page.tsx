import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

// "Join a deal": the buyer types the deal code the seller sent them
// (JOIN-XXXXXXXX) and lands on that Deal Room's preview.
export default async function JoinDealPage(props: PageProps<"/deals/join">) {
  const { code } = await props.searchParams;
  const typed = typeof code === "string" ? code.trim().toUpperCase().slice(0, 20) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Keep the code, so after logging in (or signing up) they land
    // straight on the deal.
    const back = typed ? `/deals/join?code=${encodeURIComponent(typed)}` : "/deals/join";
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  let notFound = false;
  if (typed) {
    const { data: dealId } = await supabase.rpc("deal_id_for_code", { p_code: typed });
    if (dealId) redirect(`/deals/${dealId}`);
    notFound = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Join a deal</CardTitle>
          <CardDescription>
            Enter the deal code the seller sent you. It starts with JOIN-.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3">
            <Input
              name="code"
              defaultValue={typed}
              placeholder="JOIN-7F3K9B2A"
              aria-label="Deal code"
              required
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
              className="h-12 font-mono text-lg tracking-widest"
            />
            {notFound && (
              <p className="text-sm text-destructive">
                No deal has that code. Check it with the seller.
              </p>
            )}
            <Button type="submit">Find the deal</Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            The deal code is not the ownership code (AQ-…). You&apos;ll see the
            ownership code later, inside the Deal Room.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
