import { cn } from "@/lib/utils";

// The AQTech GHub logo: a pixel-art game controller with bunny ears,
// plus the name. Used in the top bar, the sidebar's About us link and
// the About page, so it always looks the same.
//
// Each letter in BUNNY_PAD is one pixel:
//   E = ear / outline   P = inner ear (pink)   B = controller body
//   o = button / d-pad (dark)   . = empty
const BUNNY_PAD = [
  "...EE......EE...",
  "..EPPE....EPPE..",
  "..EPPE....EPPE..",
  "..EPPE....EPPE..",
  "...EE......EE...",
  "..BBBBBBBBBBBB..",
  ".BBBBBBBBBBBBBB.",
  ".BBBoBBBBBBoBBB.",
  ".BBoooBBBBoBoBB.",
  ".BBBoBBBBBBoBBB.",
  ".BBBBBBBBBBBBBB.",
  ".BBBB......BBBB.",
  "..BB........BB..",
];

const COLOURS: Record<string, string> = {
  E: "var(--primary)",
  P: "#f7c6e6",
  B: "var(--primary)",
  o: "#0b0e17",
};

export function BunnyPad({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 16 ${BUNNY_PAD.length}`}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {BUNNY_PAD.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          COLOURS[cell] ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLOURS[cell]} />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function Logo({
  size = "md",
  showName = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const badge = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-16 w-16" }[size];
  const art = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-12 w-12" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-4xl" }[size];

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-secondary",
          badge,
        )}
      >
        <BunnyPad className={art} />
      </span>
      {showName && (
        <span className={cn("font-[family-name:var(--font-display)] font-bold tracking-wide", text)}>
          AQTech <span className="text-primary">GHub</span>
        </span>
      )}
    </span>
  );
}
