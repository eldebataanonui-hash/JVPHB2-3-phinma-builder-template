// Only allow paths on this site, so a crafted link can't send people to
// another website after they log in or confirm their email. Instead of
// checking how the text starts (tricks like "/\t/evil.com" slip past
// that), resolve it the same way a browser would and keep it only if it
// stays here.
export function safeNextPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  try {
    const base = "https://this-site.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
