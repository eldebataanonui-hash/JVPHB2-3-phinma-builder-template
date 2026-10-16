"use server";

import { redirect } from "next/navigation";
import { containsLink } from "@/lib/links";
import { createClient } from "@/lib/supabase/server";

// Errors go back to the page as short codes (see src/lib/errors.ts),
// never as text, so nobody can put their own words on our pages.

function dealUrl(dealId: string, query = "", hash = "") {
  return `/deals/${encodeURIComponent(dealId)}${query}${hash}`;
}

export async function createDeal(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));

  if (title.length < 1 || title.length > 80) redirect("/deals/new?error=title_length");
  if (!Number.isInteger(price) || price < 1 || price > 10_000_000) {
    redirect("/deals/new?error=price_invalid");
  }
  if (containsLink(`${title} ${description}`)) redirect("/deals/new?error=deal_link");

  const supabase = await createClient();
  // Only title, description and price are sent. The database fills in
  // the seller, the ownership code and the starting step itself.
  const { data, error } = await supabase
    .from("deals")
    .insert({ title, description, price })
    .select("id")
    .single();

  if (error) redirect("/deals/new?error=failed");
  redirect(dealUrl(data.id));
}

export async function advanceDeal(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const fromStep = String(formData.get("from_step") ?? "");

  const supabase = await createClient();
  // The database checks it's your turn and the right step.
  const { error } = await supabase.rpc("advance_deal", {
    p_deal_id: dealId,
    p_from_step: fromStep,
  });

  if (error) {
    const code = error.message.includes("already done")
      ? "step_already_done"
      : error.message.includes("not your turn")
        ? "not_your_turn"
        : error.message.includes("payment method")
          ? "choose_payment_first"
          : error.message.includes("login details")
            ? "credentials_first"
            : "failed";
    redirect(dealUrl(dealId, `?error=${code}`));
  }
  redirect(dealUrl(dealId));
}

export async function choosePaymentMethod(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const method = String(formData.get("method") ?? "");

  const supabase = await createClient();
  // The database checks you're the buyer, it's before the first half,
  // and the method is on the list.
  const { error } = await supabase.rpc("choose_payment_method", {
    p_deal_id: dealId,
    p_method: method,
  });

  if (error) redirect(dealUrl(dealId, "?error=failed"));
  redirect(dealUrl(dealId));
}

export async function sendMessage(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 1 || body.length > 1000) {
    redirect(dealUrl(dealId, "?chat_error=chat_length", "#chat"));
  }
  if (containsLink(body)) {
    redirect(dealUrl(dealId, "?chat_error=chat_link", "#chat"));
  }

  const supabase = await createClient();
  // RLS checks you're the seller or buyer, and that a buyer has joined.
  const { error } = await supabase.from("messages").insert({ deal_id: dealId, body });

  if (error) redirect(dealUrl(dealId, "?chat_error=failed", "#chat"));
  redirect(dealUrl(dealId, "", "#chat"));
}

export async function reportConcern(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10 || message.length > 2000) {
    redirect(dealUrl(dealId, "?concern_error=concern_length", "#concern"));
  }

  const supabase = await createClient();
  // RLS checks you're the seller or buyer of this deal.
  const { error } = await supabase
    .from("concerns")
    .insert({ deal_id: dealId, message });

  if (error) redirect(dealUrl(dealId, "?concern_error=failed", "#concern"));
  redirect(dealUrl(dealId, "", "#concern"));
}

// Seller sends the account login details. The database encrypts them
// (Supabase Vault) and checks it's the seller, at the handover step.
export async function submitCredentials(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!login || !password || login.length > 200 || password.length > 200 || note.length > 500) {
    redirect(dealUrl(dealId, "?cred_error=credentials_invalid"));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_credentials", {
    p_deal_id: dealId,
    p_login: login,
    p_password: password,
    p_note: note,
  });

  if (error) redirect(dealUrl(dealId, "?cred_error=failed"));
  redirect(dealUrl(dealId));
}

// Buyer reveals the login details. Returned only to this request, never
// put in the page by default.
export async function revealCredentials(
  dealId: string,
): Promise<{ ok: true; creds: { login: string; password: string; note: string } } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("read_credentials", { p_deal_id: dealId });
  const row = data?.[0];
  if (error || !row) return { ok: false, message: "The login details aren't available right now." };
  return { ok: true, creds: { login: row.login, password: row.password, note: row.note ?? "" } };
}

export async function deleteDealPhoto(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const name = String(formData.get("name") ?? "");

  // Only a plain file name inside this deal's folder.
  if (!/^[0-9]+\.(jpg|png|webp)$/.test(name)) redirect(dealUrl(dealId));

  const supabase = await createClient();
  // The storage rules only let the deal's seller delete.
  await supabase.storage.from("deal-photos").remove([`${dealId}/${name}`]);
  redirect(dealUrl(dealId));
}

export async function joinDeal(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_deal", { p_deal_id: dealId });

  if (error) redirect(dealUrl(dealId, "?error=join_failed"));
  redirect(dealUrl(dealId));
}

// A trader rates the other trader after a completed deal. The database
// checks it's your deal, it's completed, within 7 days, one review each.
export async function submitReview(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const stars = Number(formData.get("stars"));
  const tags = formData.getAll("tags").map(String);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!Number.isInteger(stars) || stars < 1 || stars > 5 || comment.length > 300) {
    redirect(dealUrl(dealId, "?review_error=review_invalid", "#review"));
  }
  if (containsLink(comment)) {
    redirect(dealUrl(dealId, "?review_error=review_link", "#review"));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_deal_id: dealId,
    p_stars: stars,
    p_tags: tags,
    p_comment: comment,
  });

  if (error) {
    const code = error.message.includes("already reviewed")
      ? "review_done"
      : error.message.includes("window has closed")
        ? "review_closed"
        : "failed";
    redirect(dealUrl(dealId, `?review_error=${code}`, "#review"));
  }
  redirect(dealUrl(dealId, "", "#review"));
}
