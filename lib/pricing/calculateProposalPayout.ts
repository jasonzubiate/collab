import type { CampaignPricing, RequestedScope, UsageDays } from "./types";

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

function usageMultiplier(
  adUsageDays: UsageDays,
  pricing: Pick<
    CampaignPricing,
    "adUsage30DayMultiplier" | "adUsage90DayMultiplier"
  >,
): number {
  if (adUsageDays === 30) return pricing.adUsage30DayMultiplier;
  if (adUsageDays === 90) return pricing.adUsage90DayMultiplier;
  return 1;
}

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
