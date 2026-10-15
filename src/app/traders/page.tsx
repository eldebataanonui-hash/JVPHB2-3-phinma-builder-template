import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TraderRecord } from "@/components/trader-record";
import { createClient } from "@/lib/supabase/server";

// Find a trader by display name. Display names aren't unique, so every
// result shows the join date and deal record to tell copycats apart.
export default async function FindTradersPage(props: PageProps<"/traders">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/traders");

  // Escape % and _ so they're searched as plain characters.
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { data: traders } =
    query.length >= 2
      ? await supabase
          .from("profiles")
          .select("id, display_name, created_at")
          .ilike("display_name", pattern)
          .order("created_at")
          .limit(20)
      : { data: null };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Find a trader</CardTitle>
          <CardDescription>
            Search by display name. Names aren&apos;t unique: check the join
            date and deal record before you trust anyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input name="q" defaultValue={query} placeholder="Display name" aria-label="Display name" minLength={2} maxLength={40} required />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {traders && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            {traders.length === 0 && (
              <p className="text-sm text-muted-foreground">No traders found.</p>
            )}
            {traders.map((t) => (
              <Link
                key={t.id}
                href={`/profile/${t.id}`}
                className="flex flex-col gap-1 rounded-[var(--radius)] border border-border p-3 hover:bg-secondary"
              >
                <span className="text-sm font-medium">{t.display_name}</span>
                <span className="text-xs text-muted-foreground">
                  Joined{" "}
                  {new Date(t.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "Asia/Manila",
                  })}
                </span>
                <TraderRecord traderId={t.id} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
