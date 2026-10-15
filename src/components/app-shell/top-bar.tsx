import Link from "next/link";
import { Gamepad2, LogOut, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
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
    ? await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <div className="flex shrink-0 items-center gap-1">
          <BackButton />
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <span className="hidden font-[family-name:var(--font-display)] text-lg font-bold tracking-wide sm:inline">
              AQTech <span className="text-primary">GHub</span>
            </span>
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
              <Link
                href="/profile"
                className="hidden max-w-[10rem] truncate text-sm font-medium text-muted-foreground hover:text-foreground lg:inline"
              >
                {me?.display_name ?? "My profile"}
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
