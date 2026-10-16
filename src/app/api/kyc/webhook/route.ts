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

  let body: { webhook_type?: string; session_id?: string; status?: string; vendor_data?: string; timestamp?: number };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Replay protection: the timestamp INSIDE the signed body must be
  // recent too (the X-Timestamp header itself isn't covered by the
  // signature). One hour, not five minutes, so Didit's own retries of a
  // failed delivery (same body, same timestamp) still get through.
  const sentAt = Number(body.timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 3600) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const userId = body.vendor_data ?? "";
  if (body.webhook_type === "status.updated" && body.session_id && body.status && /^[0-9a-f-]{36}$/i.test(userId)) {
    const supabase = await createClient();
    // Only works with the server's secret (see supabase/sql/028).
    const { error } = await supabase.rpc("record_kyc_result", {
      p_secret: process.env.KYC_RECORD_SECRET ?? "",
      p_user_id: userId,
      p_session_id: body.session_id,
      p_status: body.status,
    });
    if (error) {
      // Tell Didit it failed so it retries. Log only the error code,
      // never any secret.
      console.error("record_kyc_result failed:", error.code);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
