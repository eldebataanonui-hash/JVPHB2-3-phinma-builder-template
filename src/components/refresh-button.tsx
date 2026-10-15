"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Re-fetches the page's data from the server (new messages, the other
// trader's latest step) without a full page reload.
export function RefreshButton() {
  const router = useRouter();
  return (
    <Button type="button" variant="outline" onClick={() => router.refresh()}>
      Refresh
    </Button>
  );
}
