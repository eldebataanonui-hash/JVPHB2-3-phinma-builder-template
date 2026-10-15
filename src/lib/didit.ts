// Didit ID verification (demo). SERVER-ONLY: import this only from server
// actions, route handlers and server components. The keys below must
// never be NEXT_PUBLIC_ variables.
//
//   DIDIT_API_KEY         from the Didit console (API key)
//   DIDIT_WORKFLOW_ID     the workflow with ID check + liveness + face match
//   DIDIT_WEBHOOK_SECRET  the webhook "secret shared key" from the console
//   KYC_RECORD_SECRET     our own random secret; the same value is stored
//                         in Supabase Vault as "kyc_record_secret"
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://verification.didit.me/v3";

export function diditConfigured() {
  return Boolean(
    process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID && process.env.KYC_RECORD_SECRET,
  );
}

// Starts a verification and returns Didit's hosted page to send the
// trader to. vendor_data carries our user id so results come back to the
// right trader.
export async function createVerificationSession(userId: string, callbackUrl: string) {
  const res = await fetch(`${BASE}/session/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.DIDIT_API_KEY ?? "",
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      callback: callbackUrl,
      vendor_data: userId,
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { session_id?: string; url?: string };
  return data.url && data.session_id ? { url: data.url, sessionId: data.session_id } : null;
}

// Asks Didit directly for a session's result. Never trust the status in
// the address bar: anyone can type "status=Approved".
export async function getVerificationDecision(sessionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const res = await fetch(`${BASE}/session/${sessionId}/decision/`, {
    headers: { "x-api-key": process.env.DIDIT_API_KEY ?? "" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: string; vendor_data?: string; session_id?: string };
  return data.status ? data : null;
}

// Checks a webhook really came from Didit: the HMAC-SHA256 of the raw
// body with our webhook secret must match X-Signature, and it must be
// less than 5 minutes old.
export function webhookIsGenuine(rawBody: string, signature: string | null, timestamp: string | null) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
