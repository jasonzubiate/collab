import { calculateProposalPayout } from "./calculateProposalPayout";
import type { CampaignPricing, PayoutBreakdown, RequestedScope } from "./types";
import { usageLabel, usageMultiplier } from "./usageMultiplier";

type BreakdownInput = {
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
 * Itemized view over the same inputs as {@link calculateProposalPayout}.
 * Display line amounts are rounded individually; totalCents uses the single
 * authoritative boundary round on preUsageTotal × multiplier.
 */
export function calculateProposalPayoutBreakdown({
  pricing,
  followerCount,
  scope,
}: BreakdownInput): PayoutBreakdown {
  const baseUnrounded =
    (followerCount / 10000) * pricing.baseRatePer10kCents;
  const reelsUnrounded = scope.reelsCount * pricing.ratePerReelCents;
  const storiesUnrounded = scope.storiesCount * pricing.ratePerStoryCents;

  const preUsageTotal = baseUnrounded + reelsUnrounded + storiesUnrounded;
  const multiplier = usageMultiplier(scope.adUsageDays, pricing);

  const baseCents = Math.round(baseUnrounded);
  const reelsCents = Math.round(reelsUnrounded);
  const storiesCents = Math.round(storiesUnrounded);

  const totalCents = calculateProposalPayout({
    pricing,
    followerCount,
    scope,
  });

  return {
    totalCents,
    followerCount,
    baseCents,
    reelsCount: scope.reelsCount,
    reelsCents,
    storiesCount: scope.storiesCount,
    storiesCents,
    preUsageCents: baseCents + reelsCents + storiesCents,
    adUsageDays: scope.adUsageDays,
    usageMultiplier: multiplier,
    usageLabel: usageLabel(scope.adUsageDays),
  };
}
