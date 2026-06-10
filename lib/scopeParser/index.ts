import { scopeParserProvider } from "@/lib/instagram/config";
import { LlmScopeParser } from "./llmProvider";
import { MockScopeParser } from "./mockProvider";
import type { ScopeParserProvider } from "./types";

export * from "./types";

/**
 * Returns the active scope-parser provider. Defaults to the deterministic mock
 * so everything runs offline; selects the LLM provider only when
 * `SCOPE_PARSER_PROVIDER === "llm"`. Mirrors `getEnrichmentProvider()`.
 *
 * Provider selection is independent of the `IG_LLM_SCOPE_ENABLED` flow flag:
 * the flag decides WHETHER free-text parsing runs at all; this decides WHICH
 * extractor backs it.
 */
export function getScopeParser(): ScopeParserProvider {
  if (scopeParserProvider() === "llm") return new LlmScopeParser();
  return new MockScopeParser();
}
