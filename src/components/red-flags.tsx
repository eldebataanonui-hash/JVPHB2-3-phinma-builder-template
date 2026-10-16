import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";

// The red-flag tips from docs/SPEC.md. Each one leads with the line a
// scammer actually says, so traders recognise it in a real chat, then
// says what to do instead.
const RED_FLAGS = [
  {
    line: "Send the full payment first.",
    instead: "Never pay everything up front. Pay in two halves, inside a Deal Room.",
  },
  {
    line: "Just pay a small verification fee.",
    instead: "Verification fees are always a scam. Honest sellers never charge them.",
  },
  {
    line: "No middleman needed, saves you a fee.",
    instead: "Refusing a Deal Room is the warning sign. It's free for both of you.",
  },
  {
    line: "Super cheap, way below other listings!",
    instead: "A price far below similar accounts is bait.",
  },
  {
    line: "Send me your password or GCash code.",
    instead: "Never share your own passwords, or GCash or bank codes. AQTech GHub and honest traders never ask.",
  },
  {
    line: "Here are screenshots and a login video as proof.",
    instead: "Screenshots and videos can be faked. Only trust the live ownership code.",
  },
];

// Safe habits that aren't scam lines, shown in green.
const SAFE_RULES = [
  "A sold account's login only comes through the encrypted login box in the Deal Room, never in chat or Messages. Change that password straight away.",
  "Deal codes (JOIN-…) are safe to share. The only security code ever shared is the Moonton binding code, in the Deal Room chat, at the Lock-In step.",
];

export function RedFlags() {
  return (
    <section
      aria-labelledby="red-flags-title"
      className="flex flex-col gap-4 rounded-[var(--radius)] border-2 border-red-500/60 bg-red-500/5 p-4 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <OctagonAlert className="h-6 w-6 text-red-400" />
        </span>
        <div>
          <h2 id="red-flags-title" className="text-2xl font-bold text-red-400">
            Red flags: stop if you hear these
          </h2>
          <p className="text-sm text-muted-foreground">
            The exact lines scammers use in MLBB trades. If a trader says one,
            stop and insist on a Deal Room.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {RED_FLAGS.map((flag) => (
          <li
            key={flag.line}
            className="flex flex-col gap-1.5 rounded-[var(--radius)] border border-red-500/30 border-l-4 border-l-red-500 bg-card p-3"
          >
            <p className="flex items-start gap-2 font-semibold text-red-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>&ldquo;{flag.line}&rdquo;</span>
            </p>
            <p className="pl-6 text-sm leading-relaxed">{flag.instead}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-emerald-500/30 bg-emerald-500/5 p-3">
        <p className="text-sm font-semibold text-emerald-400">Good to know</p>
        <ul className="flex flex-col gap-2">
          {SAFE_RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-sm leading-relaxed">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
