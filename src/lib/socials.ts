// Social media on profiles. Traders give USERNAMES; we build each link
// to the real site ourselves, so a profile link can never lead to a
// phishing page. Discord has no public profile links, so it's text only.
// The column names match supabase/sql/023-social-links.sql (YouTube was
// dropped from the list later; its column is simply unused).
export const SOCIALS = [
  {
    key: "social_facebook",
    label: "Facebook",
    // Number-only ids (from facebook.com/profile.php?id=…) need Facebook's
    // own format; usernames work as facebook.com/<username>.
    url: (u: string) =>
      /^[0-9]+$/.test(u)
        ? `https://www.facebook.com/profile.php?id=${u}`
        : `https://www.facebook.com/${u}`,
  },
  { key: "social_tiktok", label: "TikTok", url: (u: string) => `https://www.tiktok.com/@${u}` },
  { key: "social_instagram", label: "Instagram", url: (u: string) => `https://www.instagram.com/${u}` },
  { key: "social_x", label: "X (Twitter)", url: (u: string) => `https://x.com/${u}` },
  { key: "social_discord", label: "Discord", url: null },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];

const USERNAME = /^[A-Za-z0-9._-]{1,50}$/;

// Turn whatever the trader typed into a plain username, or null if it's
// empty. "@desay", "facebook.com/desay" and "https://www.facebook.com/desay/"
// all become "desay"; "facebook.com/profile.php?id=123" becomes "123".
// Returns false if it still isn't a valid username.
export function cleanUsername(raw: string): string | null | false {
  const value = raw.trim();
  if (!value) return null;

  const id = value.match(/[?&]id=([0-9]+)/);
  if (id) return id[1];

  let name = value;
  if (name.includes("/")) {
    const parts = name.split(/[?#]/)[0].split("/").filter(Boolean);
    name = parts[parts.length - 1] ?? "";
  }
  name = name.replace(/^@/, "");
  return USERNAME.test(name) ? name : false;
}
