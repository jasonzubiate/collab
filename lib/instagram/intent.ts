/**
 * Keyword-based collab intent detection (PRD section 6, v1).
 *
 * English keyword/phrase matching on normalized inbound text. No secondary
 * classifier, no false-positive guardrails. `STOP` is detected separately and
 * always wins.
 */

const KEYWORDS: readonly string[] = [
  "collab",
  "collaboration",
  "partner",
  "partnership",
  "paid promo",
  "sponsored",
  "brand deal",
  "rate",
  "rates",
  "rate card",
  "media kit",
  "gifted",
  "pr package",
  "ambassador",
  "work together",
  "work with you",
];

/** Lowercase, collapse whitespace, strip punctuation (keep word chars/spaces). */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Case-insensitive STOP opt-out. Honored in every non-terminal state. */
export function isStopKeyword(text: string): boolean {
  return normalizeText(text) === "stop";
}

/** Case-insensitive START affirmation used to advance from the welcome state. */
export function isStartKeyword(text: string): boolean {
  return normalizeText(text) === "start";
}

/** True if the message contains any collab trigger keyword/phrase. */
export function hasCollabIntent(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  return KEYWORDS.some((keyword) => {
    if (keyword.includes(" ")) {
      // Multi-word phrases: substring match on normalized text.
      return normalized.includes(keyword);
    }
    // Single words: whole-word match so "ratepayer" doesn't trigger "rate".
    return new RegExp(`\\b${keyword}\\b`).test(normalized);
  });
}

export const INTENT_KEYWORDS = KEYWORDS;
