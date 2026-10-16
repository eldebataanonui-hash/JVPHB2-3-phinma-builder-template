// Didit ID verification (a real ID + selfie check). SERVER-ONLY: import this only from server
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

// The site's own address, for Didit's return link. A fixed value (the
// optional SITE_URL setting, or Vercel's production address) rather
// than whatever the browser's request says.
export async function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const { headers } = await import("next/headers");
  return (await headers()).get("origin") ?? "";
}

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

// Sorts object keys at every level, the way Didit builds its "V2"
// signature (compact JSON with sorted keys). Whole-number floats are
// already plain numbers in JavaScript, matching Didit's own Node sample.
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

function sameHex(expected: string, given: string | null) {
  if (!given) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Checks a webhook really came from Didit, and is less than 5 minutes
// old. Didit's recommended check is X-Signature-V2: an HMAC-SHA256 (with
// our webhook secret) of the body as sorted, compact JSON. As a fallback
// we also accept X-Signature over the exact raw bytes.
export function webhookIsGenuine(
  rawBody: string,
  headers: { v2: string | null; raw: string | null; timestamp: string | null },
) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !headers.timestamp) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(headers.timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  let canonical: string;
  try {
    canonical = JSON.stringify(sortKeys(JSON.parse(rawBody)));
  } catch {
    return false;
  }
  const v2 = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  if (sameHex(v2, headers.v2)) return true;

  const raw = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return sameHex(raw, headers.raw);
}
