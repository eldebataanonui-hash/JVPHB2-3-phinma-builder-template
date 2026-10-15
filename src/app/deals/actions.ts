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
