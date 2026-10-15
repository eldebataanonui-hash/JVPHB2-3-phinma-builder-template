import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-path";

// The link in the confirmation email lands here. By this point Supabase
// has already confirmed the email. If the trader opened the link in the
// same browser they signed up in, we can log them straight in. If not
// (say, sign-up on a laptop, link opened on a phone), we send them to
// log in instead. Either way they end up where they were heading, e.g.
// Join a deal for a new buyer who arrived with a deal code.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const linkError = searchParams.get("error_description");
  const next = safeNextPath(searchParams.get("next"));
  const keepNext = next !== "/profile" ? `&next=${encodeURIComponent(next)}` : "";

  if (linkError) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid${keepNext}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?confirmed=1${keepNext}`);
}
