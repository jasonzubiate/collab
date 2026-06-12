import type { CampaignPricing, RequestedScope } from "./types";
import { usageMultiplier } from "./usageMultiplier";

type CalculatePayoutInput = {
  pricing: Pick<
    CampaignPricing,
    | "baseRatePer10kCents"
    | "ratePerReelCents"
    | "ratePerStoryCents"
    | "adUsage30DayMultiplier"
    | "adUsage90DayMultiplier"
  >;
  followerCount: number;
  scope: RequestedScope;
};

/**
 * Pure payout calculation. Works in fractional cents internally and rounds to
 * the nearest whole cent at the final boundary (per PRD section 9).
 *
 * Returns an integer number of cents.
 */
export function calculateProposalPayout({
  pricing,
  followerCount,
  scope,
}: CalculatePayoutInput): number {
  const baseCreatorRate =
    (followerCount / 10000) * pricing.baseRatePer10kCents;

  const deliverableRate =
    scope.reelsCount * pricing.ratePerReelCents +
    scope.storiesCount * pricing.ratePerStoryCents;

  const preUsageTotal = baseCreatorRate + deliverableRate;

  const total = preUsageTotal * usageMultiplier(scope.adUsageDays, pricing);

  return Math.round(total);
}
