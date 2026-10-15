import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /profile sends you to your own profile page, or to log in.
export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  redirect(`/profile/${user.id}`);
}
