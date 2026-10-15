import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVerificationDecision } from "@/lib/didit";
import { createClient } from "@/lib/supabase/server";

// Didit sends the trader back here after the ID check. We ask Didit
// directly for the result (never trusting the address bar), check it
// belongs to this trader, then save it.
export default async function VerifyCallbackPage(props: PageProps<"/verify/callback">) {
  const { verificationSessionId } = await props.searchParams;
  const sessionId = typeof verificationSessionId === "string" ? verificationSessionId : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const decision = sessionId ? await getVerificationDecision(sessionId) : null;
  let status = "Unknown";
  if (decision && decision.vendor_data === user.id && decision.status) {
    status = decision.status;
    await supabase.rpc("record_kyc_result", {
      p_secret: process.env.KYC_RECORD_SECRET ?? "",
      p_user_id: user.id,
      p_session_id: sessionId,
      p_status: status,
    });
  }

  const message =
    status === "Approved"
      ? { title: "ID verified (demo) ✓", body: "Your profile now shows the ID verified badge." }
      : status === "In Review"
        ? { title: "Being reviewed", body: "Didit is reviewing your check. Your badge will appear when it's approved." }
        : status === "Declined"
          ? { title: "Not verified", body: "The check didn't pass. You can try again from your profile." }
          : { title: "Not finished", body: "We couldn't get a result yet. If you finished the check, it may still update in a few minutes." };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{message.title}</CardTitle>
          <CardDescription>{message.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile" className={buttonVariants()}>
            Back to my profile
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
