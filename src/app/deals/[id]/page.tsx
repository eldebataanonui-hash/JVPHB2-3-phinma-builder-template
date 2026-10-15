import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyLink } from "@/components/copy-link";
import { RedFlags } from "@/components/red-flags";
import { TraderRecord } from "@/components/trader-record";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  EVENT_LABELS,
  LOCK_IN_BUYER,
  LOCK_IN_SELLER,
  STAGES,
  STEP_ACTIONS,
  STEP_LABELS,
  formatManilaTime,
  PAYMENT_METHODS,
  formatPesos,
  paymentLabel,
  splitPrice,
} from "@/lib/deals";
import {
  advanceDeal,
  choosePaymentMethod,
  joinDeal,
  reportConcern,
  sendMessage,
} from "@/app/deals/actions";

export default async function DealRoomPage(props: PageProps<"/deals/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const error = errorText(params.error);
  const concern_error = errorText(params.concern_error);
  const chat_error = errorText(params.chat_error);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/deals/${id}`);

  // RLS only returns the deal if you are its seller or buyer.
  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, description, price, step, seller_id, buyer_id, ownership_code, payment_method, join_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!deal) return <DealPreview id={id} error={error} />;

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

  const { first, second } = splitPrice(deal.price);
  const action = STEP_ACTIONS[deal.step];
  const myTurn = Boolean(action) && (action.actor === "seller") === isSeller;
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
            <CopyLink url={deal.join_code} large />
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">
                Sharing outside AQTech GHub? Use the link instead
              </summary>
              <div className="mt-2">
                <CopyLink url={dealUrl} />
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
                <PaymentPicker dealId={deal.id} current={deal.payment_method} />
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
                    disabled={deal.step === "awaiting_first_payment" && !deal.payment_method}
                  >
                    {action.button}
                  </Button>
                </form>
              )}
              {!myTurn && deal.step !== "completed" && (
                <p className="text-xs text-muted-foreground">
                  Refresh this page to see when {otherName} is done.
                </p>
              )}
            </CardContent>
          </Card>

          <Card id="chat">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Messages stay on the record and can&apos;t be deleted. Links
                are blocked. Refresh to see new messages.
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
                  Never send your password or a GCash/bank code. The only code
                  ever shared is the Moonton binding code, at the Lock-In step.
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

// What a trader who isn't in the deal sees: a safe preview and a Join
// button. The preview function never returns the ownership code.
async function DealPreview({ id, error }: { id: string; error: string | null }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("deal_preview", { p_deal_id: id });
  const preview = data?.[0];
  if (!preview) notFound();

  // Once a buyer joins, the deal is private: no title, price or seller.
  if (preview.has_buyer || !preview.title || !preview.seller_id) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>This deal already has a buyer</CardTitle>
            <CardDescription>
              Deal Rooms are private once a buyer joins.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardDescription>Deal Room preview</CardDescription>
          <CardTitle className="text-2xl">{preview.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xl font-semibold">{formatPesos(preview.price)}</p>
          {preview.description && (
            <p className="whitespace-pre-wrap text-sm">{preview.description}</p>
          )}
          <p className="text-sm">
            <span className="text-muted-foreground">Seller: </span>
            <Link href={`/profile/${preview.seller_id}`} className="underline">
              {preview.seller_name}
            </Link>
          </p>
          <div className="flex gap-1 text-sm">
            <span className="text-muted-foreground">Seller&apos;s record:</span>
            <TraderRecord traderId={preview.seller_id} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <form action={joinDeal}>
            <input type="hidden" name="deal_id" value={preview.id} />
            <Button type="submit">Join as buyer</Button>
          </form>
        </CardContent>
      </Card>

      <RedFlags />
    </main>
  );
}

// The instructions for the current step, worded for whoever is looking.
function StepDetails({
  step,
  isSeller,
  code,
  first,
  second,
  method,
}: {
  step: string;
  isSeller: boolean;
  code: string;
  first: number;
  second: number;
  method: string | null;
}) {
  const app = method ?? "your e-wallet or bank";
  const codeBox = (
    <p className="w-fit rounded-[var(--radius)] border border-border px-4 py-2 font-mono text-2xl font-semibold tracking-widest">
      {code}
    </p>
  );

  switch (step) {
    case "awaiting_code":
      return isSeller ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>Put this code in the account&apos;s MLBB in-game name or profile signature:</p>
          {codeBox}
          <p className="text-muted-foreground">
            This proves you control the account right now. Screenshots and
            videos can&apos;t do that.
          </p>
        </div>
      ) : (
        <p className="text-sm">The seller is putting a code in the account&apos;s in-game name.</p>
      );
    case "code_placed":
      return isSeller ? (
        <p className="text-sm">The buyer is checking the code in the game.</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <p>Look up the account in MLBB. Its in-game name or signature should show exactly:</p>
          {codeBox}
          <p className="font-medium text-destructive">
            If it doesn&apos;t match, don&apos;t pay. Don&apos;t accept screenshots instead.
          </p>
        </div>
      );
    case "awaiting_first_payment":
      return isSeller ? (
        <p className="text-sm">
          The buyer sends the first half:{" "}
          <span className="font-semibold">{formatPesos(first)}</span>
          {method ? (
            <>
              {" "}by <span className="font-semibold">{method}</span>.
            </>
          ) : (
            ". They're choosing how to pay."
          )}{" "}
          Share your account number in the chat below.
        </p>
      ) : (
        <p className="text-sm">
          Choose how you&apos;ll pay, then send the first half:{" "}
          <span className="font-semibold">{formatPesos(first)}</span>. Never
          send the full price now. Ask the seller for their account number in
          the chat below.
        </p>
      );
    case "first_payment_sent":
      return (
        <p className="text-sm">
          {isSeller
            ? `Open ${app} and check that `
            : `The seller is checking ${app} for `}
          <span className="font-semibold">{formatPesos(first)}</span>
          {isSeller ? " arrived." : "."}
          {isSeller && " Don't trust a screenshot of a receipt."}
        </p>
      );
    case "awaiting_lock_in":
    case "lock_in_done":
      return (
        <div className="flex flex-col gap-3 text-sm">
          <Checklist
            title="Seller does"
            items={LOCK_IN_SELLER}
            active={isSeller && step === "awaiting_lock_in"}
          />
          <Checklist
            title="Buyer does"
            items={LOCK_IN_BUYER}
            active={!isSeller && step === "lock_in_done"}
          />
          {!isSeller && step === "lock_in_done" && (
            <p className="font-medium">
              Only confirm once every step is done and nothing on the account
              belongs to the seller.
            </p>
          )}
        </div>
      );
    case "awaiting_second_payment":
      return (
        <p className="text-sm">
          {isSeller ? "The buyer sends" : "Send"} the second half:{" "}
          <span className="font-semibold">{formatPesos(second)}</span> by{" "}
          {app}.
        </p>
      );
    case "second_payment_sent":
      return (
        <p className="text-sm">
          {isSeller
            ? `Open ${app} and check that `
            : `The seller is checking ${app} for `}
          <span className="font-semibold">{formatPesos(second)}</span>
          {isSeller ? " arrived." : "."}
        </p>
      );
    case "completed":
      return (
        <p className="text-sm">
          The account has been handed over and both halves were confirmed.
        </p>
      );
    default:
      return null;
  }
}

function Checklist({
  title,
  items,
  active,
}: {
  title: string;
  items: string[];
  active: boolean;
}) {
  return (
    <div className={active ? "" : "text-muted-foreground"}>
      <p className="font-medium">{title}:</p>
      <ol className="ml-5 list-decimal">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

// The buyer picks how they'll pay. AQTech GHub never moves the money;
// this tells the seller which app to check, and goes in the record.
function PaymentPicker({ dealId, current }: { dealId: string; current: string | null }) {
  return (
    <form action={choosePaymentMethod} className="flex flex-col gap-3">
      <input type="hidden" name="deal_id" value={dealId} />
      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium">How will you pay?</legend>
        {PAYMENT_METHODS.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/15"
          >
            <input
              type="radio"
              name="method"
              value={m.id}
              defaultChecked={current === m.id}
              required
              className="accent-[var(--primary)]"
            />
            {m.label}
          </label>
        ))}
      </fieldset>
      <Button type="submit" variant="outline" className="w-fit">
        {current ? "Change payment method" : "Use this payment method"}
      </Button>
    </form>
  );
}
