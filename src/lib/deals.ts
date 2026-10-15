// Plain-English labels for each deal step. The step names match the
// check constraint in supabase/sql/006-create-deals.sql.
export const STEP_LABELS: Record<string, string> = {
  waiting_for_buyer: "Waiting for a buyer",
  awaiting_code: "Seller to place the ownership code",
  code_placed: "Buyer to confirm the code",
  awaiting_first_payment: "Buyer to send the first half",
  first_payment_sent: "Seller to confirm the first half",
  awaiting_lock_in: "Seller to complete the Lock-In Checklist",
  lock_in_done: "Buyer to confirm full control",
  awaiting_second_payment: "Buyer to send the second half",
  second_payment_sent: "Seller to confirm the second half",
  completed: "Completed",
};

export function formatPesos(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}
