import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The AQTech GHub logo: a gamepad badge plus the name. Used in the top
// bar, the sidebar's About us link and the About page, so it always
// looks the same.
export function Logo({
  size = "md",
  showName = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const badge = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-16 w-16" }[size];
  const icon = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-9 w-9" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-4xl" }[size];

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          badge,
        )}
      >
        <Gamepad2 className={icon} />
      </span>
      {showName && (
        <span className={cn("font-[family-name:var(--font-display)] font-bold tracking-wide", text)}>
          AQTech <span className="text-primary">GHub</span>
        </span>
      )}
    </span>
  );
}
