"use server";

import { redirect } from "next/navigation";
import { containsLink } from "@/lib/links";
import { createClient } from "@/lib/supabase/server";

export async function sendDirectMessage(formData: FormData) {
  const recipientId = String(formData.get("recipient_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const back = `/messages/${encodeURIComponent(recipientId)}`;

  if (body.length < 1 || body.length > 1000) redirect(`${back}?error=chat_length`);
  if (containsLink(body)) redirect(`${back}?error=chat_link`);

  const supabase = await createClient();
  // The database fills in you as the sender and rejects links.
  const { error } = await supabase
    .from("direct_messages")
    .insert({ recipient_id: recipientId, body });

  if (error) {
    const code = error.code === "23514" ? "chat_link" : error.code === "42501" ? "chat_rate" : "failed";
    redirect(`${back}?error=${code}`);
  }
  redirect(back);
}
