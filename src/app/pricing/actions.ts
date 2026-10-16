"use server";

import { redirect } from "next/navigation";
import { planById } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

// Save the plan you'd subscribe to. Nothing is charged: payments aren't
// switched on. RLS only lets you save or change your own pick.
export async function pickPlan(formData: FormData) {
  const plan = planById(String(formData.get("plan") ?? ""));
  if (!plan) redirect("/pricing?error=failed#plans");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  const { data: existing } = await supabase
    .from("plan_picks")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("plan_picks")
        .update({ plan: plan.id, picked_at: new Date().toISOString() })
        .eq("user_id", user.id)
    : await supabase.from("plan_picks").insert({ plan: plan.id });

  if (error) redirect("/pricing?error=failed#plans");
  redirect("/pricing?picked=1#plans");
}

export async function clearPlanPick() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  await supabase.from("plan_picks").delete().eq("user_id", user.id);
  redirect("/pricing#plans");
}
