import { LOCK_IN_BUYER, LOCK_IN_SELLER, formatPesos } from "@/lib/deals";

// The instructions for the current step, worded for whoever is looking.
export function StepDetails({
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
          Your saved payment account shows to the buyer here, so don&apos;t
          send numbers in chat.
        </p>
      ) : (
        <p className="text-sm">
          Choose how you&apos;ll pay, then send the first half:{" "}
          <span className="font-semibold">{formatPesos(first)}</span>. Never
          send the full price now. The seller&apos;s saved account shows below;
          only pay to the account shown here, never a number sent in chat.
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
