/**
 * Deterministic, network-free scope parser used as the default provider so all
 * tests run offline and reproducibly. Uses simple regex/keyword extraction — it
 * is NOT a substitute for the LLM provider, just a dependable fallback and the
 * fixture all unit tests exercise.
 *
 * Like every provider here, it only extracts slots. It never prices anything.
 */
import { normalizeParsedScope, type RawParsedScope } from "./schema";
import type { ParsedScope, ScopeParserProvider } from "./types";

const REELS_RE = /(\d+)\s*reels?/i;
// Optional leading count; a bare "a story"/"story"/"stories" implies one.
const STORIES_RE = /(\d+)?\s*stor(?:y|ies)/i;
const USAGE_DAYS_RE = /(\d+)\s*[- ]?day/i;
const NO_USAGE_RE = /\b(?:no usage|no ad usage|none|no rights)\b/i;

function extractReels(text: string): number | null {
  const match = REELS_RE.exec(text);
  if (!match) return null;
  return Number(match[1]);
}

function extractStories(text: string): number | null {
  const match = STORIES_RE.exec(text);
  if (!match) return null;
  // "2 stories" → 2; bare "a story" / "story" → 1.
  return match[1] === undefined ? 1 : Number(match[1]);
}

function extractUsage(text: string): number | null {
  if (NO_USAGE_RE.test(text)) return 0;
  const match = USAGE_DAYS_RE.exec(text);
  if (!match) return null;
  // Raw days; normalizeParsedScope snaps to {0,30,90} or flags clarification.
  return Number(match[1]);
}

export class MockScopeParser implements ScopeParserProvider {
  async parse(message: string): Promise<ParsedScope> {
    const text = message.trim();

    const reelsCount = extractReels(text);
    const storiesCount = extractStories(text);
    const adUsageDays = extractUsage(text);

    const slotsFound =
      Number(reelsCount !== null) +
      Number(storiesCount !== null) +
      Number(adUsageDays !== null);

    // Confidence scales with how many of the three slots were extracted.
    const confidence =
      slotsFound === 3 ? 0.9 : slotsFound === 2 ? 0.7 : slotsFound === 1 ? 0.5 : 0;

    const raw: RawParsedScope = {
      reelsCount: reelsCount === null ? null : Math.max(0, Math.min(5, reelsCount)),
      storiesCount:
        storiesCount === null ? null : Math.max(0, Math.min(5, storiesCount)),
      adUsageDays,
      confidence,
      needsClarification: slotsFound === 0,
    };

    return normalizeParsedScope(raw);
  }
}
