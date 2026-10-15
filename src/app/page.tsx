import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { RedFlags } from "@/components/red-flags";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <div className="flex flex-wrap gap-3">
        {user ? (
          <Link href="/profile" className={buttonVariants()}>
            Go to my profile
          </Link>
        ) : (
          <>
            <Link href="/signup" className={buttonVariants()}>
              Sign up
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Log in
            </Link>
          </>
        )}
      </div>

      <RedFlags />

      <Link href="/rules" className="text-sm underline">
        Read the Trading Rules
      </Link>
    </main>
  );
}
