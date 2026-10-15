"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Shows a value (a deal code or a link) with a Copy button, so the
// seller can paste it to the buyer.
export function CopyField({ value, large = false }: { value: string; large?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className={large ? "h-12 font-mono text-lg font-semibold tracking-widest" : undefined}
      />
      <Button type="button" variant="outline" onClick={copy} className={large ? "h-12" : undefined}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
