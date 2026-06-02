import type {
  CreatorEnrichmentProvider,
  EnrichedCreatorProfile,
} from "./types";

const FOLLOWER_MIN = 2_000;
const FOLLOWER_MAX = 150_000;
const ENGAGEMENT_MIN = 0.5;
const ENGAGEMENT_MAX = 6.0;

/** Deterministic 32-bit FNV-1a hash so the same handle yields stable metrics. */
function hashHandle(handle: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < handle.length; i += 1) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Force unsigned.
  return hash >>> 0;
}

/** Produce two independent [0,1) pseudo-random values from one seed. */
function seededUnitValues(seed: number): [number, number] {
  const a = (seed % 100_000) / 100_000;
  const mixed = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  const b = (mixed % 100_000) / 100_000;
  return [a, b];
}

/**
 * Mock enrichment provider. Returns realistic, deterministic public metrics
 * derived from the (normalized) handle so estimates and final proposals stay
 * predictable across repeated submissions and tests.
 */
export class MockEnrichmentProvider implements CreatorEnrichmentProvider {
  async enrich(handle: string): Promise<EnrichedCreatorProfile> {
    const normalized = handle.trim().replace(/^@/, "").toLowerCase();
    const seed = hashHandle(normalized);
    const [followerUnit, engagementUnit] = seededUnitValues(seed);

    const followerCount =
      FOLLOWER_MIN +
      Math.floor(followerUnit * (FOLLOWER_MAX - FOLLOWER_MIN + 1));

    const engagementRate =
      Math.round(
        (ENGAGEMENT_MIN +
          engagementUnit * (ENGAGEMENT_MAX - ENGAGEMENT_MIN)) *
          100,
      ) / 100;

    return {
      handle: normalized,
      followerCount,
      engagementRate,
      provider: "mock",
      raw: { seed, generatedAt: new Date().toISOString() },
    };
  }
}
