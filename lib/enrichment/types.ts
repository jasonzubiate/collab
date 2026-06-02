export type EnrichmentProviderName =
  | "mock"
  | "instagram_graph"
  | "modash"
  | "hypeauditor";

export type EnrichedCreatorProfile = {
  handle: string;
  followerCount: number;
  engagementRate: number;
  provider: EnrichmentProviderName;
  raw?: unknown;
};

export interface CreatorEnrichmentProvider {
  enrich(handle: string): Promise<EnrichedCreatorProfile>;
}
