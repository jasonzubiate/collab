import type { Campaign } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CampaignPricing } from "@/lib/pricing/types";

/** Convert a Prisma Decimal | number to a plain number. */
export function decToNum(value: unknown): number {
  if (typeof value === "number") return value;
  return Number(value);
}

/** Map a Campaign row to the pure pricing inputs (all numbers). */
export function campaignToPricing(campaign: Campaign): CampaignPricing {
  return {
    minFollowers: campaign.minFollowers,
    minEngagementRate: decToNum(campaign.minEngagementRate),
    baseRatePer10kCents: campaign.baseRatePer10kCents,
    ratePerReelCents: campaign.ratePerReelCents,
    ratePerStoryCents: campaign.ratePerStoryCents,
    adUsage30DayMultiplier: decToNum(campaign.adUsage30DayMultiplier),
    adUsage90DayMultiplier: decToNum(campaign.adUsage90DayMultiplier),
  };
}

/** Public, safe-to-expose subset of a campaign for the intake page. */
export type PublicCampaign = {
  id: string;
  name: string;
  slug: string;
  brand: { companyName: string; slug: string };
  minFollowers: number;
  minEngagementRate: number;
};

export function toPublicCampaign(
  campaign: Campaign & { brand: { companyName: string; slug: string } },
): PublicCampaign {
  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    brand: campaign.brand,
    // Display-only thresholds; pricing rates are intentionally kept server-side.
    minFollowers: campaign.minFollowers,
    minEngagementRate: decToNum(campaign.minEngagementRate),
  };
}

export async function getActiveCampaignByBrandSlug(brandSlug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
  });
  if (!brand) return null;

  return prisma.campaign.findFirst({
    where: { brandId: brand.id, isActive: true },
    include: { brand: { select: { companyName: true, slug: true } } },
  });
}
