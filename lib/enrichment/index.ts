import { MockEnrichmentProvider } from "./mockProvider";
import type { CreatorEnrichmentProvider } from "./types";

export * from "./types";

/**
 * Returns the active enrichment provider. The MVP always uses the mock
 * provider; future providers (Instagram Graph, Modash, HypeAuditor) can be
 * selected here behind the same interface without touching call sites.
 */
export function getEnrichmentProvider(): CreatorEnrichmentProvider {
  return new MockEnrichmentProvider();
}
