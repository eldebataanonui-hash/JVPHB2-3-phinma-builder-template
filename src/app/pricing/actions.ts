"use server";

import { redirect } from "next/navigation";
import { planById } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

// Save the plan you'd subscribe to. Nothing is charged: payments aren't
// switched on. RLS only lets you save or change your own pick.
export async function pickPlan(formData: FormData) {
  const plan = planById(String(formData.get("plan") ?? ""));
  if (!plan) redirect("/pricing?error=plan_failed#plans");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  // One step: add your pick, or change it if you already have one. The
  // database fills in who you are, so a double click can't fail.
  const { error } = await supabase
    .from("plan_picks")
    .upsert({ plan: plan.id }, { onConflict: "user_id" });

  if (error) redirect("/pricing?error=plan_failed#plans");
  redirect("/pricing?picked=1#plans");
}

export async function clearPlanPick() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pricing");

  const { error } = await supabase.from("plan_picks").delete().eq("user_id", user.id);
  if (error) redirect("/pricing?error=plan_failed#plans");
  redirect("/pricing#plans");
}
