"use server";

import { redirect } from "next/navigation";
import { createVerificationSession, diditConfigured, siteUrl } from "@/lib/didit";
import { containsLink } from "@/lib/links";
import { cleanAccountNumber, isPaymentMethod } from "@/lib/payment-accounts";
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

// Start an ID verification with Didit and send the trader to
// Didit's secure page. Didit, not AQTech GHub, handles the ID photo and
// the selfie.
export async function startIdVerification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/profile/${user.id}`;
  if (!diditConfigured()) redirect(`${back}?kyc_error=kyc_not_set_up#verify`);

  const session = await createVerificationSession(user.id, `${await siteUrl()}/verify/callback`);
  if (!session) redirect(`${back}?kyc_error=failed#verify`);
  redirect(session.url);
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

// Add an e-wallet or bank account you can be paid to. Only you can see
// your list; the other trader sees it inside a deal you're both in.
export async function addPaymentAccount(formData: FormData) {
  const method = String(formData.get("method") ?? "");
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountName = String(formData.get("account_name") ?? "").trim();
  const accountNumber = cleanAccountNumber(String(formData.get("account_number") ?? ""));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/profile/${user.id}`;
  const fail = (code: string) => redirect(`${back}?pay_error=${code}#payment-accounts`);

  if (!isPaymentMethod(method) || !accountNumber) fail("pay_account_invalid");
  if (accountName.length < 1 || accountName.length > 80 || bankName.length > 40) fail("pay_account_invalid");
  if (method === "instapay" && !bankName) fail("pay_account_bank");
  if (containsLink(`${accountName} ${bankName}`)) fail("pay_account_invalid");

  // The database fills in who you are and allows at most 10.
  const { error } = await supabase.from("payment_accounts").insert({
    method,
    bank_name: method === "instapay" ? bankName : "",
    account_name: accountName,
    account_number: accountNumber,
  });

  if (error) {
    fail(
      error.code === "23505"
        ? "pay_account_duplicate"
        : error.message.includes("up to 10")
          ? "pay_account_limit"
          : "failed",
    );
  }
  redirect(`${back}?pay_saved=1#payment-accounts`);
}

export async function removePaymentAccount(formData: FormData) {
  const id = Number(formData.get("id"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS only lets you delete your own accounts.
  if (Number.isInteger(id)) await supabase.from("payment_accounts").delete().eq("id", id);
  redirect(`/profile/${user.id}#payment-accounts`);
}
