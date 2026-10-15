"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createDeal(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));

  if (title.length < 1 || title.length > 80) {
    redirect(`/deals/new?error=${encodeURIComponent("Title must be 1 to 80 characters.")}`);
  }
  if (!Number.isInteger(price) || price < 1 || price > 10_000_000) {
    redirect(`/deals/new?error=${encodeURIComponent("Price must be a whole number of pesos.")}`);
  }

  const supabase = await createClient();
  // Only title, description and price are sent. The database fills in
  // the seller, the ownership code and the starting step itself.
  const { data, error } = await supabase
    .from("deals")
    .insert({ title, description, price })
    .select("id")
    .single();

  if (error) redirect(`/deals/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/deals/${data.id}`);
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

  if (error) redirect(`/deals/${dealId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/deals/${dealId}`);
}

// Same rule as the database check in 010-create-messages.sql, so the
// trader gets a friendly message instead of a database error.
const LINK_PATTERN =
  /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop)\b)/i;

export async function sendMessage(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  let problem = "";
  if (body.length < 1 || body.length > 1000) problem = "Messages must be 1 to 1000 characters.";
  else if (LINK_PATTERN.test(body)) problem = "Links aren't allowed in chat. They're how phishing scams work.";

  if (problem) {
    redirect(`/deals/${dealId}?chat_error=${encodeURIComponent(problem)}#chat`);
  }

  const supabase = await createClient();
  // RLS checks you're the seller or buyer, and that a buyer has joined.
  const { error } = await supabase.from("messages").insert({ deal_id: dealId, body });

  if (error) {
    redirect(`/deals/${dealId}?chat_error=${encodeURIComponent(error.message)}#chat`);
  }
  redirect(`/deals/${dealId}#chat`);
}

export async function reportConcern(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10 || message.length > 2000) {
    redirect(
      `/deals/${dealId}?concern_error=${encodeURIComponent("Please describe what happened in 10 to 2000 characters.")}#concern`,
    );
  }

  const supabase = await createClient();
  // RLS checks you're the seller or buyer of this deal.
  const { error } = await supabase
    .from("concerns")
    .insert({ deal_id: dealId, message });

  if (error) {
    redirect(`/deals/${dealId}?concern_error=${encodeURIComponent(error.message)}#concern`);
  }
  redirect(`/deals/${dealId}#concern`);
}

export async function joinDeal(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_deal", { p_deal_id: dealId });

  if (error) redirect(`/deals/${dealId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/deals/${dealId}`);
}
