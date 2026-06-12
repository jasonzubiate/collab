import { formatCompactNumber, formatEngagementRate } from "@/lib/money";
import type { CreatorMetrics, EligibilityGaps } from "./types";

type GapInput = {
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
  metrics: CreatorMetrics;
  minFollowers: number;
  minEngagementRate: number;
};

export function computeEligibilityGaps({
  failedFollowerThreshold,
  failedEngagementThreshold,
  metrics,
  minFollowers,
  minEngagementRate,
}: GapInput): EligibilityGaps {
  return {
    failedFollowerThreshold,
    failedEngagementThreshold,
    followerGap: failedFollowerThreshold
      ? Math.max(0, minFollowers - metrics.followerCount)
      : null,
    engagementGap: failedEngagementThreshold
      ? Math.max(0, minEngagementRate - metrics.engagementRate)
      : null,
  };
}

export type IneligibleCopyFragments = {
  minFollowersFormatted: string;
  minEngagement: string;
  followerCountFormatted: string;
  engagementRate: string;
  followerGapFormatted: string;
  engagementGapDescription: string;
};

export function buildIneligibleCopyFragments(
  gaps: EligibilityGaps,
  metrics: CreatorMetrics,
  thresholds: { minFollowers: number; minEngagementRate: number },
): IneligibleCopyFragments {
  const followerGapFormatted =
    gaps.followerGap != null ? formatCompactNumber(gaps.followerGap) : "";

  let engagementGapDescription = "";
  if (gaps.engagementGap != null) {
    const gapFormatted = formatEngagementRate(gaps.engagementGap);
    const minFormatted = formatEngagementRate(thresholds.minEngagementRate);
    engagementGapDescription = `${gapFormatted} below the ${minFormatted} minimum`;
  }

  return {
    minFollowersFormatted: formatCompactNumber(thresholds.minFollowers),
    minEngagement: thresholds.minEngagementRate.toFixed(1),
    followerCountFormatted: formatCompactNumber(metrics.followerCount),
    engagementRate: metrics.engagementRate.toFixed(1),
    followerGapFormatted,
    engagementGapDescription,
  };
}

export type IneligibleMessageInput = IneligibleCopyFragments & {
  creatorGreeting?: string;
  campaignName: string;
};

/**
 * Shared ineligible copy for web intake and DM. Selects variant by which
 * thresholds failed.
 */
export function formatIneligibleMessage(
  gaps: EligibilityGaps,
  input: IneligibleMessageInput,
): string {
  const greeting = input.creatorGreeting ?? "";

  if (gaps.failedFollowerThreshold && gaps.failedEngagementThreshold) {
    return `Hey${greeting} — for ${input.campaignName}, this campaign needs ${input.minFollowersFormatted}+ followers and ${input.minEngagement}%+ engagement. You're at ${input.followerCountFormatted} and ${input.engagementRate}% engagement. You can still send your details for the brand to keep on file.`;
  }

  if (gaps.failedFollowerThreshold) {
    return `Hey${greeting} — for ${input.campaignName}, we're looking for creators with at least ${input.minFollowersFormatted} followers. You're at ${input.followerCountFormatted} (about ${input.followerGapFormatted} short). You can still send your details for the brand to keep on file.`;
  }

  if (gaps.failedEngagementThreshold) {
    return `Hey${greeting} — for ${input.campaignName}, we need at least ${input.minEngagement}% engagement. Yours is ${input.engagementRate}% (${input.engagementGapDescription}). You can still send your details for the brand to keep on file.`;
  }

  return `Based on this campaign's criteria (${input.minFollowersFormatted}+ followers, ${input.minEngagement}%+ engagement), you're not a fit right now. You can still send your details for the brand to keep on file.`;
}

/**
 * DM variant with SUBMIT ANYWAY / STOP CTA appended.
 */
export function formatIneligibleDmMessage(
  gaps: EligibilityGaps,
  input: IneligibleMessageInput,
): string {
  const base = formatIneligibleMessage(gaps, input);
  if (
    gaps.failedFollowerThreshold ||
    gaps.failedEngagementThreshold
  ) {
    return `${base} Reply SUBMIT ANYWAY to save your details and get a rate estimate, or STOP.`;
  }
  return `${base} Reply SUBMIT to save your details anyway, or STOP.`;
}
