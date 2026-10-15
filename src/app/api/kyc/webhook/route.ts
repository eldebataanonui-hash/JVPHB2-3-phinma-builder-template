import { NextResponse, type NextRequest } from "next/server";
import { webhookIsGenuine } from "@/lib/didit";
import { createClient } from "@/lib/supabase/server";

// Didit tells us here when a verification's status changes. We check the
// signature first; anything not genuinely from Didit is refused.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const genuine = webhookIsGenuine(raw, {
    v2: request.headers.get("x-signature-v2"),
    raw: request.headers.get("x-signature"),
    timestamp: request.headers.get("x-timestamp"),
  });
  if (!genuine) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { webhook_type?: string; session_id?: string; status?: string; vendor_data?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = body.vendor_data ?? "";
  if (body.webhook_type === "status.updated" && body.session_id && body.status && /^[0-9a-f-]{36}$/i.test(userId)) {
    const supabase = await createClient();
    // Only works with the server's secret (see supabase/sql/028).
    await supabase.rpc("record_kyc_result", {
      p_secret: process.env.KYC_RECORD_SECRET ?? "",
      p_user_id: userId,
      p_session_id: body.session_id,
      p_status: body.status,
    });
  }

  return NextResponse.json({ ok: true });
}
