import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { formatManilaTime, paymentLabel } from "@/lib/deals";
import { notificationHref, notificationText } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { markAllRead, openNotification } from "@/app/notifications/actions";

// Everything that happened in your deals and messages, newest first.
export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  // RLS only returns your own notifications.
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, actor_id, kind, deal_id, created_at, read_at")
    .order("id", { ascending: false })
    .limit(100);
  const list = notifications ?? [];

  const actorIds = [...new Set(list.map((n) => n.actor_id))];
  const dealIds = [...new Set(list.map((n) => n.deal_id).filter((x): x is string => Boolean(x)))];
  const [{ data: people }, { data: deals }] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, display_name, avatar_path").in("id", actorIds)
      : Promise.resolve({ data: [] }),
    dealIds.length
      ? supabase.from("deals").select("id, title, payment_method").in("id", dealIds)
      : Promise.resolve({ data: [] }),
  ]);
  const person = (id: string) => people?.find((p) => p.id === id);
  const dealOf = (id: string | null) => deals?.find((d) => d.id === id);
  const dealTitle = (id: string | null) => dealOf(id)?.title ?? "a deal";
  const dealMethod = (id: string | null) => paymentLabel(dealOf(id)?.payment_method ?? null);
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Notifications</CardTitle>
          {unread > 0 && (
            <form action={markAllRead}>
              <Button type="submit" variant="outline" size="sm">
                Mark all as read
              </Button>
            </form>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing yet. You&apos;ll be told here when the other trader
              confirms a step or sends you a message.
            </p>
          )}
          {list.map((n) => {
            const who = person(n.actor_id)?.display_name ?? "A trader";
            return (
              <form key={n.id} action={openNotification}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="href" value={notificationHref(n)} />
                <button
                  type="submit"
                  className={`flex w-full items-start gap-3 rounded-[var(--radius)] border p-3 text-left hover:bg-secondary ${
                    n.read_at ? "border-border" : "border-primary/40 bg-primary/10"
                  }`}
                >
                  <Avatar name={who} path={person(n.actor_id)?.avatar_path} size={36} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm">{notificationText(n.kind, who, dealTitle(n.deal_id), dealMethod(n.deal_id))}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatManilaTime(n.created_at)}
                    </span>
                  </span>
                  {!n.read_at && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary">
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </button>
              </form>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}
