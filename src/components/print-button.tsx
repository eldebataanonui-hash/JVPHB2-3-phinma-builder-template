"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Opens the browser's print window, where "Save as PDF" is also an
// option. The print styles in globals.css print only the receipt.
export function PrintButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  );
}
