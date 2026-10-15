"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server actions: these run on the server when a form is submitted.
// Errors are sent back to the page in the URL, e.g. /login?error=...

function withError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signUp(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (displayName.length < 1 || displayName.length > 40) {
    withError("/signup", "Display name must be 1 to 40 characters.");
  }

  // Where the confirmation email's link should send the trader back to:
  // this same site, whether that's localhost or the live URL.
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) withError("/signup", error.message);
  redirect("/signup?sent=1");
}

export async function logIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Where to go after logging in, e.g. back to a Deal Room link. Only
  // paths on this site are allowed, so a crafted link can't send people
  // to another website.
  const nextRaw = String(formData.get("next") ?? "");
  const isLocalPath =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.startsWith("/\\");
  const next = isLocalPath ? nextRaw : "/profile";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Please confirm your email first. Check your inbox for the link."
        : error.message;
    const params = new URLSearchParams({ error: message });
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
