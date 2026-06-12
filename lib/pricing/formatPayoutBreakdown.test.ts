import { describe, expect, it } from "vitest";
import { calculateProposalPayoutBreakdown } from "./calculateProposalPayoutBreakdown";
import { formatPayoutBreakdown } from "./formatPayoutBreakdown";
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

describe("formatPayoutBreakdown", () => {
  it("formats the PRD appendix example shape", () => {
    const breakdown = calculateProposalPayoutBreakdown({
      pricing,
      followerCount: 38_000,
      scope: { reelsCount: 2, storiesCount: 1, adUsageDays: 30 },
    });
    const formatted = formatPayoutBreakdown(breakdown);
    expect(formatted).toContain("$380.00 base (38K followers)");
    expect(formatted).toContain("$500.00 reels");
    expect(formatted).toContain("$75.00 story");
    expect(formatted).toContain("× 1.2 (30-day paid ads)");
    expect(formatted).toContain("= $1,146.00");
  });

  it("omits zero-quantity deliverable segments", () => {
    const breakdown = calculateProposalPayoutBreakdown({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 0, storiesCount: 1, adUsageDays: 0 },
    });
    const formatted = formatPayoutBreakdown(breakdown);
    expect(formatted).not.toContain("reel");
    expect(formatted).toContain("story");
    expect(formatted).not.toContain("×");
  });

  it("pluralizes deliverable labels", () => {
    const breakdown = calculateProposalPayoutBreakdown({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 0 },
    });
    const formatted = formatPayoutBreakdown(breakdown);
    expect(formatted).toContain("reels");
    expect(formatted).toContain("stories");
  });

  it("omits usage multiplier segment when ad usage is none", () => {
    const breakdown = calculateProposalPayoutBreakdown({
      pricing,
      followerCount: 50_000,
      scope: { reelsCount: 1, storiesCount: 0, adUsageDays: 0 },
    });
    const formatted = formatPayoutBreakdown(breakdown);
    expect(formatted).not.toContain("×");
    expect(formatted).toMatch(/= \$[\d,]+\.\d{2}$/);
  });
});
