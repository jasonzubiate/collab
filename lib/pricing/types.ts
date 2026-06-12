export type UsageDays = 0 | 30 | 90;

export type CampaignPricing = {
  minFollowers: number;
  minEngagementRate: number;
  baseRatePer10kCents: number;
  ratePerReelCents: number;
  ratePerStoryCents: number;
  adUsage30DayMultiplier: number;
  adUsage90DayMultiplier: number;
};

export type CreatorMetrics = {
  followerCount: number;
  engagementRate: number;
};

export type RequestedScope = {
  reelsCount: number;
  storiesCount: number;
  adUsageDays: UsageDays;
};

export type MatchTier = "GREEN" | "YELLOW" | "ARCHIVED";

/** Engagement rate at/above which a qualifying proposal is GREEN. */
export const GREEN_ENGAGEMENT_THRESHOLD = 3.5;

export type PayoutBreakdown = {
  /** Integer cents; same rounding boundary as calculateProposalPayout. */
  totalCents: number;
  followerCount: number;
  baseCents: number;
  reelsCount: number;
  reelsCents: number;
  storiesCount: number;
  storiesCents: number;
  preUsageCents: number;
  adUsageDays: UsageDays;
  usageMultiplier: number;
  usageLabel: string;
};

export type EligibilityGaps = {
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
  followerGap: number | null;
  engagementGap: number | null;
};
