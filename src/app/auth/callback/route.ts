import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the confirmation email lands here. By this point Supabase
// has already confirmed the email. If the trader opened the link in the
// same browser they signed up in, we can log them straight in. If not
// (say, sign-up on a laptop, link opened on a phone), we send them to
// log in instead.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const linkError = searchParams.get("error_description");

  if (linkError) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/profile`);
  }

  return NextResponse.redirect(`${origin}/login?confirmed=1`);
}
