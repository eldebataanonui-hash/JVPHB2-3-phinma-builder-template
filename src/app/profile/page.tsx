import { redirect } from "next/navigation";
import { isAllowedDisplayName } from "@/lib/display-names";
import { createClient } from "@/lib/supabase/server";

// /profile sends you to your own profile page, or to log in.
export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Safety net: the database trigger normally creates the profile when
  // the email is confirmed. If it's missing (e.g. the account was
  // confirmed before the trigger existed), create it now. You can only
  // log in with a confirmed email, so this keeps "has a profile = email
  // confirmed" true. Does nothing if the profile already exists.
  const wanted = String(user.user_metadata?.display_name ?? "").trim().slice(0, 40);
  const name = isAllowedDisplayName(wanted) ? wanted : "Trader";
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name: name },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-8">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-destructive">
          We couldn&apos;t set up your profile. Please try again.
        </p>
      </main>
    );
  }

  redirect(`/profile/${user.id}`);
}
