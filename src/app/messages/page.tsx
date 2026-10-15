import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { formatManilaTime } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";

// Your inbox: one row per trader you've messaged with, newest first.
export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  // RLS only returns messages you sent or received.
  const { data: messages } = await supabase
    .from("direct_messages")
    .select("sender_id, recipient_id, body, created_at")
    .order("id", { ascending: false })
    .limit(500);

  // Keep the newest message per conversation.
  const latest = new Map<string, { body: string; created_at: string; fromMe: boolean }>();
  for (const m of messages ?? []) {
    const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!latest.has(other)) {
      latest.set(other, { body: m.body, created_at: m.created_at, fromMe: m.sender_id === user.id });
    }
  }

  const { data: people } = latest.size
    ? await supabase.from("profiles").select("id, display_name, avatar_path").in("id", [...latest.keys()])
    : { data: [] };
  const personOf = (id: string) => people?.find((p) => p.id === id);
  const nameOf = (id: string) => personOf(id)?.display_name ?? "Trader";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Ask questions before you trade. Deal codes (JOIN-…) are fine to
            share here. Never pay here, and never share any password or a
            security code: start a Deal Room for any trade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {latest.size === 0 && (
            <p className="text-sm text-muted-foreground">
              No messages yet. Open a trader&apos;s profile and tap Message.
            </p>
          )}
          {[...latest.entries()].map(([otherId, m]) => (
            <Link
              key={otherId}
              href={`/messages/${otherId}`}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-border p-3 hover:bg-secondary"
            >
              <Avatar name={nameOf(otherId)} path={personOf(otherId)?.avatar_path} size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex justify-between gap-3 text-sm font-medium">
                <span>{nameOf(otherId)}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {formatManilaTime(m.created_at)}
                </span>
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {m.fromMe ? "You: " : ""}
                {m.body}
              </span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
