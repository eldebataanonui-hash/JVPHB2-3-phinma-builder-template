import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The red-flag tips from docs/SPEC.md: the exact lines scammers use.
const RED_FLAGS = [
  "Never pay the full price first. Pay in two halves, inside a Deal Room.",
  "\"Verification fees\" are a scam. Honest sellers don't charge them.",
  "\"No middleman needed\" is a scam line. Refusing a Deal Room is a warning sign.",
  "A price far below similar listings is a warning sign.",
  "Never share your password or a GCash/bank code. AQTech GHub and honest traders never ask for them.",
  "The only code ever shared is the Moonton binding code, inside the Deal Room, at the Lock-In step.",
  "Screenshots and videos can be faked. Only trust the live ownership code.",
];

export function RedFlags() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Red flags</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {RED_FLAGS.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
