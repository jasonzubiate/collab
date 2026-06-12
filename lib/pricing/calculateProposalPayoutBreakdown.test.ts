import { describe, expect, it } from "vitest";
import { calculateProposalPayout } from "./calculateProposalPayout";
import { calculateProposalPayoutBreakdown } from "./calculateProposalPayoutBreakdown";
import type { CampaignPricing } from "./types";

const pricing: CampaignPricing = {
  minFollowers: 10_000,
  minEngagementRate: 2.0,
  baseRatePer10kCents: 10_000,
  ratePerReelCents: 25_000,
  ratePerStoryCents: 7_500,
  adUsage30DayMultiplier: 1.2,
  adUsage90DayMultiplier: 1.4,
};

const input = (overrides: {
  followerCount?: number;
  scope?: {
    reelsCount: number;
    storiesCount: number;
    adUsageDays: 0 | 30 | 90;
  };
}) => ({
  pricing,
  followerCount: overrides.followerCount ?? 50_000,
  scope: overrides.scope ?? {
    reelsCount: 2,
    storiesCount: 3,
    adUsageDays: 0 as const,
  },
});

describe("calculateProposalPayoutBreakdown", () => {
  it("matches calculateProposalPayout with no usage rights", () => {
    const args = input({});
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.totalCents).toBe(122_500);
    expect(breakdown.usageMultiplier).toBe(1);
    expect(breakdown.usageLabel).toBe("no ad usage");
  });

  it("applies the 30-day usage multiplier", () => {
    const args = input({
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 30 },
    });
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.totalCents).toBe(147_000);
    expect(breakdown.usageMultiplier).toBe(1.2);
  });

  it("applies the 90-day usage multiplier", () => {
    const args = input({
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 90 },
    });
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.totalCents).toBe(171_500);
    expect(breakdown.usageMultiplier).toBe(1.4);
  });

  it("handles zero reels", () => {
    const args = input({
      scope: { reelsCount: 0, storiesCount: 3, adUsageDays: 0 },
    });
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.reelsCents).toBe(0);
    expect(breakdown.reelsCount).toBe(0);
  });

  it("handles zero stories", () => {
    const args = input({
      scope: { reelsCount: 2, storiesCount: 0, adUsageDays: 0 },
    });
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.storiesCents).toBe(0);
    expect(breakdown.storiesCount).toBe(0);
  });

  it("rounds at the final boundary for edge follower counts", () => {
    const args = input({
      followerCount: 33_333,
      scope: { reelsCount: 1, storiesCount: 0, adUsageDays: 30 },
    });
    const breakdown = calculateProposalPayoutBreakdown(args);
    expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    expect(breakdown.totalCents).toBe(70_000);
  });

  it("preUsageCents is the sum of display line amounts", () => {
    const breakdown = calculateProposalPayoutBreakdown(input({}));
    expect(breakdown.preUsageCents).toBe(
      breakdown.baseCents + breakdown.reelsCents + breakdown.storiesCents,
    );
  });
});

describe("breakdown total parity with calculateProposalPayout", () => {
  const presets = [
    input({}),
    input({ scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 30 } }),
    input({ scope: { reelsCount: 0, storiesCount: 1, adUsageDays: 90 } }),
    input({
      followerCount: 38_000,
      scope: { reelsCount: 2, storiesCount: 1, adUsageDays: 30 },
    }),
    input({
      followerCount: 33_333,
      scope: { reelsCount: 1, storiesCount: 0, adUsageDays: 30 },
    }),
  ];

  it.each(presets.map((p, i) => [i, p] as const))(
    "preset %i totals match",
    (_index, args) => {
      const breakdown = calculateProposalPayoutBreakdown(args);
      expect(breakdown.totalCents).toBe(calculateProposalPayout(args));
    },
  );
});
