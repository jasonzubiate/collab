import {
  GREEN_ENGAGEMENT_THRESHOLD,
  type CampaignPricing,
  type CreatorMetrics,
  type MatchTier,
} from "./types";

type EvaluateInput = {
  pricing: Pick<CampaignPricing, "minFollowers" | "minEngagementRate">;
  metrics: CreatorMetrics;
};

export type EvaluationResult = {
  matchTier: MatchTier;
  /** True when the creator cleared both gatekeeper thresholds. */
  passedThresholds: boolean;
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
};

/**
 * Gatekeeper + match tier evaluation (PRD section 9).
 *
 * - ARCHIVED: failed follower or engagement threshold.
 * - GREEN: passed thresholds and engagementRate >= 3.5.
 * - YELLOW: passed thresholds and engagementRate < 3.5.
 */
export function evaluateProposal({
  pricing,
  metrics,
}: EvaluateInput): EvaluationResult {
  const failedFollowerThreshold =
    metrics.followerCount < pricing.minFollowers;
  const failedEngagementThreshold =
    metrics.engagementRate < pricing.minEngagementRate;

  const passedThresholds =
    !failedFollowerThreshold && !failedEngagementThreshold;

  let matchTier: MatchTier;
  if (!passedThresholds) {
    matchTier = "ARCHIVED";
  } else if (metrics.engagementRate >= GREEN_ENGAGEMENT_THRESHOLD) {
    matchTier = "GREEN";
  } else {
    matchTier = "YELLOW";
  }

  return {
    matchTier,
    passedThresholds,
    failedFollowerThreshold,
    failedEngagementThreshold,
  };
}
