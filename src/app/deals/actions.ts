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

export async function joinDeal(formData: FormData) {
  const dealId = String(formData.get("deal_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_deal", { p_deal_id: dealId });

  if (error) redirect(`/deals/${dealId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/deals/${dealId}`);
}
