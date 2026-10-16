// Payment accounts: the e-wallet or bank accounts a trader is paid to
// (or pays from). The rules match supabase/sql/032-payment-accounts.sql.

import { PAYMENT_METHODS, paymentLabel } from "@/lib/deals";

export const MAX_PAYMENT_ACCOUNTS = 10;

export type PaymentAccount = {
  method: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

export function isPaymentMethod(id: string) {
  return PAYMENT_METHODS.some((m) => m.id === id);
}

// Digits, spaces, + and - only, with at least 4 digits. Extra spaces are
// squeezed so "0917  123 4567" and "0917 123 4567" are the same.
export function cleanAccountNumber(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!/^[0-9 +-]{4,40}$/.test(value)) return null;
  if (value.replace(/[^0-9]/g, "").length < 4) return null;
  return value;
}

// "GCash", or "InstaPay (any bank) · BDO".
export function accountMethodLabel(a: Pick<PaymentAccount, "method" | "bank_name">) {
  const label = paymentLabel(a.method) ?? a.method;
  return a.bank_name ? `${label} · ${a.bank_name}` : label;
}
