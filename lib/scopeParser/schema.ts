/**
 * Zod schema + normalization for RAW scope-parser output (LLM or mock).
 *
 * This validates the *shape* of an extractor's JSON and snaps loose values into
 * the canonical slot vocabulary. It is intentionally pure and unit-testable.
 *
 * IMPORTANT: this is NOT the final pricing authority. Even after this passes,
 * the conversation service re-validates the resulting scope with the app's
 * `scopeSchema` (incl. the reels+stories>=1 empty-scope guard) before any
 * deterministic pricing call. Keep that boundary intact.
 */
import { z } from "zod";
import type { ParsedScope } from "./types";

/**
 * Schema for the raw JSON an extractor emits. Counts are nullable ints 0-5;
 * `adUsageDays` is a nullable raw number (NOT yet snapped to {0,30,90} — that
 * happens in `normalizeParsedScope`); confidence is 0..1.
 */
export const rawParsedScopeSchema = z.object({
  reelsCount: z.number().int().min(0).max(5).nullable(),
  storiesCount: z.number().int().min(0).max(5).nullable(),
  adUsageDays: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
});

export type RawParsedScope = z.infer<typeof rawParsedScopeSchema>;

/** A definitively "unparseable" result the caller can fall back from. */
export const UNPARSEABLE_SCOPE: ParsedScope = {
  reelsCount: null,
  storiesCount: null,
  adUsageDays: null,
  confidence: 0,
  needsClarification: true,
};

/** Snap a raw usage-days number to the canonical {0,30,90} vocabulary. */
function snapUsageDays(value: number | null): {
  adUsageDays: 0 | 30 | 90 | null;
  ambiguous: boolean;
} {
  if (value === null) return { adUsageDays: null, ambiguous: false };
  if (value === 0 || value === 30 || value === 90) {
    return { adUsageDays: value, ambiguous: false };
  }
  // Anything else (e.g. 60) is not a supported tier — flag for clarification.
  return { adUsageDays: null, ambiguous: true };
}

/**
 * Normalize a validated raw extraction into a `ParsedScope`:
 * - snaps `adUsageDays` to {0,30,90}; out-of-vocabulary values become `null`
 *   and force `needsClarification = true`,
 * - clamps counts into 0-5 (the schema already guarantees the range; this is a
 *   defensive belt-and-suspenders for callers that bypass the schema).
 * Pure and deterministic.
 */
export function normalizeParsedScope(raw: RawParsedScope): ParsedScope {
  const { adUsageDays, ambiguous } = snapUsageDays(raw.adUsageDays);

  const clamp = (n: number | null): number | null =>
    n === null ? null : Math.max(0, Math.min(5, Math.trunc(n)));

  return {
    reelsCount: clamp(raw.reelsCount),
    storiesCount: clamp(raw.storiesCount),
    adUsageDays,
    confidence: raw.confidence,
    needsClarification: raw.needsClarification || ambiguous,
  };
}

/**
 * Parse + validate + normalize an extractor's raw JSON STRING into a
 * `ParsedScope`. Returns `UNPARSEABLE_SCOPE` on any parse/validation failure so
 * network-free unit tests can exercise the full LLM decoding path. Never throws.
 */
export function parseLlmResponse(text: string): ParsedScope {
  let candidate: unknown;
  try {
    candidate = JSON.parse(extractJsonBlock(text));
  } catch {
    return UNPARSEABLE_SCOPE;
  }
  const result = rawParsedScopeSchema.safeParse(candidate);
  if (!result.success) return UNPARSEABLE_SCOPE;
  return normalizeParsedScope(result.data);
}

/**
 * Best-effort extraction of the first top-level JSON object from a model reply,
 * tolerating ```json fences or leading prose. Returns the input unchanged when
 * no object is found (JSON.parse will then fail and the caller falls back).
 */
function extractJsonBlock(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}
