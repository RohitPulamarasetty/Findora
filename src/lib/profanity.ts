/**
 * Lightweight content moderation used at item-create time.
 *
 * Design notes:
 *  - In-process, zero dependencies, runs in the Node/Edge runtime.
 *  - Tuned for a campus lost-and-found feed: titles/descriptions/locations
 *    legitimately have no URLs, no caps spam, no slurs. False-positive cost
 *    is low; abuse cost is high (one screenshot kills launch).
 *  - Backwards-compatible API: the existing call sites
 *    (`containsProfanity(...)` in /api/items) still work.
 *
 * Coverage:
 *   1. Profanity word list (leet/obfuscation-normalized).
 *   2. URL / link-spam patterns (http(s), bare domains, common shorteners,
 *      messaging-app deep links, phone-number-shaped strings).
 *   3. Character spam (>=6 repeated identical chars).
 *   4. Word spam (same word repeated >=5 times back-to-back).
 */

const PROFANITY = new Set<string>([
  // Conservative English baseline. Intentionally short; expand as real
  // abuse appears in moderation logs — broad lists cause false positives
  // (the well-known "Scunthorpe problem").
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "dick",
  "pussy",
  "slut",
  "whore",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "rape",
  "rapist",
  // India-context additions
  "chutiya",
  "chutia",
  "bhosdi",
  "bhosdike",
  "madarchod",
  "behenchod",
  "bhenchod",
  "randi",
  "gaand",
  "lund",
  "lawda",
]);

// Catches: http(s)://, www.x.y, bare common-TLD domains, shortener / messaging
// deep links, and >=10-digit phone-shaped strings.
const URL_LIKE = new RegExp(
  [
    "https?://",
    "www\\.[a-z0-9-]+\\.[a-z]{2,}",
    "\\b[a-z0-9-]+\\.(?:com|net|org|io|in|co|me|app|xyz|biz|info|live|site|link|click)\\b",
    "\\bt\\.me/",
    "\\bbit\\.ly/",
    "\\btinyurl\\.com/",
    "\\bwa\\.me/",
    "\\bdiscord\\.gg/",
    "\\btelegram\\.me/",
    "\\b\\+?\\d[\\d\\s()-]{8,}\\d",
  ].join("|"),
  "i"
);

const REPEATED_CHAR = /(.)\1{5,}/; // 6+ identical chars in a row
const REPEATED_WORD = /\b(\w{2,})(?:\s+\1\b){4,}/i; // same word 5x in a row

/**
 * Normalize text for profanity matching:
 *   - lowercase
 *   - NFKD + strip combining marks (diacritics)
 *   - de-leet common substitutions
 *   - collapse single non-letters between letters ("f.u.c.k" -> "fuck")
 */
function normalizeForMatch(text: string): string {
  const lower = text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const deLeet = lower
    .replace(/[@4]/g, "a")
    .replace(/[!1|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/3/g, "e")
    .replace(/7/g, "t")
    .replace(/8/g, "b");
  return deLeet.replace(/([a-z])[^a-z0-9]+(?=[a-z])/g, "$1");
}

/**
 * Returns true if `text` contains disallowed content of ANY kind:
 *   profanity (incl. obfuscated variants), URLs/phone-like strings,
 *   character spam, or repeated-word spam.
 *
 * Name is preserved for backwards compatibility with /api/items.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const raw = String(text);

  if (URL_LIKE.test(raw)) return true;
  if (REPEATED_CHAR.test(raw)) return true;

  const normalized = normalizeForMatch(raw);
  if (REPEATED_WORD.test(normalized)) return true;

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const wordList = Array.from(PROFANITY);
  for (const t of tokens) {
    if (PROFANITY.has(t)) return true;
    // Substring hits ("fuckkkk", "shithead") after normalization.
    for (const word of wordList) {
      if (t.length >= word.length && t.includes(word)) return true;
    }
  }
  return false;
}

/** Trim + collapse internal whitespace. Run on user-supplied free text. */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}
