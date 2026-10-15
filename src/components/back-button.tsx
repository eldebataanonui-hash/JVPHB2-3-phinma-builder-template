"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Goes back to the page you came from. If there is no previous page
// (say, a Deal Room opened straight from a Messenger link), goes Home.
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={goBack} aria-label="Back" className="px-2">
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden lg:inline">Back</span>
    </Button>
  );
}
