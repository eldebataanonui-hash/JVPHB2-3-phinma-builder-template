// Social media on profiles. Traders give USERNAMES; we build each link
// to the real site ourselves, so a profile link can never lead to a
// phishing page. Discord has no public profile links, so it's text only.
// The column names match supabase/sql/023-social-links.sql.
export const SOCIALS = [
  { key: "social_facebook", label: "Facebook", url: (u: string) => `https://www.facebook.com/${u}` },
  { key: "social_instagram", label: "Instagram", url: (u: string) => `https://www.instagram.com/${u}` },
  { key: "social_tiktok", label: "TikTok", url: (u: string) => `https://www.tiktok.com/@${u}` },
  { key: "social_x", label: "X (Twitter)", url: (u: string) => `https://x.com/${u}` },
  { key: "social_youtube", label: "YouTube", url: (u: string) => `https://www.youtube.com/@${u}` },
  { key: "social_discord", label: "Discord", url: null },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];

const USERNAME = /^[A-Za-z0-9._-]{1,50}$/;

// Turn whatever the trader typed into a plain username, or null if it's
// empty. "@desay", "facebook.com/desay" and "https://www.facebook.com/desay/"
// all become "desay". Returns false if it still isn't a valid username.
export function cleanUsername(raw: string): string | null | false {
  let value = raw.trim();
  if (!value) return null;
  if (value.includes("/")) {
    const parts = value.split(/[/?#]/).filter(Boolean);
    value = parts[parts.length - 1] ?? "";
    // facebook.com/profile.php?id=123 -> keep the number after id=
    const id = raw.match(/[?&]id=([0-9]+)/);
    if (id) value = id[1];
  }
  value = value.replace(/^@/, "");
  return USERNAME.test(value) ? value : false;
}
