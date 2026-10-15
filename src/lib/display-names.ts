// Display names can't impersonate the AQTech GHub team, and must contain
// at least one letter or digit (no blank-looking invisible names). This
// mirrors the database check in supabase/sql/014, which is the real
// protection; this copy gives a friendly message at sign-up.
const RESERVED = /(aqtech|ghub|admin|moderator|support|official|staff)/i;

export function isAllowedDisplayName(name: string): boolean {
  return /[\p{L}\p{N}]/u.test(name) && !RESERVED.test(name);
}
