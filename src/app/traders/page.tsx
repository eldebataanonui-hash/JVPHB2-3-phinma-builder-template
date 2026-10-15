import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { RecordText } from "@/components/trader-record";
import { formatLastActive, formatManilaDate } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";

type Trader = {
  id: string;
  display_name: string;
  bio: string;
  avatar_path: string | null;
  created_at: string;
  completed: number;
  abandoned: number;
  last_active: string | null;
};

// Find traders. With no search: suggested traders, most trusted and
// most active first. With a search: traders whose name matches.
// Display names aren't unique, so every card shows the join date and
// deal record to tell copycats apart.
export default async function FindTradersPage(props: PageProps<"/traders">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/traders");

  let traders: Trader[] = [];
  if (query.length >= 2) {
    // Escape % and _ so they're searched as plain characters.
    const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const { data: found } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_path, created_at")
      .ilike("display_name", pattern)
      .neq("id", user.id)
      .order("created_at")
      .limit(20);
    // One record lookup per result; fine for up to 20 results.
    traders = await Promise.all(
      (found ?? []).map(async (p) => {
        const { data } = await supabase.rpc("trader_record", { p_trader_id: p.id });
        return {
          ...p,
          completed: data?.[0]?.completed ?? 0,
          abandoned: data?.[0]?.abandoned ?? 0,
          last_active: null,
        };
      }),
    );
  } else {
    const { data } = await supabase.rpc("suggested_traders");
    traders = data ?? [];
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">Find traders</h1>
        <form className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by display name"
            aria-label="Display name"
            minLength={2}
            maxLength={40}
          />
          <Button type="submit">Search</Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Names aren&apos;t unique. Check the join date and deal record before
          you trust anyone.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">
          {query.length >= 2 ? `Results for "${query}"` : "Suggested traders"}
        </h2>
        {query.length < 2 && (
          <p className="-mt-2 text-sm text-muted-foreground">
            Most completed deals and most recently active first.
          </p>
        )}

        {traders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {query.length >= 2 ? "No traders found." : "No other traders yet."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {traders.map((t) => (
              <TraderCard key={t.id} trader={t} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TraderCard({ trader }: { trader: Trader }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={trader.display_name} path={trader.avatar_path} size={44} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{trader.display_name}</p>
          <p className="text-xs text-muted-foreground">
            Joined {formatManilaDate(trader.created_at)}
            {trader.last_active && ` · ${formatLastActive(trader.last_active)}`}
          </p>
        </div>
      </div>
      <RecordText completed={trader.completed} abandoned={trader.abandoned} />
      {trader.bio && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{trader.bio}</p>
      )}
      <div className="mt-auto flex gap-2">
        <Link href={`/profile/${trader.id}`} className={buttonVariants({ size: "sm" })}>
          View profile
        </Link>
        <Link
          href={`/messages/${trader.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          aria-label={`Message ${trader.display_name}`}
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Link>
      </div>
    </div>
  );
}
