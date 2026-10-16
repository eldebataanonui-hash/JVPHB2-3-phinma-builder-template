import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { EVENT_LABELS, formatManilaTime, formatPesos } from "@/lib/deals";

type ReceiptEvent = { id: number; actor_id: string; action: string; created_at: string };

// The trade receipt, shown once a deal is completed. Proof for both
// traders that the trade happened: what, how much, how it was paid, who,
// and the time of every step. Print or save it as a PDF.
export function TradeReceipt({
  joinCode,
  title,
  price,
  first,
  second,
  method,
  sellerName,
  buyerName,
  completedAt,
  events,
  names,
  credentialsSent,
}: {
  joinCode: string;
  title: string;
  price: number;
  first: number;
  second: number;
  method: string | null;
  sellerName: string;
  buyerName: string;
  completedAt: string | null;
  events: ReceiptEvent[];
  names: Record<string, string>;
  credentialsSent: boolean;
}) {
  const rows = [
    { label: "Receipt no.", value: joinCode },
    { label: "Account", value: title },
    { label: "Price", value: formatPesos(price) },
    { label: "Paid as", value: `${formatPesos(first)} + ${formatPesos(second)}` },
    { label: "Payment method", value: method ?? "Not recorded" },
    { label: "Seller", value: sellerName },
    { label: "Buyer", value: buyerName },
    { label: "Completed", value: completedAt ? formatManilaTime(completedAt) : "—" },
    ...(credentialsSent
      ? [{ label: "Login details", value: "Sent encrypted, deleted when the deal completed" }]
      : []),
  ];

  return (
    <Card id="receipt" className="border-emerald-500/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Trade receipt
          </CardTitle>
          <CardDescription>
            Proof that this trade was completed on AQTech GHub. Keep a copy.
          </CardDescription>
        </div>
        <PrintButton />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="min-w-0 break-words font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Every step</p>
          <ol className="flex flex-col gap-1 text-sm">
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-muted-foreground">{formatManilaTime(e.created_at)} · </span>
                {names[e.actor_id] ?? "A trader"} {EVENT_LABELS[e.action]}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">
          AQTech GHub never held the money: payments were sent directly between
          the traders and confirmed by each of them in this Deal Room.
        </p>
      </CardContent>
    </Card>
  );
}
