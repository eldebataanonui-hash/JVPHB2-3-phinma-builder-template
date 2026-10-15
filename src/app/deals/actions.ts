"use server";

import { redirect } from "next/navigation";
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
        : "failed";
    redirect(dealUrl(dealId, `?error=${code}`));
  }
  redirect(dealUrl(dealId));
}

// Same rule as the database check in 012-review-fixes.sql, so the
// trader gets a friendly message instead of a database error. Email
// addresses are removed first: the Lock-In step needs the buyer to send
// theirs, and "gmail.com" would otherwise look like a link.
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const LINK_PATTERN =
  /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\b)/i;

export async function sendMessage(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 1 || body.length > 1000) {
    redirect(dealUrl(dealId, "?chat_error=chat_length", "#chat"));
  }
  if (LINK_PATTERN.test(body.replace(EMAIL_PATTERN, ""))) {
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

export async function joinDeal(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_deal", { p_deal_id: dealId });

  if (error) redirect(dealUrl(dealId, "?error=join_failed"));
  redirect(dealUrl(dealId));
}
