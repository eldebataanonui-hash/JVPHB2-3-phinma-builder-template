import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// Ask the database on every visit, not once at build time, so the
// connection status below is always current.
export const dynamic = "force-dynamic";

// Ticket 02: prove the live site can talk to Supabase. A logged-out
// visitor gets zero rows back (RLS hides them), but no error.
async function checkDatabase(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Unknown error";
  }
}

export default async function Home() {
  const dbError = await checkDatabase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          AQTech GHub
        </h1>
        <p className="text-base text-muted-foreground">
          Trade Mobile Legends accounts step by step, so neither the buyer
          nor the seller gets scammed.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Database connection</CardTitle>
        </CardHeader>
        <CardContent>
          {dbError ? (
            <p className="text-sm text-destructive">Not connected: {dbError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Connected to Supabase.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
