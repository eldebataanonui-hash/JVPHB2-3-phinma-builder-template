import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RefreshButton } from "@/components/refresh-button";
import { formatManilaTime } from "@/lib/deals";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { sendDirectMessage } from "@/app/messages/actions";

// A conversation with one trader.
export default async function ConversationPage(props: PageProps<"/messages/[id]">) {
  const { id: otherId } = await props.params;
  const error = errorText((await props.searchParams).error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${otherId}`);
  if (otherId === user.id) redirect("/messages");

  const { data: other } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", otherId)
    .maybeSingle();
  if (!other) notFound();

  // RLS only returns messages you sent or received; narrow to this pair.
  // other.id came from the database, so it's a real id, not raw input.
  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, body, created_at")
    .or(`sender_id.eq.${other.id},recipient_id.eq.${other.id}`)
    .order("id")
    .limit(500);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Link href={`/profile/${other.id}`} className="underline">
              {other.display_name}
            </Link>
          </CardTitle>
          <CardDescription className="font-medium text-destructive">
            Never pay or share codes here. Start a Deal Room for any trade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messages && messages.length > 0 ? (
            <ul className="flex flex-col gap-2 text-sm">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] rounded-[var(--radius)] border border-border p-2 ${
                    m.sender_id === user.id ? "self-end bg-secondary" : "self-start"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    {m.sender_id === user.id ? "You" : other.display_name} ·{" "}
                    {formatManilaTime(m.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello and ask about their account.
            </p>
          )}

          <form action={sendDirectMessage} className="flex flex-col gap-2">
            <input type="hidden" name="recipient_id" value={other.id} />
            <Textarea name="body" required maxLength={1000} rows={2} placeholder="Message" aria-label="Message" />
            <p className="text-xs text-muted-foreground">
              Messages can&apos;t be deleted. Links are blocked. Refresh to see
              replies.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Send</Button>
              <RefreshButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
