import { describe, expect, it } from "vitest";
import {
  buildIneligibleCopyFragments,
  computeEligibilityGaps,
  formatIneligibleDmMessage,
  formatIneligibleMessage,
} from "./computeEligibilityGaps";

describe("computeEligibilityGaps", () => {
  it("computes follower gap when follower threshold failed", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      metrics: { followerCount: 38000, engagementRate: 4.1 },
      minFollowers: 40000,
      minEngagementRate: 2.0,
    });
    expect(gaps.followerGap).toBe(2000);
    expect(gaps.engagementGap).toBeNull();
  });

  it("computes engagement gap when engagement threshold failed", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: false,
      failedEngagementThreshold: true,
      metrics: { followerCount: 50000, engagementRate: 1.4 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    expect(gaps.followerGap).toBeNull();
    expect(gaps.engagementGap).toBeCloseTo(0.6, 5);
  });

  it("computes both gaps when both thresholds failed", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: true,
      metrics: { followerCount: 6500, engagementRate: 1.4 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    expect(gaps.followerGap).toBe(3500);
    expect(gaps.engagementGap).toBeCloseTo(0.6, 5);
  });

  it("returns null gaps when neither threshold failed", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: false,
      failedEngagementThreshold: false,
      metrics: { followerCount: 50000, engagementRate: 4.0 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    expect(gaps.followerGap).toBeNull();
    expect(gaps.engagementGap).toBeNull();
  });
});

describe("buildIneligibleCopyFragments", () => {
  it("formats follower gap compactly", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      metrics: { followerCount: 38000, engagementRate: 4.1 },
      minFollowers: 40000,
      minEngagementRate: 2.0,
    });
    const frags = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 38000, engagementRate: 4.1 },
      { minFollowers: 40000, minEngagementRate: 2.0 },
    );
    expect(frags.followerGapFormatted).toBe("2K");
    expect(frags.followerCountFormatted).toBe("38K");
    expect(frags.minFollowersFormatted).toBe("40K");
  });
});

describe("formatIneligibleMessage", () => {
  const campaignName = "Summer Drop";

  it("renders follower-only variant", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      metrics: { followerCount: 38000, engagementRate: 4.1 },
      minFollowers: 40000,
      minEngagementRate: 2.0,
    });
    const fragments = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 38000, engagementRate: 4.1 },
      { minFollowers: 40000, minEngagementRate: 2.0 },
    );
    const msg = formatIneligibleMessage(gaps, {
      ...fragments,
      creatorGreeting: " @maya",
      campaignName,
    });
    expect(msg).toContain("@maya");
    expect(msg).toContain("38K");
    expect(msg).toContain("2K short");
  });

  it("renders engagement-only variant", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: false,
      failedEngagementThreshold: true,
      metrics: { followerCount: 50000, engagementRate: 1.4 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    const fragments = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 50000, engagementRate: 1.4 },
      { minFollowers: 10000, minEngagementRate: 2.0 },
    );
    const msg = formatIneligibleMessage(gaps, {
      ...fragments,
      campaignName,
    });
    expect(msg).toContain("1.4%");
    expect(msg).toContain("below the 2.0% minimum");
  });

  it("renders both-failed variant", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: true,
      metrics: { followerCount: 6500, engagementRate: 1.4 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    const fragments = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 6500, engagementRate: 1.4 },
      { minFollowers: 10000, minEngagementRate: 2.0 },
    );
    const msg = formatIneligibleMessage(gaps, {
      ...fragments,
      campaignName,
    });
    expect(msg).toContain("10K+ followers");
    expect(msg).toContain("2.0%+ engagement");
    expect(msg).toContain("6.5K");
    expect(msg).toContain("1.4%");
  });

  it("falls back to generic copy when neither failed", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: false,
      failedEngagementThreshold: false,
      metrics: { followerCount: 50000, engagementRate: 4.0 },
      minFollowers: 10000,
      minEngagementRate: 2.0,
    });
    const fragments = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 50000, engagementRate: 4.0 },
      { minFollowers: 10000, minEngagementRate: 2.0 },
    );
    const msg = formatIneligibleMessage(gaps, { ...fragments, campaignName });
    expect(msg).toContain("not a fit right now");
  });
});

describe("formatIneligibleDmMessage", () => {
  it("appends DM CTA for failed thresholds", () => {
    const gaps = computeEligibilityGaps({
      failedFollowerThreshold: true,
      failedEngagementThreshold: false,
      metrics: { followerCount: 38000, engagementRate: 4.1 },
      minFollowers: 40000,
      minEngagementRate: 2.0,
    });
    const fragments = buildIneligibleCopyFragments(
      gaps,
      { followerCount: 38000, engagementRate: 4.1 },
      { minFollowers: 40000, minEngagementRate: 2.0 },
    );
    const msg = formatIneligibleDmMessage(gaps, {
      ...fragments,
      creatorGreeting: " @maya",
      campaignName: "Summer Drop",
    });
    expect(msg).toContain("SUBMIT ANYWAY");
    expect(msg).toContain("STOP");
  });
});
