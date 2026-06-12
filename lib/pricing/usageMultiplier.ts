import type { CampaignPricing, UsageDays } from "./types";

export function usageMultiplier(
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

export function usageLabel(adUsageDays: UsageDays): string {
  if (adUsageDays === 30) return "30-day paid ads";
  if (adUsageDays === 90) return "90-day paid ads";
  return "no ad usage";
}
