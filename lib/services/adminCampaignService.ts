import type { Campaign } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decToNum } from "./campaignService";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/lib/validation/campaignSchemas";

/** JSON-safe campaign with Decimals converted to numbers. */
export function serializeCampaign(campaign: Campaign) {
  return {
    id: campaign.id,
    brandId: campaign.brandId,
    name: campaign.name,
    slug: campaign.slug,
    isActive: campaign.isActive,
    minFollowers: campaign.minFollowers,
    minEngagementRate: decToNum(campaign.minEngagementRate),
    baseRatePer10kCents: campaign.baseRatePer10kCents,
    ratePerReelCents: campaign.ratePerReelCents,
    ratePerStoryCents: campaign.ratePerStoryCents,
    adUsage30DayMultiplier: decToNum(campaign.adUsage30DayMultiplier),
    adUsage90DayMultiplier: decToNum(campaign.adUsage90DayMultiplier),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export async function listCampaigns(brandId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { brandId },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
  return campaigns.map(serializeCampaign);
}

export type SlugConflict = { error: "SLUG_TAKEN" };

export async function createCampaign(
  brandId: string,
  input: CreateCampaignInput,
) {
  const existing = await prisma.campaign.findUnique({
    where: { brandId_slug: { brandId, slug: input.slug } },
  });
  if (existing) return { error: "SLUG_TAKEN" } as const;

  const shouldActivate = input.isActive === true;

  const campaign = await prisma.$transaction(async (tx) => {
    if (shouldActivate) {
      await tx.campaign.updateMany({
        where: { brandId, isActive: true },
        data: { isActive: false },
      });
    }
    return tx.campaign.create({
      data: {
        brandId,
        name: input.name,
        slug: input.slug,
        isActive: shouldActivate,
        minFollowers: input.minFollowers,
        minEngagementRate: input.minEngagementRate,
        baseRatePer10kCents: input.baseRatePer10kCents,
        ratePerReelCents: input.ratePerReelCents,
        ratePerStoryCents: input.ratePerStoryCents,
        adUsage30DayMultiplier: input.adUsage30DayMultiplier,
        adUsage90DayMultiplier: input.adUsage90DayMultiplier,
      },
    });
  });

  return { campaign: serializeCampaign(campaign) };
}

export type CampaignMutationError =
  | { error: "NOT_FOUND" }
  | { error: "SLUG_TAKEN" };

export async function updateCampaign(
  brandId: string,
  campaignId: string,
  input: UpdateCampaignInput,
) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });
  if (!existing) return { error: "NOT_FOUND" } as const;

  if (input.slug && input.slug !== existing.slug) {
    const slugOwner = await prisma.campaign.findUnique({
      where: { brandId_slug: { brandId, slug: input.slug } },
    });
    if (slugOwner && slugOwner.id !== campaignId) {
      return { error: "SLUG_TAKEN" } as const;
    }
  }

  const shouldActivate = input.isActive === true;

  const campaign = await prisma.$transaction(async (tx) => {
    if (shouldActivate) {
      await tx.campaign.updateMany({
        where: { brandId, isActive: true, id: { not: campaignId } },
        data: { isActive: false },
      });
    }
    return tx.campaign.update({
      where: { id: campaignId },
      data: {
        name: input.name,
        slug: input.slug,
        isActive: input.isActive,
        minFollowers: input.minFollowers,
        minEngagementRate: input.minEngagementRate,
        baseRatePer10kCents: input.baseRatePer10kCents,
        ratePerReelCents: input.ratePerReelCents,
        ratePerStoryCents: input.ratePerStoryCents,
        adUsage30DayMultiplier: input.adUsage30DayMultiplier,
        adUsage90DayMultiplier: input.adUsage90DayMultiplier,
      },
    });
  });

  return { campaign: serializeCampaign(campaign) };
}

export async function activateCampaign(brandId: string, campaignId: string) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });
  if (!existing) return { error: "NOT_FOUND" } as const;

  const campaign = await prisma.$transaction(async (tx) => {
    await tx.campaign.updateMany({
      where: { brandId, isActive: true, id: { not: campaignId } },
      data: { isActive: false },
    });
    return tx.campaign.update({
      where: { id: campaignId },
      data: { isActive: true },
    });
  });

  return { campaign: serializeCampaign(campaign) };
}
