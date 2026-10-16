// Error messages shown on the page. Pages receive only a short code in
// the URL (e.g. ?error=not_your_turn) and look up the text here. That
// way nobody can craft a link that shows their own words, like a fake
// "verification fee" notice, in red on our site.
const ERROR_TEXT: Record<string, string> = {
  // Sign up and log in
  name_length: "Display name must be 1 to 40 characters.",
  name_reserved:
    "Please choose another display name. Names can't include \"AQTech\" or \"GHub\", can't be just \"Admin\", \"Support\" or similar, and need at least one letter or number.",
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed: "Please confirm your email first. Check your inbox for the link.",
  user_already_exists: "An account with this email already exists. Try logging in.",
  weak_password: "Please choose a stronger password (at least 6 characters).",
  email_address_invalid: "That email address doesn't look right.",
  over_email_send_rate_limit: "Too many emails sent. Please wait an hour and try again.",
  link_invalid: "That confirmation link has expired or was already used. Try logging in.",
  // Deals
  title_length: "Title must be 1 to 80 characters.",
  price_invalid: "Price must be a whole number of pesos.",
  deal_link: "Links aren't allowed in the title or description.",
  join_failed: "This deal can't be joined. It may already have a buyer, or it's your own deal.",
  not_your_turn: "It's not your turn.",
  step_already_done: "This step was already done. Refresh the page.",
  choose_payment_first: "Choose how you'll pay first.",
  credentials_first: "Send the account login details to the buyer first.",
  credentials_invalid: "Please fill in the login and password (up to 200 characters each, note up to 500).",
  // Reviews
  review_invalid: "Please pick 1 to 5 stars. Comments can be up to 300 characters.",
  review_link: "Links aren't allowed in reviews.",
  review_done: "You already reviewed this deal.",
  review_closed: "The review window has closed. Reviews are open for 7 days after a deal completes.",
  // Concerns and chat
  concern_length: "Please describe what happened in 10 to 2000 characters.",
  chat_length: "Messages must be 1 to 1000 characters.",
  chat_link: "Links aren't allowed in chat. They're how phishing scams work.",
  // Profile description
  bio_length: "Your description can be up to 500 characters.",
  bio_link: "Links aren't allowed in your description.",
  kyc_not_set_up: "ID verification isn't switched on yet. Your team needs to add the Didit keys.",
  social_invalid:
    "Please enter just your username for each site (letters, numbers, dots, dashes and underscores), not a full web address.",
};

const FALLBACK = "Something went wrong. Please try again.";

// Turn a code from the URL into safe text. Unknown codes get a generic
// message, never the raw text from the URL.
export function errorText(code: string | string[] | undefined): string | null {
  if (typeof code !== "string" || code === "") return null;
  return ERROR_TEXT[code] ?? FALLBACK;
}

// Pick a code for a Supabase Auth error, falling back to a generic one.
export function authErrorCode(code: string | undefined, fallback: string): string {
  return code && code in ERROR_TEXT ? code : fallback;
}
