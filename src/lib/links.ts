// The "no links" rule for anything traders write that others read
// (Deal Room chat, direct messages, profile descriptions). It mirrors
// the database checks in supabase/sql/012 and 013, which are the real
// protection; this copy just gives a friendly message first.
//
// Email addresses are removed before checking: the Lock-In step needs
// the buyer to send theirs, and "gmail.com" would otherwise look like a
// link.
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const LINK_PATTERN =
  /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|ph|io|co|me|ly|gg|xyz|app|link|site|info|top|shop|ru|to|tk|gd|at|cc|us|uk|in|biz|online|store|live|click)\b)/i;

export function containsLink(text: string): boolean {
  return LINK_PATTERN.test(text.replace(EMAIL_PATTERN, ""));
}
