// How each kind of notification reads, and where tapping it goes. The
// kinds match the triggers in supabase/sql/019-notifications.sql.
const TEXT: Record<string, (who: string, deal: string, method: string | null) => string> = {
  buyer_joined: (who, deal) => `${who} joined your deal "${deal}". Place the ownership code next.`,
  payment_method_chosen: (who, deal, method) =>
    `${who} will pay for "${deal}" with ${method ?? "an e-wallet"}.`,
  code_placed: (who, deal) => `${who} placed the ownership code for "${deal}". Check it in the game.`,
  code_confirmed: (who, deal) => `${who} confirmed the ownership code for "${deal}".`,
  first_half_sent: (who, deal, method) =>
    `${who} sent the first half for "${deal}". Check ${method ?? "your app"}.`,
  first_half_received: (who, deal) => `${who} confirmed the first half arrived for "${deal}". Lock-In is next.`,
  lock_in_done: (who, deal) => `${who} finished the Lock-In steps for "${deal}". Check you have full control.`,
  full_control_confirmed: (who, deal) => `${who} confirmed full control of "${deal}". The second half is next.`,
  second_half_sent: (who, deal, method) =>
    `${who} sent the second half for "${deal}". Check ${method ?? "your app"}.`,
  second_half_received: (_who, deal) => `Deal completed: "${deal}". 🎉`,
  deal_message: (who, deal) => `${who} sent a message in "${deal}".`,
  direct_message: (who) => `${who} sent you a message.`,
};

export function notificationText(kind: string, who: string, deal: string, method: string | null = null) {
  return (TEXT[kind] ?? ((w) => `${w} updated a deal.`))(who, deal, method);
}

export function notificationHref(n: { kind: string; deal_id: string | null; actor_id: string }) {
  if (n.kind === "direct_message") return `/messages/${n.actor_id}`;
  if (n.kind === "deal_message") return `/deals/${n.deal_id}#chat`;
  return `/deals/${n.deal_id}`;
}
