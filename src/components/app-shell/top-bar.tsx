import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { trialInfo } from "@/lib/plans";
import { plural } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions";

// The bar across the top: logo on the left, search in the middle,
// log in / log out on the right.
export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = user
    ? await supabase.from("profiles").select("display_name, avatar_path, created_at").eq("id", user.id).maybeSingle()
    : { data: null };
  const trial = me ? trialInfo(me.created_at) : null;

  // Unread notifications for the bell. RLS only counts your own.
  const { count: unread } = user
    ? await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
    : { count: 0 };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <div className="flex shrink-0 items-center gap-1">
          <BackButton />
          <Link href="/" aria-label="AQTech GHub home">
            {/* Badge only on phones, badge and name on bigger screens. */}
            <Logo showName={false} className="sm:hidden" />
            <Logo className="hidden sm:flex" />
          </Link>
        </div>

        {/* Search traders by name. Sends you to Find traders. */}
        <form action="/traders" className="mx-auto min-w-0 flex-1 sm:max-w-md">
          <label className="relative block">
            <span className="sr-only">Search traders</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              placeholder="Search traders"
              minLength={2}
              maxLength={40}
              className="h-9 w-full min-w-0 rounded-full border border-input bg-secondary pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {trial?.active && (
                <Link
                  href="/pricing"
                  className="inline-flex shrink-0 items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 sm:px-3"
                  aria-label={`Free trial, ${plural(trial.daysLeft, "day")} left. See plans.`}
                >
                  <span className="hidden sm:inline">Free trial · </span>
                  {trial.daysLeft}d<span className="hidden sm:inline">&nbsp;left</span>
                </Link>
              )}
              <NotificationBell initialCount={unread ?? 0} />
              <Link href="/profile" className="flex items-center gap-2" aria-label="My profile">
                <Avatar name={me?.display_name ?? "?"} path={me?.avatar_path} size={32} />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-muted-foreground hover:text-foreground lg:inline">
                  {me?.display_name ?? "My profile"}
                </span>
              </Link>
              <form action={logOut}>
                <Button type="submit" variant="outline" size="sm" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
