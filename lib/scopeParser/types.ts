/**
 * Phase B: LLM free-text scope parsing (natural-language slot filling).
 *
 * A scope parser is an INTENT/SLOT extractor only. It maps a creator's free-form
 * message ("2 reels and a story, 60-day usage") into the three scope slots. It
 * MUST NEVER compute money, tiers, or touch the DB. Pricing and gatekeeping stay
 * 100% deterministic in `lib/pricing/*` via `estimateProposal`/`submitProposal`,
 * and any `ParsedScope` produced here is ALWAYS re-validated by the app's
 * `scopeSchema` (+ the empty-scope guard) before any pricing runs. This module is
 * the untrusted edge; the deterministic services are the source of truth.
 */

/** Extracted scope slots. `null` means "not confidently present in the message". */
export type ParsedScope = {
  reelsCount: number | null;
  storiesCount: number | null;
  adUsageDays: 0 | 30 | 90 | null;
  /** Self-reported extraction confidence, 0..1. */
  confidence: number;
  /** True when the parser could not extract a usable scope and the caller should
   * fall back to the deterministic numeric prompts. */
  needsClarification: boolean;
};

/**
 * Pluggable scope-parser provider, mirroring `CreatorEnrichmentProvider`.
 * Implementations must never throw: on any failure they return a low-confidence
 * `needsClarification` result so the conversation flow can fall back cleanly.
 */
export interface ScopeParserProvider {
  parse(message: string): Promise<ParsedScope>;
}
