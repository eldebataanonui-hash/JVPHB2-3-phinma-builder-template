// Display names can't impersonate the AQTech GHub team, and must contain
// at least one letter or digit (no blank-looking invisible names). This
// mirrors public.is_reserved_display_name in supabase/sql/020, which is
// the real protection; this copy gives a friendly message at sign-up.
//
// Names containing "aqtech" or "ghub" are blocked. Words like admin or
// support are only blocked when they ARE the whole name, so normal
// player names like "SupportMain" or "Badminton King" are fine.
const BRAND = /(aqtech|ghub)/i;
const RESERVED_WHOLE = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "support",
  "official",
  "staff",
  "team",
  "helpdesk",
]);

export function isAllowedDisplayName(name: string): boolean {
  if (!/[\p{L}\p{N}]/u.test(name)) return false;
  if (BRAND.test(name)) return false;
  const squashed = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return !RESERVED_WHOLE.has(squashed);
}
