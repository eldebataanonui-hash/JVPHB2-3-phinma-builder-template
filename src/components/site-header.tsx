import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions";

// The bar at the top of every page: app name, Back, and log in / out.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1">
          <BackButton />
          <Link href="/" className="px-2 font-semibold">
            AQTech GHub
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                My deals
              </Link>
              <form action={logOut}>
                <Button type="submit" variant="outline" size="sm">
                  Log out
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
        </nav>
      </div>
    </header>
  );
}
