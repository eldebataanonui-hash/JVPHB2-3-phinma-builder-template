"use server";

import { redirect } from "next/navigation";
import { containsLink } from "@/lib/links";
import { SOCIALS, cleanUsername, type SocialKey } from "@/lib/socials";
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

// Save your optional social media usernames. Only usernames are stored;
// the links are built by the app, always to the real sites.
export async function updateSocials(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/profile/${user.id}`;
  const changes: Partial<Record<SocialKey, string | null>> = {};
  for (const { key } of SOCIALS) {
    const cleaned = cleanUsername(String(formData.get(key) ?? ""));
    if (cleaned === false) redirect(`${back}?social_error=social_invalid#socials`);
    changes[key] = cleaned;
  }

  const { error } = await supabase.from("profiles").update(changes).eq("id", user.id);
  if (error) redirect(`${back}?social_error=failed#socials`);
  redirect(`${back}?socials_saved=1#socials`);
}

// Point your profile at a picture you just uploaded, then delete the
// old one. The database also refuses any path outside your own folder.
export async function setAvatar(path: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  if (!new RegExp(`^${user.id}/[0-9]+\\.(jpg|png|webp)$`).test(path)) return { ok: false };

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  if (error) return { ok: false };

  if (before?.avatar_path && before.avatar_path !== path) {
    await supabase.storage.from("avatars").remove([before.avatar_path]);
  }
  return { ok: true };
}

export async function removeAvatar(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id);
  if (error) return { ok: false };

  if (before?.avatar_path) {
    await supabase.storage.from("avatars").remove([before.avatar_path]);
  }
  return { ok: true };
}
