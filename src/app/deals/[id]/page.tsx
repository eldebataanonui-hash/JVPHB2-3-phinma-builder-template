import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyField } from "@/components/copy-field";
import { CredentialsForm } from "@/components/deal-room/credentials-form";
import { CredentialsReveal } from "@/components/deal-room/credentials-reveal";
import { DealPhotos } from "@/components/deal-room/deal-photos";
import { DealPreview } from "@/components/deal-room/deal-preview";
import { DealReviews } from "@/components/deal-room/deal-reviews";
import { PaymentDestination } from "@/components/deal-room/payment-destination";
import { PaymentPicker } from "@/components/deal-room/payment-picker";
import { StepDetails } from "@/components/deal-room/step-details";
import { TradeReceipt } from "@/components/deal-room/trade-receipt";
import { RedFlags } from "@/components/red-flags";
import { RefreshButton } from "@/components/refresh-button";
import { TraderRecord } from "@/components/trader-record";
import {
  EVENT_LABELS,
  STAGES,
  STEP_ACTIONS,
  STEP_LABELS,
  formatManilaTime,
  formatPesos,
  paymentLabel,
  splitPrice,
} from "@/lib/deals";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { advanceDeal, reportConcern, sendMessage } from "@/app/deals/actions";

// The Deal Room. The preview (for traders not in the deal), the step
// instructions and the payment picker live in src/components/deal-room/.
export default async function DealRoomPage(props: PageProps<"/deals/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const error = errorText(params.error);
  const concern_error = errorText(params.concern_error);
  const cred_error = errorText(params.cred_error);
  const chat_error = errorText(params.chat_error);
  const review_error = errorText(params.review_error);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/deals/${id}`);

  // RLS only returns the deal if you are its seller or buyer.
  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, description, price, step, seller_id, buyer_id, ownership_code, payment_method, join_code, created_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (!deal) return <DealPreview id={id} error={error} />;

  // Opening the Deal Room counts as reading its notifications.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("deal_id", deal.id)
    .is("read_at", null);

  const isSeller = user.id === deal.seller_id;
  const ids = [deal.seller_id, deal.buyer_id].filter((x): x is string => Boolean(x));
  const { data: people } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  const nameOf = (pid: string | null) =>
    people?.find((p) => p.id === pid)?.display_name ?? "—";

  // The timestamped record. RLS only shows it to the seller and buyer.
  const { data: events } = await supabase
    .from("deal_events")
    .select("id, actor_id, action, created_at")
    .eq("deal_id", deal.id)
    .order("id");

  // The Deal Room chat. RLS only shows it to the seller and buyer.
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("deal_id", deal.id)
    .order("id");

  // Concerns you filed about this deal. RLS only shows your own.
  const { data: concerns } = await supabase
    .from("concerns")
    .select("id, message, status, created_at")
    .eq("deal_id", deal.id)
    .order("id");

  // The other trader's payment accounts. Only returned to the deal's
  // seller and buyer, and only while the deal is in progress (032).
  const { data: otherAccounts } = deal.buyer_id
    ? await supabase.rpc("deal_payment_accounts", { p_deal_id: deal.id })
    : { data: [] };

  const { first, second } = splitPrice(deal.price);
  const payingFirst = ["awaiting_first_payment", "first_payment_sent"].includes(deal.step);
  const payingSecond = ["awaiting_second_payment", "second_payment_sent"].includes(deal.step);
  const action = STEP_ACTIONS[deal.step];
  const myTurn = Boolean(action) && (action.actor === "seller") === isSeller;
  // Login details are sent at the handover step and readable by the
  // buyer until the deal completes (then they're deleted).
  const credentialsSent = (events ?? []).some((e) => e.action === "credentials_sent");
  const credentialSteps = ["awaiting_lock_in", "lock_in_done", "awaiting_second_payment", "second_payment_sent"];
  const otherName = nameOf(isSeller ? deal.buyer_id : deal.seller_id);
  const stageIndex = STAGES.findIndex((s) => s.steps.includes(deal.step));

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const dealUrl = `${proto}://${h.get("host")}/deals/${deal.id}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardDescription>Deal Room · {STEP_LABELS[deal.step]}</CardDescription>
          <CardTitle className="text-2xl">{deal.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xl font-semibold">{formatPesos(deal.price)}</p>
          {deal.description && (
            <p className="whitespace-pre-wrap text-sm">{deal.description}</p>
          )}
          <DealPhotos dealId={deal.id} isSeller={isSeller} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Seller</dt>
            <dd>
              <Link href={`/profile/${deal.seller_id}`} className="underline">
                {nameOf(deal.seller_id)}
              </Link>
            </dd>
            <dt className="text-muted-foreground">Seller&apos;s record</dt>
            <dd>
              <TraderRecord traderId={deal.seller_id} />
            </dd>
            <dt className="text-muted-foreground">Buyer</dt>
            <dd>
              {deal.buyer_id ? (
                <Link href={`/profile/${deal.buyer_id}`} className="underline">
                  {nameOf(deal.buyer_id)}
                </Link>
              ) : (
                "Not joined yet"
              )}
            </dd>
            {deal.buyer_id && (
              <>
                <dt className="text-muted-foreground">Buyer&apos;s record</dt>
                <dd>
                  <TraderRecord traderId={deal.buyer_id} />
                </dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {isSeller && !deal.buyer_id && (
        <Card>
          <CardHeader>
            <CardTitle>Send this code to your buyer</CardTitle>
            <CardDescription>
              Paste it in Messages. Your buyer enters it on Join a deal, then
              taps Join as buyer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CopyField value={deal.join_code} large />
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">
                Sharing outside AQTech GHub? Use the link instead
              </summary>
              <div className="mt-2">
                <CopyField value={dealUrl} />
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {deal.buyer_id && (
        <>
          <ol className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
            {STAGES.map((stage, i) => (
              <li
                key={stage.label}
                className={`rounded-[var(--radius)] border p-2 text-center ${
                  i === stageIndex
                    ? "border-primary font-semibold"
                    : i < stageIndex
                      ? "border-border text-muted-foreground"
                      : "border-border text-muted-foreground opacity-50"
                }`}
              >
                {i < stageIndex ? "✓ " : ""}
                {stage.label}
              </li>
            ))}
          </ol>

          <Card className={myTurn ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle>
                {deal.step === "completed"
                  ? "Deal completed"
                  : myTurn
                    ? "Your turn"
                    : `Waiting for ${otherName}`}
              </CardTitle>
              <CardDescription>{STEP_LABELS[deal.step]}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StepDetails
                step={deal.step}
                isSeller={isSeller}
                code={deal.ownership_code}
                first={first}
                second={second}
                method={paymentLabel(deal.payment_method)}
              />
              {!isSeller && deal.step === "awaiting_first_payment" && (
                <PaymentPicker
                  dealId={deal.id}
                  current={deal.payment_method}
                  accepted={(otherAccounts ?? []).map((a: { method: string }) => a.method)}
                />
              )}
              {(payingFirst || payingSecond) && (
                <PaymentDestination
                  isSeller={isSeller}
                  method={deal.payment_method}
                  amount={payingFirst ? first : second}
                  otherName={otherName}
                  accounts={otherAccounts ?? []}
                />
              )}
              {isSeller && deal.step === "awaiting_lock_in" && (
                <CredentialsForm dealId={deal.id} sent={credentialsSent} error={cred_error} />
              )}
              {!isSeller && credentialSteps.includes(deal.step) && credentialsSent && (
                <CredentialsReveal dealId={deal.id} />
              )}
              {!isSeller && deal.step === "awaiting_lock_in" && !credentialsSent && (
                <p className="text-sm text-muted-foreground">
                  Waiting for the seller to send the account login details.
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {myTurn && (
                <form action={advanceDeal}>
                  <input type="hidden" name="deal_id" value={deal.id} />
                  <input type="hidden" name="from_step" value={deal.step} />
                  {/* The buyer must choose how they'll pay before the first
                      half. The database enforces this too. */}
                  <Button
                    type="submit"
                    disabled={
                      (deal.step === "awaiting_first_payment" && !deal.payment_method) ||
                      (deal.step === "awaiting_lock_in" && !credentialsSent)
                    }
                  >
                    {action.button}
                  </Button>
                </form>
              )}
              {!myTurn && deal.step !== "completed" && (
                <p className="text-xs text-muted-foreground">
                  This page updates by itself when {otherName} is done, and
                  you&apos;ll get a notification.
                </p>
              )}
            </CardContent>
          </Card>

          {deal.step === "completed" && (
            <TradeReceipt
              joinCode={deal.join_code}
              title={deal.title}
              price={deal.price}
              first={first}
              second={second}
              method={paymentLabel(deal.payment_method)}
              sellerName={nameOf(deal.seller_id)}
              buyerName={nameOf(deal.buyer_id)}
              completedAt={deal.completed_at}
              events={events ?? []}
              credentialsSent={credentialsSent}
              names={Object.fromEntries((people ?? []).map((p) => [p.id, p.display_name]))}
            />
          )}

          {deal.step === "completed" && (
            <DealReviews
              dealId={deal.id}
              myId={user.id}
              isSeller={isSeller}
              otherName={otherName}
              completedAt={deal.completed_at}
              names={Object.fromEntries((people ?? []).map((p) => [p.id, p.display_name]))}
              error={review_error}
            />
          )}

          <Card id="chat">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Messages stay on the record and can&apos;t be deleted. Links
                are blocked. New messages appear by themselves.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {messages && messages.length > 0 ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`max-w-[85%] rounded-[var(--radius)] border border-border p-2 ${
                        m.sender_id === user.id ? "self-end bg-secondary" : "self-start"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">
                        {nameOf(m.sender_id)} · {formatManilaTime(m.created_at)}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              )}
              <form action={sendMessage} className="flex flex-col gap-2">
                <input type="hidden" name="deal_id" value={deal.id} />
                <Textarea name="body" required maxLength={1000} rows={2} placeholder="Message" aria-label="Message" />
                <p className="text-xs text-destructive">
                  Never send a password or a GCash/bank code in chat. The sold
                  account&apos;s login goes in the encrypted login box at the
                  handover step. The only security code shared in chat is the
                  Moonton binding code, at the Lock-In step.
                </p>
                {chat_error && <p className="text-sm text-destructive">{chat_error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" className="w-fit">Send</Button>
                  <RefreshButton />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
              <CardDescription>
                Every confirmation, with who and when. Nobody can edit or
                delete it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <span className="text-muted-foreground">
                    {formatManilaTime(deal.created_at)} ·{" "}
                  </span>
                  {nameOf(deal.seller_id)} created the Deal Room
                </li>
                {events?.map((event) => (
                  <li key={event.id}>
                    <span className="text-muted-foreground">
                      {formatManilaTime(event.created_at)} ·{" "}
                    </span>
                    {nameOf(event.actor_id)} {EVENT_LABELS[event.action]}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <Card id="concern">
        <CardHeader>
          <CardTitle>Report a concern</CardTitle>
          <CardDescription>
            Something wrong? Our team reviews it with this deal&apos;s record
            and responds within 48 hours. See the{" "}
            <Link href="/rules" className="underline">
              Trading Rules
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {concerns && concerns.length > 0 && (
            <ul className="flex flex-col gap-2 text-sm">
              {concerns.map((c) => (
                <li key={c.id} className="rounded-[var(--radius)] border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {formatManilaTime(c.created_at)} ·{" "}
                    {c.status === "resolved" ? "Resolved" : "Sent to our team"}
                  </p>
                  <p className="whitespace-pre-wrap">{c.message}</p>
                </li>
              ))}
            </ul>
          )}
          <form action={reportConcern} className="flex flex-col gap-2">
            <input type="hidden" name="deal_id" value={deal.id} />
            <Label htmlFor="message">What happened?</Label>
            <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={3} />
            {concern_error && (
              <p className="text-sm text-destructive">{concern_error}</p>
            )}
            <Button type="submit" variant="outline" className="w-fit">
              Send to our team
            </Button>
          </form>
        </CardContent>
      </Card>

      <RedFlags />
    </main>
  );
}
