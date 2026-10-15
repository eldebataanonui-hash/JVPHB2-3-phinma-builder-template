"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Shows a link with a Copy button, so the seller can paste it to the
// buyer in Messenger.
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
