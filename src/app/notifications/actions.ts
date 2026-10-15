"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Tapping a notification: mark it read, then go where it points.
export async function openNotification(formData: FormData) {
  const id = Number(formData.get("id"));
  const href = String(formData.get("href") ?? "/notifications");

  const supabase = await createClient();
  // RLS only lets you update your own notifications, and only read_at.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  // Only ever go to a page on this site.
  redirect(/^\/(deals|messages)\/[0-9a-f-]+(#chat|#receipt)?$/i.test(href) ? href : "/notifications");
}

export async function markAllRead() {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  redirect("/notifications");
}
