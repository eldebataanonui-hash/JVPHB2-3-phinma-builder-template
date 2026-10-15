import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The Trading Rules: public, so anyone can read them before signing up.
const SECTIONS = [
  {
    title: "How a trade works",
    points: [
      "Every trade happens in a Deal Room, one seller and one buyer.",
      "The seller proves they control the account with the live ownership code.",
      "The buyer pays in two halves, around the Lock-In Checklist. Never the full price first.",
      "Each step is confirmed by the right person, in order, and recorded with the time.",
    ],
  },
  {
    title: "What counts as a broken deal",
    points: [
      "Confirming a step that didn't really happen, such as \"I've sent the first half\" when you haven't.",
      "Taking the account back after the buyer confirmed full control.",
      "Asking for payment, fees or codes outside the Deal Room.",
      "Asking anyone for their password or a GCash/bank code. The only code ever shared is the Moonton binding code, in the Deal Room chat, at the Lock-In step.",
      "Sending links in the Deal Room chat, or moving the deal to another app to send them.",
      "Leaving a deal unfinished for more than 3 days. It counts as abandoned on your record.",
    ],
  },
  {
    title: "If something goes wrong",
    points: [
      "Stop. Don't send any more money.",
      "Tap Report a concern in the Deal Room and describe what happened.",
      "Keep your GCash or bank receipts and screenshots of your chats.",
    ],
  },
  {
    title: "What our team can and can't do",
    points: [
      "We review every concern alongside the deal's record, which nobody can edit.",
      "We may contact both traders by email.",
      "We never hold your money, and we can't reverse payments. GCash and banks handle that.",
      "We respond to concerns within 48 hours.",
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Trading Rules</h1>
        <p className="text-sm text-muted-foreground">
          By trading on AQTech GHub, both traders agree to these rules.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </main>
  );
}
