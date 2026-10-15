"use server";

import { redirect } from "next/navigation";
import { containsLink } from "@/lib/links";
import { createClient } from "@/lib/supabase/server";

export async function updateBio(formData: FormData) {
  const bio = String(formData.get("bio") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/profile/${user.id}`;
  if (bio.length > 500) redirect(`${back}?error=bio_length`);
  if (containsLink(bio)) redirect(`${back}?error=bio_link`);

  // The database only lets you change the bio column of your own row.
  const { error } = await supabase
    .from("profiles")
    .update({ bio })
    .eq("id", user.id);

  if (error) redirect(`${back}?error=failed`);
  redirect(`${back}?saved=1`);
}
