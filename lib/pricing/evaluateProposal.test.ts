import { describe, expect, it } from "vitest";
import { evaluateProposal } from "./evaluateProposal";

const pricing = { minFollowers: 10_000, minEngagementRate: 2.0 };

describe("evaluateProposal", () => {
  it("archives when below the follower threshold", () => {
    const result = evaluateProposal({
      pricing,
      metrics: { followerCount: 5_000, engagementRate: 5.0 },
    });
    expect(result.matchTier).toBe("ARCHIVED");
    expect(result.failedFollowerThreshold).toBe(true);
    expect(result.passedThresholds).toBe(false);
  });

  it("archives when below the engagement threshold", () => {
    const result = evaluateProposal({
      pricing,
      metrics: { followerCount: 50_000, engagementRate: 1.5 },
    });
    expect(result.matchTier).toBe("ARCHIVED");
    expect(result.failedEngagementThreshold).toBe(true);
    expect(result.passedThresholds).toBe(false);
  });

  it("is GREEN when thresholds pass and engagement >= 3.5", () => {
    const result = evaluateProposal({
      pricing,
      metrics: { followerCount: 50_000, engagementRate: 3.5 },
    });
    expect(result.matchTier).toBe("GREEN");
    expect(result.passedThresholds).toBe(true);
  });

  it("is YELLOW when thresholds pass but engagement < 3.5", () => {
    const result = evaluateProposal({
      pricing,
      metrics: { followerCount: 50_000, engagementRate: 3.49 },
    });
    expect(result.matchTier).toBe("YELLOW");
    expect(result.passedThresholds).toBe(true);
  });

  it("treats exactly-at-threshold values as passing", () => {
    const result = evaluateProposal({
      pricing,
      metrics: { followerCount: 10_000, engagementRate: 2.0 },
    });
    expect(result.passedThresholds).toBe(true);
    expect(result.matchTier).toBe("YELLOW");
  });
});
