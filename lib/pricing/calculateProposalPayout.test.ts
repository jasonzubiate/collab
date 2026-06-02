import { describe, expect, it } from "vitest";
import { calculateProposalPayout } from "./calculateProposalPayout";
import type { CampaignPricing } from "./types";

const pricing: CampaignPricing = {
  minFollowers: 10_000,
  minEngagementRate: 2.0,
  baseRatePer10kCents: 10_000, // $100 per 10k followers
  ratePerReelCents: 25_000, // $250 per reel
  ratePerStoryCents: 7_500, // $75 per story
  adUsage30DayMultiplier: 1.2,
  adUsage90DayMultiplier: 1.4,
};

describe("calculateProposalPayout", () => {
  it("calculates payout with no usage rights", () => {
    // base: 50000/10000 * 10000 = 50000; deliverables: 2*25000 + 3*7500 = 72500
    const result = calculateProposalPayout({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 0 },
    });
    expect(result).toBe(122_500);
  });

  it("applies the 30-day usage multiplier", () => {
    // preUsage 122500 * 1.2 = 147000
    const result = calculateProposalPayout({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 30 },
    });
    expect(result).toBe(147_000);
  });

  it("applies the 90-day usage multiplier", () => {
    // preUsage 122500 * 1.4 = 171500
    const result = calculateProposalPayout({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 90 },
    });
    expect(result).toBe(171_500);
  });

  it("handles zero reels", () => {
    // base 50000; stories: 3*7500 = 22500 -> 72500
    const result = calculateProposalPayout({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 0, storiesCount: 3, adUsageDays: 0 },
    });
    expect(result).toBe(72_500);
  });

  it("handles zero stories", () => {
    // base 50000; reels: 2*25000 = 50000 -> 100000
    const result = calculateProposalPayout({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 2, storiesCount: 0, adUsageDays: 0 },
    });
    expect(result).toBe(100_000);
  });

  it("rounds to the nearest cent at the final boundary", () => {
    // base: 33333/10000 * 10000 = 33333; deliverable 1 reel = 25000 -> 58333
    // * 1.2 = 69999.6 -> rounds to 70000
    const result = calculateProposalPayout({
      pricing,
      followerCount: 33_333,
      scope: { reelsCount: 1, storiesCount: 0, adUsageDays: 30 },
    });
    expect(result).toBe(70_000);
    expect(Number.isInteger(result)).toBe(true);
  });
});
