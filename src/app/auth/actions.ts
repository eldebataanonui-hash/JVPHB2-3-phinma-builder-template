"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedDisplayName } from "@/lib/display-names";
import { authErrorCode } from "@/lib/errors";
import { safeNextPath } from "@/lib/safe-path";

// Server actions: these run on the server when a form is submitted.
// Errors go back to the page as short codes, e.g. /login?error=...
// (see src/lib/errors.ts), never as text.

export async function signUp(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Where to go once the email is confirmed, e.g. Join a deal for a new
  // buyer who arrived with a deal code.
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const keepNext = next !== "/profile" ? `&next=${encodeURIComponent(next)}` : "";

  if (displayName.length < 1 || displayName.length > 40) {
    redirect(`/signup?error=name_length${keepNext}`);
  }
  if (!isAllowedDisplayName(displayName)) redirect(`/signup?error=name_reserved${keepNext}`);

  // Where the confirmation email's link should send the trader back to:
  // this same site, whether that's localhost or the live URL.
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) redirect(`/signup?error=${authErrorCode(error.code, "failed")}${keepNext}`);
  redirect(`/signup?sent=1${keepNext}`);
}

export async function logIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Where to go after logging in, e.g. back to a Deal Room or Join a deal.
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const isLocalPath = next !== "/profile";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({
      error: authErrorCode(error.code, "invalid_credentials"),
    });
    if (isLocalPath) params.set("next", next);
    redirect(`/login?${params}`);
  }
  redirect(next);
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
